"use client"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "relative inline-block",
        size === "sm" && "h-5 w-5",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-12 w-12",
        className
      )}
      {...props}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="spinner-blade" />
      ))}
    </div>
  )
}
