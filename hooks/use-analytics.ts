"use client"

import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

export function useAnalytics() {
  const [clientId, setClientId] = useState<string>("")

  useEffect(() => {
    // Obter ou criar um ID de cliente persistente
    let cid = localStorage.getItem("ga_client_id")
    if (!cid) {
      cid = uuidv4()
      localStorage.setItem("ga_client_id", cid)
    }
    setClientId(cid)
  }, [])

  const trackEvent = async (eventName: string, eventData: any = {}) => {
    if (!clientId) return

    try {
      // Rastrear no lado do cliente (GA4)
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", eventName, eventData)
      }

      // Enviar para nossa API para rastreamento server-side
      await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName,
          eventData,
          clientId,
          userAgent: navigator.userAgent,
          ipAddress: "", // Será preenchido pelo servidor
        }),
      })
    } catch (error) {
      console.error("Error tracking event:", error)
    }
  }

  return { trackEvent }
}

// Adicionar tipagem para o gtag global
declare global {
  interface Window {
    gtag: (command: string, action: string, params?: any) => void
    dataLayer: any[]
  }
}
