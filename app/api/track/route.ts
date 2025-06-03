import { type NextRequest, NextResponse } from "next/server"

// Chave secreta do Measurement Protocol do Google Analytics
const GA_MEASUREMENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_SECRET || ""
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ""

// Placeholder para o token do Meta Pixel
const META_ACCESS_TOKEN = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || ""
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ""

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventName, eventData, clientId, userAgent, ipAddress } = body

    // Enviar evento para o Google Analytics
    await sendToGoogleAnalytics(eventName, eventData, clientId, userAgent, ipAddress)

    // Enviar evento para o Meta Pixel
    if (META_ACCESS_TOKEN && META_PIXEL_ID) {
      await sendToMetaPixel(eventName, eventData)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking event:", error)
    return NextResponse.json({ success: false, error: "Failed to track event" }, { status: 500 })
  }
}

async function sendToGoogleAnalytics(
  eventName: string,
  eventData: any,
  clientId: string,
  userAgent: string,
  ipAddress: string,
) {
  // Converter o nome do evento para o formato do GA4
  const gaEventName = eventName === "lead" ? "generate_lead" : eventName

  // Construir o payload para o Measurement Protocol
  const payload = {
    client_id: clientId,
    user_id: clientId,
    events: [
      {
        name: gaEventName,
        params: {
          ...eventData,
          engagement_time_msec: 100,
        },
      },
    ],
    user_properties: {},
    user_data: {
      client_id: clientId,
    },
    timestamp_micros: Date.now() * 1000,
  }

  // Enviar para o endpoint do Measurement Protocol
  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_MEASUREMENT_SECRET}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to send event to Google Analytics: ${response.statusText}`)
  }

  return response
}

async function sendToMetaPixel(eventName: string, eventData: any) {
  // Verificar se temos os tokens necessários
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
    console.warn("Meta Pixel tokens not configured")
    return
  }

  // Construir o payload para o Meta Conversions API
  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: "https://naotemchef.com.br/pre-reserva-concluida",
        event_id: `event_${Date.now()}`,
        user_data: {
          client_ip_address: eventData.ipAddress || "",
          client_user_agent: eventData.userAgent || "",
          em: eventData.email ? hashData(eventData.email) : undefined,
          ph: eventData.phone ? hashData(eventData.phone) : undefined,
        },
        custom_data: {
          ...eventData,
        },
      },
    ],
    access_token: META_ACCESS_TOKEN,
    pixel_id: META_PIXEL_ID,
  }

  // Enviar para o endpoint do Meta Conversions API
  const response = await fetch(`https://graph.facebook.com/v17.0/${META_PIXEL_ID}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to send event to Meta Pixel: ${response.statusText}`)
  }

  return response
}

// Função para hash de dados sensíveis (simulada)
function hashData(data: string): string {
  // Na implementação real, você usaria um algoritmo de hash como SHA-256
  return data
}
