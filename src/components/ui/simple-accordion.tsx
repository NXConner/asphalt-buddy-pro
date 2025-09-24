// @ts-nocheck
import React from "react"

// Simple working UI components without complex TypeScript
export function SimpleAccordion({ children, type, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function SimpleAccordionItem({ children, value, className = "" }) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className={`border-b ${className}`}>
      {React.Children.map(children, child => {
        if (child?.type?.displayName === 'AccordionTrigger') {
          return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) })
        }
        if (child?.type?.displayName === 'AccordionContent') {
          return isOpen ? child : null
        }
        return child
      })}
    </div>
  )
}

export function SimpleAccordionTrigger({ children, className = "", onClick }) {
  return (
    <button
      className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left ${className}`}
      onClick={onClick}
    >
      {children}
      <svg className="h-4 w-4 shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}
SimpleAccordionTrigger.displayName = 'AccordionTrigger'

export function SimpleAccordionContent({ children, className = "" }) {
  return (
    <div className={`pb-4 pt-0 ${className}`}>
      {children}
    </div>
  )
}
SimpleAccordionContent.displayName = 'AccordionContent'

// Export with the expected names
export const Accordion = SimpleAccordion
export const AccordionItem = SimpleAccordionItem  
export const AccordionTrigger = SimpleAccordionTrigger
export const AccordionContent = SimpleAccordionContent