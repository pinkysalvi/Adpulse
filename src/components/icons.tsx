import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const Icon = ({ children, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    width="1em"
    height="1em"
    {...props}
  >
    {children}
  </svg>
)

export const FilterIcon = (p: IconProps) => <Icon {...p}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></Icon>
export const CalendarIcon = (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>
export const CloseIcon = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
export const ChevronDownIcon = (p: IconProps) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
export const ChevronRightIcon = (p: IconProps) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
export const EyeIcon = (p: IconProps) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>
export const EyeOffIcon = (p: IconProps) => <Icon {...p}><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /></Icon>
export const SearchIcon = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
export const SunIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
export const MoonIcon = (p: IconProps) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Icon>
export const HelpIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></Icon>
export const DownloadIcon = (p: IconProps) => <Icon {...p}><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" /></Icon>
export const ColumnsIcon = (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></Icon>
export const ExpandIcon = (p: IconProps) => <Icon {...p}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></Icon>
export const RefreshIcon = (p: IconProps) => <Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></Icon>
export const ClockIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
export const SortIcon = ({ dir, ...p }: IconProps & { dir?: 'asc' | 'desc' | false }) => (
  <Icon {...p}>
    <path d="m8 9 4-4 4 4" opacity={dir === 'desc' ? 0.3 : 1} />
    <path d="m16 15-4 4-4-4" opacity={dir === 'asc' ? 0.3 : 1} />
  </Icon>
)
export const LogoIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" width="1em" height="1em" {...p}>
    <rect width="32" height="32" rx="8" fill="#4f46e5" />
    <path d="M6 20l5-6 4.5 4L20 10l6 7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
