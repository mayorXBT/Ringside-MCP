"use client"

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react"
import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const reducedMotion = mounted && prefersReducedMotion
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let control: ReturnType<typeof animate> | null = null

    if (reducedMotion) {
      if (ref.current) ref.current.textContent = value.toFixed(decimalPlaces)
    } else if (isInView) {
      if (ref.current) ref.current.textContent = (direction === "down" ? value : startValue).toFixed(decimalPlaces)
      timer = setTimeout(() => {
        control = animate(motionValue, direction === "down" ? startValue : value, { duration: 0.28, ease: "easeOut" })
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
      control?.stop()
    }
  }, [motionValue, isInView, delay, value, direction, startValue, decimalPlaces, reducedMotion])

  useEffect(
    () =>
      motionValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)))
        }
      }),
    [motionValue, decimalPlaces]
  )

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider text-black tabular-nums dark:text-white",
        className
      )}
      {...props}
    >
      {value.toFixed(decimalPlaces)}
    </span>
  )
}
