import { useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'

import { UPLOAD_STATE, useUpload } from '../hooks/useUpload'
import { formatBytes } from '../utils/format'

/* The upload surface: a drop zone, a queue, and a progress bar per file.
 *
 * The `accept` attribute and the size hint below are conveniences — they
 * spare someone the round trip of picking a file that will be refused. They
 * are NOT validation. A dropped file bypasses `accept` entirely, and every
 * limit shown here is enforced again on the server from the file's own
 * bytes; the values come from the API's own limits so the two cannot drift.
 *
 * Failures stay attached to their file. The message shown is the server's,
 * which is written for an administrator: "That file is 34 MB. The limit is
 * 20 MB." — never a stack trace, never a storage path. */

function ProgressBar({ value }) {
  return (
    <div
      className="h-px w-full bg-[var(--rule)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <div
        className="h-px bg-bone transition-[width] duration-200"
        style={{ width: `${Math.max(2, value * 100)}%` }}
      />
    </div>
  )
}

function QueueItem({ item, onRemove, onRename, disabled }) {
  const failed = item.state === UPLOAD_STATE.FAILED
  const done = item.state === UPLOAD_STATE.DONE

  return (
    <li className="border border-[var(--rule)] px-4 py-3">
      <div className="flex items-start gap-3">
        <FileText
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-mist"
          strokeWidth={1.5}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-paper">{item.file.name}</p>
          <p className="mt-0.5 font-mono text-[0.625rem] tracking-[0.1em] text-ash uppercase">
            {formatBytes(item.file.size)}
            {done ? ' · Uploaded' : ''}
          </p>

          {item.state === UPLOAD_STATE.PENDING ? (
            <div className="mt-3">
              <label
                htmlFor={`kb-name-${item.id}`}
                className="font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase"
              >
                Display name (optional)
              </label>
              <input
                id={`kb-name-${item.id}`}
                type="text"
                value={item.name}
                disabled={disabled}
                onChange={(event) => onRename(item.id, event.target.value)}
                placeholder={item.file.name.replace(/\.[^.]+$/, '')}
                className="mt-1 w-full border-b border-[var(--rule)] bg-transparent py-1.5 text-sm text-bone transition-colors placeholder:text-ash focus:border-bone focus:outline-none"
              />
            </div>
          ) : null}

          {item.state === UPLOAD_STATE.UPLOADING ? (
            <div className="mt-3">
              <ProgressBar value={item.progress} />
              <p className="mt-1.5 font-mono text-[0.625rem] text-mist tabular-nums">
                {Math.round(item.progress * 100)}%
              </p>
            </div>
          ) : null}

          {failed ? (
            <p role="alert" className="mt-2 text-xs text-signal">
              {item.error}
            </p>
          ) : null}
        </div>

        {item.state !== UPLOAD_STATE.UPLOADING ? (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="-mr-1 p-1 text-ash transition-colors hover:text-bone"
          >
            <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
            <span className="sr-only">Remove {item.file.name} from the queue</span>
          </button>
        ) : null}
      </div>
    </li>
  )
}

export default function UploadPanel({ limits, onUploaded }) {
  const {
    items,
    running,
    enqueue,
    remove,
    rename,
    clearFinished,
    start,
    cancel,
    hasPending,
  } = useUpload({ onUploaded })

  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const accept = limits?.extensions?.join(',') ?? ''
  const maxSize = limits?.maxFileSize

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files?.length) enqueue(event.dataTransfer.files)
  }

  return (
    <div>
      {/* A label wrapping a visually-hidden input, not a div with onClick:
          this way the whole zone is one keyboard-reachable control that
          opens the file picker, with no ARIA needed to explain it. */}
      <label
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-6 py-14 text-center transition-colors',
          dragging
            ? 'border-bone bg-ink-3'
            : 'border-[var(--rule-strong)] hover:border-mist',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) enqueue(event.target.files)
            // Reset so choosing the same file twice still fires a change.
            event.target.value = ''
          }}
        />
        <Upload aria-hidden="true" className="size-6 text-mist" strokeWidth={1.25} />
        <span className="text-sm text-bone">
          Drop documents here, or choose files
        </span>
        <span className="font-mono text-[0.625rem] tracking-[0.14em] text-ash uppercase">
          {(limits?.extensions ?? []).join('  ')}
          {maxSize ? ` · max ${formatBytes(maxSize)}` : ''}
        </span>
      </label>

      {items.length ? (
        <>
          <ul className="mt-6 space-y-2">
            {items.map((item) => (
              <QueueItem
                key={item.id}
                item={item}
                onRemove={remove}
                onRename={rename}
                disabled={running}
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={running ? cancel : start}
              disabled={!running && !hasPending}
              className="border border-bone bg-bone px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-ink uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? 'Cancel' : 'Upload'}
            </button>

            {items.some((item) => item.state === UPLOAD_STATE.DONE) ? (
              <button
                type="button"
                onClick={clearFinished}
                className="px-3 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-mist uppercase transition-colors hover:text-bone"
              >
                Clear finished
              </button>
            ) : null}

            <p className="ml-auto text-xs text-ash">
              Processing continues in the background after upload.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
