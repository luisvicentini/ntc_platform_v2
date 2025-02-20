import { useState, useEffect } from 'react'

export function useCountdown(initialSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning || timeLeft === 0) return

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsRunning(false)
          clearInterval(timer)
          return 0
        }
        return time - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  const startCountdown = (seconds?: number) => {
    setTimeLeft(seconds || initialSeconds)
    setIsRunning(true)
  }

  return {
    timeLeft,
    isRunning,
    startCountdown
  }
} 