import { cn } from "@/lib/utils"

// Adapted from Magic UI Animated Circular Progress Bar
// (https://magicui.design/docs/components/animated-circular-progress-bar).
// Ringside uses a compact status ring with one 220ms stroke transition.
interface AnimatedCircularProgressBarProps {
  max?: number
  min?: number
  value: number
  gaugePrimaryColor: string
  gaugeSecondaryColor: string
  className?: string
  showValue?: boolean
}

export function AnimatedCircularProgressBar({ max = 100, min = 0, value, gaugePrimaryColor, gaugeSecondaryColor, className, showValue = true }: AnimatedCircularProgressBarProps) {
  const percent = Math.max(0, Math.min(100, (value - min) / (max - min) * 100))
  return <span className={cn("relative inline-grid size-10 place-items-center", className)} role={showValue ? "img" : undefined} aria-label={showValue ? `${Math.round(percent)} percent` : undefined} aria-hidden={!showValue}>
    <svg className="size-full -rotate-90" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="42" stroke={gaugeSecondaryColor} strokeWidth="12"/>
      <circle cx="50" cy="50" r="42" stroke={gaugePrimaryColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 * (1 - percent / 100)} className="transition-[stroke-dashoffset,stroke] duration-[220ms]"/>
    </svg>
    {showValue && <span className="absolute text-xs tabular-nums">{Math.round(percent)}%</span>}
  </span>
}
