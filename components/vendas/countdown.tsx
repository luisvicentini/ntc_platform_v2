"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
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
    <div className="fixed w-full top-0 left-0 max-h-[80px] right-0 bg-[#F24957] text-white py-3 px-4 z-50 flex items-center justify-center shadow-md">
      <div className="w-full mx-auto flex flex-row items-center justify-between gap-3 sm:gap-0">

        <div className="flex w-1/4 sm:w-1/3 justify-start">
          <motion.div
            className="flex justify-center mb-4 max-sm:mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src="/homepage/logo.svg"
              alt="Não Tem Chef Logo"
              width={120}
              height={30}
              className="object-contain max-sm:w-[5rem] max-md:w-[8rem] -mb-10 md:mt-8 sm:mt-3"
            />
          </motion.div>
        </div>
      
        <div className="flex w-3/4 sm:w-2/3 justify-end gap-2 items-center">
          <p className="text-sm sm:text-base md:text-lg font-semibold line-height-1">
            Essa oferta vai expirar em:
          </p>
          <div className="flex items-center gap-2 bg-black/20 px-4 py-1 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg md:text-xl font-bold">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
} 