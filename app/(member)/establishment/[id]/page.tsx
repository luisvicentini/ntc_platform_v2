"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MapPin, Clock, Phone } from "lucide-react"

export default function EstablishmentPage({ params }: { params: { id: string } }) {
  const [voucherGenerated, setVoucherGenerated] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")

  const generateVoucher = () => {
    // Aqui você implementaria a lógica real de geração de voucher
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setVoucherCode(code)
    setVoucherGenerated(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <div className="relative aspect-video">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled-CvaHcgj0zGtWZmdFXo24SA7Ct51IEt.png"
            alt="Niva's Lanches"
            className="object-cover w-full h-full"
          />
          <div className="absolute top-4 right-4 bg-black/75 text-white px-2 py-1 rounded-full text-sm flex items-center">
            <Star className="w-4 h-4 mr-1 fill-current" />
            4.5
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">Niva's Lanches</CardTitle>
          <CardDescription className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Rua A, 123 - Limeira/SP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Dizem que temos o melhor Bauru de Limeira. Venha experimentar e comprove você mesmo!</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            Segunda a Sábado das 18h às 23h
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="w-4 h-4 mr-1" />
            (19) 3441-2504 pedidos para retirada
          </div>
          {!voucherGenerated ? (
            <Button onClick={generateVoucher} className="w-full">
              Gerar Voucher
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Seu Voucher</CardTitle>
                <CardDescription>Apresente este código no estabelecimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">{voucherCode}</div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

