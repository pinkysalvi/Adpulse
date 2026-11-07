import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from '../icons'

/** Centered dialog with a backdrop; closes on Escape or backdrop click. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="card relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h2 className="font-semibold">{title}</h2>
          <button className="icon-btn border-0" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className="scroll-thin overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
