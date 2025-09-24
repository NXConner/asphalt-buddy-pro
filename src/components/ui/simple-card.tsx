// @ts-nocheck
import React from "react"

export function SimpleCard({ children, className = "" }) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function SimpleCardHeader({ children, className = "" }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  )
}

export function SimpleCardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  )
}

export function SimpleCardDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  )
}

export function SimpleCardContent({ children, className = "" }) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

export function SimpleCardFooter({ children, className = "" }) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

// Export with expected names
export const Card = SimpleCard
export const CardHeader = SimpleCardHeader
export const CardTitle = SimpleCardTitle
export const CardDescription = SimpleCardDescription
export const CardContent = SimpleCardContent
export const CardFooter = SimpleCardFooter