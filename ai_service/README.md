# ai_service

Retrieval-augmented generation over the JAAZ knowledge base.

A FastAPI service that owns everything AI in this system: the vector store,
the embedding model, hybrid retrieval, reranking, prompt construction,
generation, provider fallback and citations. It holds every AI credential in
the product and is the only process that does.

---

## 1. Where this sits

```
   Browser                Django                  ai_service
   ───────                ──────                  ──────────
   session cookie   →   authenticates        →   shared bearer token
   no credentials       owns conversations       owns Qdrant + LLM keys
   no knowledge of      owns documents           stores nothing
   Qdrant/Gemini/HF     owns users               stateless, scales flat
```

Three rules follow from that picture, and most of the design follows from
them:

**The browser never talks to this service.** It talks to Django, which
authenticates the session and forwards the question with the user's identity
attached. No script on a page is ever within reach of a Qdrant key, a Gemini
key or a Hugging Face token.

**This service stores nothing.** Conversations, messages and documents live
in Django's database, beside the accounts they belong to — one set of access
rules rather than two that can disagree, one backup, one place to answer a
deletion request. Relevant turns arrive in the request body. That is what
lets this service be redeployed without a migration and scaled horizontally
with no shared state.

**Identity is asserted by Django, not by the caller.** The shared token
proves the request came from the backend that holds the session. The
`X-Jaaz-Tenant-Id` and `X-Jaaz-User-Id` headers are believed *because* of
that token, and they are the only thing a Qdrant filter is ever built from.
Nothing downstream reads a tenant out of a request body.

---

## 2. Request flow

```
question
  │
  ├─ validate, resolve against conversation history
  │    └─ rewrite only when the question cannot stand alone
  │
  ├─ hybrid retrieval ──┬─ dense   embed → Qdrant cosine, top 30
  │  (both concurrently)└─ sparse  tokenise → Qdrant IDF, top 30
  │                        │
  │                     RRF (k=60, weighted)
  │                        │
  │                     cross-encoder rerank, top 20 → top 6
  │
  ├─ build context: sanitise, deduplicate, fit the character budget
  ├─ grounded prompt: documents as data, never as instructions
  ├─ generate: primary provider, fallback on the right failures only
  └─ citations resolved against what was actually retrieved
```

The two searches run under one `asyncio.gather`, so hybrid retrieval costs
roughly what a single search costs. If one half fails the other still
answers — only both failing is an error.

---

## 3. Layout

```
app/
├── main.py                    FastAPI app; everything expensive in the lifespan
├── api/
│   ├── dependencies.py        auth, identity, rate limiting, resource injection
│   ├── middleware.py          request ids, structured access logs, error shape
│   └── v1/
│       ├── chat.py            POST /chat, POST /chat/stream
│       ├── knowledge_base.py  POST + DELETE documents (called by Django's worker)
│       ├── retrieval.py       POST /retrieval/search (the console's search box)
│       └── health.py          live, ready, summary
├── core/
│   ├── config.py              every tunable value, typed, validated at import
│   ├── lifecycle.py           the expensive objects, built once
│   ├── security.py            shared-token verification, CallerIdentity
│   ├── logging.py             structured logs, request context, Stopwatch
│   └── exceptions.py          the error taxonomy and its wire envelope
├── modules/
│   ├── chat/                  request → answer or SSE stream
│   ├── rag/                   pipeline, context builder, prompts, citations
│   ├── retrieval/             hybrid search, RRF, reranking, query rewriting
│   ├── embeddings/            BGE behind an interface; dense + sparse
│   ├── llm/                   Gemini, Groq/xAI, fallback, factory
│   ├── vector_store/          Qdrant behind an interface; metadata filters
│   └── indexing/              chunks in, vectors in Qdrant
├── workers/                   the reindex worker, its queue, its jobs
└── shared/                    domain types used across modules

tests/
├── unit/          fusion, citations, context, filters, fallback, rewriting
├── integration/   the API through its real dependency graph, fakes at the edge
└── evaluation/    retrieval and answer quality against a labelled dataset
```

`modules/` are modules, not services. Retrieval calling embeddings is a
function call, not an HTTP request — splitting them into separate deployables
would buy nothing and cost a network hop, a failure mode and a deployment
unit each.

---

## 4. Providers

| Concern | Implementation | Swapped by |
|---|---|---|
| Embeddings | `BAAI/bge-base-en-v1.5`, 768-d, L2-normalised | `EMBEDDING__PROVIDER` |
| Vector store | Qdrant Cloud, cosine | a new `VectorStore` implementation |
| Reranker | `BAAI/bge-reranker-base` cross-encoder | `RERANKER__PROVIDER` |
| Primary LLM | Gemini | `LLM__PRIMARY` |
| Fallback LLM | Groq (xAI also supported) | `LLM__FALLBACK` |

Embeddings run either as `sentence_transformers` (in-process, needs
`requirements-local-models.txt`) or `huggingface_api` (hosted). Both use the
same model and produce interchangeable vectors, so switching does **not**
require reindexing. The local provider costs ~1.5GB of disk and gives no
network hop, no cold starts, no rate limit, and document text that never
leaves the machine.

Fallback is deliberate, not blanket. A timeout, a 5xx, a rate limit or a
connection failure moves to the next provider. A malformed request does not —
the second provider would reject it identically, for twice the latency.

---

## 5. Running it

### Locally, without Docker

```bash
cd ai_service
python -m venv venv
venv/Scripts/pip install -r requirements.txt        # Windows
# venv/bin/pip install -r requirements.txt          # POSIX

cp .env.example .env        # then fill in the keys
venv/Scripts/python -m uvicorn app.main:app --port 8001 --reload
```

The worker is a separate process and only needed for a reindex:

```bash
venv/Scripts/python -m app.workers.worker           # serve the queue
venv/Scripts/python -m app.workers.worker reindex   # one pass, then exit
```

### With Docker

```bash
docker compose up --build                            # API + worker + Qdrant
docker compose --profile local-models up --build api-local-models
```

Compose runs a local Qdrant, so `QDRANT__URL` is overridden to the service
name; everything else comes from your `.env`. It deliberately does **not**
run Django, Postgres or the frontend — those have their own lifecycles, and
one compose file spanning all of them has to be restarted in full to change a
setting in any of them.

### The whole product

Four processes, in this order:

```bash
# 1. ai_service
cd ai_service && venv/Scripts/python -m uvicorn app.main:app --port 8001

# 2. Django
cd server/Jaaz && ../venv/Scripts/python manage.py migrate
                 ../venv/Scripts/python manage.py runserver 8000

# 3. the knowledge-base worker (only with RAG_TASK_DISPATCH=worker)
cd server/Jaaz && ../venv/Scripts/python manage.py process_documents

# 4. the frontend
cd client && npm run dev        # proxies /api to 127.0.0.1:8000
```

Then sign in at `/account/login` and open **Assistant** in the console.

---

## 6. API

Every route below `/api/v1` requires the shared bearer token and the identity
headers. The health probes do not.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/chat` | A complete answer |
| `POST` | `/api/v1/chat/stream` | The same answer as Server-Sent Events |
| `POST` | `/api/v1/knowledge-base/documents` | Embed and index a document's chunks |
| `DELETE` | `/api/v1/knowledge-base/documents/{id}` | Remove a document from the index |
| `POST` | `/api/v1/retrieval/search` | Retrieval without generation |
| `GET` | `/health/live` | Is the process up |
| `GET` | `/health/ready` | Should traffic be routed here |
| `GET` | `/health` | What is configured and reachable |

### Streaming protocol

```
event: message_start     { conversationId, messageId }
event: sources           { sources: [...] }        ← before the first token
event: token             { delta: "…" }            ← new text only, never cumulative
event: message_complete  { answer, sources, metadata }
event: error             { error: { code, message } }
: keepalive                                        ← comment frame; clients ignore it
```

`sources` arrives as soon as retrieval finishes, which is typically a second
or two before the first token — that is what lets the UI show source cards
while the model is still starting.

`message_complete` carries the authoritative answer. It is the streamed text
with any citation marker the model invented removed, so a client should
replace what it accumulated rather than append to it.

---

## 7. Configuration

Every value is in `.env.example` with a comment explaining what it does and
what happens if it is wrong. Nested settings use a double underscore:
`QDRANT__API_KEY` sets `Settings.qdrant.api_key`.

The ones without a safe default:

```
SECURITY__SERVICE_TOKEN     shared secret; required in production
QDRANT__URL, QDRANT__API_KEY
EMBEDDING__API_KEY          hosted provider only
LLM__GEMINI__API_KEY
LLM__GROQ__API_KEY
```

Cross-field validation runs at import, so a mistake fails at startup with a
message naming the variable rather than at 3am inside a retrieval call:

- `QDRANT__VECTOR_SIZE` must equal `EMBEDDING__DIMENSIONS`. A collection
  whose width disagrees with the model accepts nothing and explains nothing.
- `LLM__FALLBACK` must differ from `LLM__PRIMARY`. Falling back to the
  provider that just failed is not a fallback.
- `RETRIEVAL__FINAL_CONTEXT_CHUNKS` cannot exceed `RETRIEVAL__RERANK_TOP_K`.
- In production, a service token and a primary-provider key are mandatory.
  The process refuses to start without them.

**Never commit a real key.** `.env` is git-ignored and docker-ignored;
`.env.example` holds placeholders only. Secrets are injected at run time, not
baked into an image — anyone who can run `docker history` can read a build
argument.

---

## 8. Accuracy dials

All in `RETRIEVAL__*`, all tuned together rather than individually:

| Setting | Default | Effect |
|---|---|---|
| `DENSE_TOP_K` / `SPARSE_TOP_K` | 30 / 30 | Candidates from each retriever |
| `FUSION_K` | 60 | RRF smoothing; lower sharpens top ranks |
| `DENSE_WEIGHT` / `SPARSE_WEIGHT` | 1.0 / 1.0 | Raise sparse for part numbers and codes, dense for prose |
| `RERANK_TOP_K` | 20 | What the cross-encoder scores — the main latency/quality dial |
| `FINAL_CONTEXT_CHUNKS` | 6 | What reaches the prompt |
| `SIMILARITY_THRESHOLD` | 0.30 | Dense cosine floor, applied before fusion |
| `MAX_CONTEXT_CHARACTERS` | 12000 | Guards the window and the bill |

Raising `DENSE_TOP_K` without raising `RERANK_TOP_K` only gives the reranker
more to discard.

---

## 9. Tests

```bash
venv/Scripts/python -m pytest tests            # everything
venv/Scripts/python -m pytest tests/unit       # pure logic, fast
venv/Scripts/python -m pytest -m evaluation -s # quality report
```

No test calls a paid API. Providers are faked at the HTTP boundary with
`respx`, so the request this service actually builds is asserted — a mocked
client would only assert that the mock was called.

`tests/evaluation/` measures retrieval quality (hit rate, recall, precision,
MRR, NDCG) and answer quality (groundedness, citation correctness) against a
labelled dataset, and prints a per-question report. It compares dense, sparse
and hybrid retrieval side by side, which is the evidence for the hybrid
design rather than an assertion of it. It is a report, not a pass/fail gate.

---

## 10. Two things deliberately not used

### No LangChain

It earns its place for heterogeneous document loading and for swapping
between many providers behind one interface. Here, document loading is
Django's job — it owns the file bytes and has a tested extraction pipeline —
and there are two LLM providers, both reached over plain REST with `httpx`.
What LangChain would add is an abstraction layer over four HTTP calls, plus a
dependency whose own interfaces have changed shape repeatedly, plus friction
at exactly the point that matters most: token streaming interleaved with
provider fallback. The direct implementation is smaller, faster to read, and
fully covered by tests.

### No LangGraph

The pipeline has two conditional branches (rewrite-or-not,
context-or-no-context), one parallel step (`asyncio.gather` over two
searches, one line), and a state object that is a dataclass. LangGraph earns
its complexity on workflows with cycles, human-in-the-loop interrupts,
checkpointed resumption, or a dozen interacting nodes. None of those apply.

If graph-level tooling is wanted later — visualisation, per-node
checkpointing, interrupts — `modules/rag/pipeline.py` is the only file that
changes. Every stage in it is already an injected collaborator with its own
tests.

---

## 11. Known limitations

Honest list, in rough order of how soon each will matter.

**Rate limiting is per-process.** `SlidingWindowRateLimiter` counts in
memory: correct for one instance, an approximation for two, and reset by a
restart. It exists because an unlimited chat endpoint is an unlimited bill.
A shared Redis counter is the upgrade; the class is the seam for it.

**The reindex queue is not durable.** `InMemoryJobQueue` loses jobs on
restart. Acceptable for the one job it runs — a reindex is idempotent,
restartable and operator-initiated — and unacceptable for anything where loss
matters. `JobQueue` is the interface to implement.

**Document ingestion is driven by Django, not by this service's worker.**
Django's `process_documents` command already claims rows with
`SELECT … FOR UPDATE SKIP LOCKED`, survives restarts, reclaims work abandoned
by a dead worker and counts attempts. Putting a second queue behind it would
mean Django could no longer distinguish a document it marked READY from one
still sitting in this service's queue — a status-tracking problem in exchange
for latency no user experiences, since their request ended before Django's
worker picked the document up.

**One tenant.** `tenant_id` is threaded through identity, filters and every
Qdrant query, and is `"default"` everywhere. Adding a second tenant is a data
change, not an audit of every query — which was the point of building it in
now.

**No distributed tracing.** Logs are structured and carry a request id
through every stage, which is enough to reconstruct one request. Correlating
across Django and this service means matching ids by hand. OpenTelemetry is
the obvious addition and nothing here obstructs it.

**Answer quality depends on chunking, which lives in Django.** The retrieval
metrics in `tests/evaluation/` measure this service. If answers are poor and
retrieval scores are good, the chunk boundaries are the place to look —
`server/Jaaz/knowledge_base/ingestion/chunker.py`.

**Sparse retrieval is term-frequency, not BM25 or SPLADE.** Vectors are built
here and scored by Qdrant's IDF modifier. That is genuinely good at the thing
sparse retrieval is for — part numbers, SKUs, exact phrases — and is not a
learned sparse model. A change here invalidates every stored sparse vector
and needs a reindex.
