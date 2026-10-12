"use client"

// Adapted from Magic UI Animated List (https://magicui.design/docs/components/animated-list).
// Ringside keeps all steps visible before hydration and animates once on entry.
import React, { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode
  delay?: number
}

export function AnimatedList({ children, className, delay = 60, ...props }: AnimatedListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.12 })
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const animate = mounted && inView && !prefersReducedMotion

  return <div ref={ref} className={cn(className)} {...props}>
    {React.Children.toArray(children).map((child, index) => <motion.div
      key={(child as React.ReactElement).key ?? index}
      initial={false}
      animate={animate ? { opacity: [0.82, 1], y: [8, 0] } : undefined}
      transition={{ duration: 0.22, delay: index * delay / 1000, ease: "easeOut" }}
      className="w-full"
    >{child}</motion.div>)}
  </div>
}
