import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from '../icons'

const DURATION = 250 // ms, matches the duration-250 classes below

interface DrawerProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** footer content; a function receives `close`, which plays the closing animation first */
  footer?: ReactNode | ((close: () => void) => ReactNode)
  width?: string
}

/**
 * Right-side panel with a backdrop. Slides in on open and out on close (Escape, backdrop,
 * close button or footer actions), then calls `onClose`. Returns focus when it unmounts.
 */
export function Drawer({ title, onClose, children, footer, width = 'max-w-md' }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const closing = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setOpen(false)
    // reduced-motion users get no transition, so close straight away
    const instant = matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => onCloseRef.current(), instant ? 0 : DURATION)
  }, [])

  useEffect(() => {
    // The panel first renders off-screen. Reading its size forces the browser to apply that
    // position, so switching to "open" afterwards runs the slide-in transition.
    void panel.current?.offsetWidth
    setOpen(true)
    const previouslyFocused = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus()
    }
  }, [close])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-250 ease-out motion-reduce:transition-none ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={close}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex h-full w-full ${width} flex-col bg-white shadow-xl outline-none transition-transform duration-250 ease-out motion-reduce:transition-none dark:bg-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="icon-btn border-0" onClick={close} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            {typeof footer === 'function' ? footer(close) : footer}
          </footer>
        )}
      </div>
    </div>
  )
}
