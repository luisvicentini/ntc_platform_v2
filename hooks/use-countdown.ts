import { useState, useEffect, useCallback } from 'react'

export function useCountdown(initialSeconds: number = 0) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)

  useEffect(() => {
    setTimeLeft(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const startCountdown = useCallback((seconds: number) => {
    setTimeLeft(seconds)
  }, [])

  return { timeLeft, startCountdown }
} 