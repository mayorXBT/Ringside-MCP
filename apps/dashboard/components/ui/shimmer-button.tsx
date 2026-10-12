import React, { type ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

// Adapted from Magic UI Shimmer Button (https://magicui.design/docs/components/shimmer-button).
// The continuous conic animation is replaced with a single short sheen when a signed action starts.
export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string
  className?: string
  children?: React.ReactNode
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ shimmerColor = "#ffffff", className, children, ...props }, ref) => <button
    ref={ref}
    className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-lg border px-4 py-2 font-medium transition-colors duration-200", className)}
    style={{ "--shimmer-color": shimmerColor } as React.CSSProperties}
    {...props}
  ><span aria-hidden="true" className="rs-commit-sheen"/><span className="relative z-10">{children}</span></button>
)
ShimmerButton.displayName = "ShimmerButton"
