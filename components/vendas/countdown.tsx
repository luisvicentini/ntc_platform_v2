"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface CountdownProps {
  initialMinutes: number
  initialSeconds: number
}

export default function Countdown({ initialMinutes, initialSeconds }: CountdownProps) {
  const [minutes, setMinutes] = useState(initialMinutes)
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    const interval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1)
      } else if (minutes > 0) {
        setMinutes(minutes - 1)
        setSeconds(59)
      } else {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [minutes, seconds])

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#F24957] text-white py-3 px-4 z-50 flex items-center justify-center shadow-md">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        <p className="text-sm sm:text-base md:text-lg font-semibold">
          Essa oferta de lançamento vai expirar em:
        </p>
        <div className="flex items-center gap-2 bg-black/20 px-4 py-1 rounded-lg">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-lg md:text-xl font-bold">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  )
} 