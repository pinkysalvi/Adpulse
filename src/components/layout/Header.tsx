import { useTheme } from '../../context/ThemeContext'
import { HelpIcon, LogoIcon, MoonIcon, SunIcon } from '../icons'

export function Header({ onOpenHelp }: { onOpenHelp: () => void }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <LogoIcon className="h-7 w-7" />
          <span>AdPulse</span>
        </a>
        {/* Single page app: Reports is the only section */}
        <nav aria-label="Main" className="hidden md:flex">
          <span
            aria-current="page"
            className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          >
            Reports
          </span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button className="icon-btn" onClick={onOpenHelp} aria-label="Help and metrics glossary">
            <HelpIcon />
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  )
}
