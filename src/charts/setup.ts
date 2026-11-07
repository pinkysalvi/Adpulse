import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useTheme } from '../context/ThemeContext'

// Register only the Chart.js pieces this app uses (keeps the chart bundle small)
Chart.register(LineElement, PointElement, ArcElement, BarElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)
Chart.defaults.font.family = 'Inter, system-ui, sans-serif'
Chart.defaults.font.size = 12

export function useChartTheme() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return {
    text: dark ? '#94a3b8' : '#64748b',
    grid: dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.12)',
    tooltipBg: dark ? '#0f172a' : '#ffffff',
    tooltipText: dark ? '#e2e8f0' : '#0f172a',
    tooltipBorder: dark ? '#334155' : '#e2e8f0',
    surface: dark ? '#0f172a' : '#ffffff',
  }
}
