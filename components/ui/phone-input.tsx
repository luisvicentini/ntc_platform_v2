"use client"

import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  error?: boolean
  defaultCountry?: string
}

export function PhoneNumberInput({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Digite seu telefone",
  error = false,
  defaultCountry = "BR"
}: PhoneInputProps) {
  const [mounted, setMounted] = useState(false)

  // Evita erro de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className={cn(
      "relative",
      error && "text-red-500",
      className
    )}>
      <PhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "bg-zinc-100 flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
        )}
      />
    </div>
  )
} 