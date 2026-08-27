import { useCallback, useRef, useState } from 'react'

import { knowledgeBaseApi } from '../api/knowledgeBaseApi'

/* An upload queue with per-file progress.
 *
 * Files are sent one at a time rather than in parallel. Three 20MB uploads
 * racing each other finish no sooner than three in sequence on the same
 * connection, and each one holds a server worker while it is being validated
 * and stored. Sequential also means the progress bar means something.
 *
 * Every failure is kept against its own file. A rejected fourth file must not
 * discard the three that succeeded — the viewer needs to see which one the
 * server refused, and why.
 *
 * THE REF IS NOT AN OPTIMISATION. The upload loop has to read the current
 * queue, and a `useState` value is a snapshot from the render that created
 * the callback. Reading it inside a state updater does not work either:
 * React defers updaters until the next render, so the loop ran against an
 * empty list and uploaded nothing at all. The ref is the queue; `items` is
 * the copy React renders from, and every mutation writes both. */

const PENDING = 'pending'
const UPLOADING = 'uploading'
const DONE = 'done'
const FAILED = 'failed'

export const UPLOAD_STATE = { PENDING, UPLOADING, DONE, FAILED }

let nextId = 0

export function useUpload({ onUploaded } = {}) {
  const itemsRef = useRef([])
  const [items, setItems] = useState([])
  const [running, setRunning] = useState(false)
  const abortRef = useRef(null)

  /* The single write path. Keeping the ref and the state in step here means
   * no caller has to remember to update both. */
  const commit = useCallback((change) => {
    itemsRef.current = change(itemsRef.current)
    setItems(itemsRef.current)
  }, [])

  const patch = useCallback(
    (id, changes) =>
      commit((current) =>
        current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      ),
    [commit],
  )

  const enqueue = useCallback(
    (files) => {
      const added = Array.from(files).map((file) => ({
        id: (nextId += 1),
        file,
        name: '',
        state: PENDING,
        progress: 0,
        error: null,
        document: null,
      }))
      commit((current) => [...current, ...added])
    },
    [commit],
  )

  const remove = useCallback(
    (id) => commit((current) => current.filter((item) => item.id !== id)),
    [commit],
  )

  const clearFinished = useCallback(
    () => commit((current) => current.filter((item) => item.state !== DONE)),
    [commit],
  )

  const rename = useCallback((id, name) => patch(id, { name }), [patch])

  const start = useCallback(async () => {
    if (abortRef.current) return

    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)

    /* Snapshot the ids, not the items: an entry's `name` can still be edited
     * between the click and its turn in the queue, and the patch below has
     * to act on the latest version of the row. */
    const queued = itemsRef.current
      .filter((item) => item.state === PENDING)
      .map((item) => item.id)

    for (const id of queued) {
      if (controller.signal.aborted) break

      const item = itemsRef.current.find((candidate) => candidate.id === id)
      if (!item || item.state !== PENDING) continue

      patch(id, { state: UPLOADING, progress: 0, error: null })
      try {
        const payload = await knowledgeBaseApi.uploadDocument({
          file: item.file,
          name: item.name || undefined,
          signal: controller.signal,
          onProgress: (fraction) => patch(id, { progress: fraction }),
        })
        patch(id, { state: DONE, progress: 1, document: payload.document })
        onUploaded?.(payload.document)
      } catch (error) {
        if (error?.name === 'AbortError') {
          patch(id, { state: PENDING, progress: 0 })
          break
        }
        /* `error.message` is the server's own administrator-facing text —
         * "That file is 34 MB. The limit is 20 MB." — not a stack trace. */
        patch(id, { state: FAILED, error: error.message })
      }
    }

    abortRef.current = null
    setRunning(false)
  }, [onUploaded, patch])

  const cancel = useCallback(() => abortRef.current?.abort(), [])

  return {
    items,
    running,
    enqueue,
    remove,
    rename,
    clearFinished,
    start,
    cancel,
    hasPending: items.some((item) => item.state === PENDING),
  }
}
