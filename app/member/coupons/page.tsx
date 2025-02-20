"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ticket, MapPin, Clock } from "lucide-react"
import type { Voucher } from "@/types/voucher"
import { Timestamp } from "firebase/firestore"

export default function CouponsPage() {
  const [vouchers, setVouchers] = useState<(Voucher & { establishment: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await fetch("/api/vouchers/member", {
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Erro ao carregar vouchers")
        }

        const data = await response.json()
        const validVouchers = data.filter((v: any) => v.establishment)
        setVouchers(validVouchers)
      } catch (error) {
        console.error("Erro ao carregar vouchers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [])

  // Atualizar countdown para cada voucher
  useEffect(() => {
    const calculateTimeLeft = (expiresAt: any) => {
      // Converter Timestamp do Firestore para milissegundos
      const expirationTime = expiresAt?.seconds ? 
        new Date(expiresAt.seconds * 1000).getTime() : 
        new Date(expiresAt).getTime()
      
      const diff = expirationTime - Date.now()
      
      if (diff <= 0) return "Expirado"
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${hours}h ${minutes}m`
    }

    const timer = setInterval(() => {
      const newTimeLeft: Record<string, string> = {}
      
      vouchers.forEach(voucher => {
        if (voucher.expiresAt) {
          newTimeLeft[voucher.id] = calculateTimeLeft(voucher.expiresAt)
        }
      })
      
      setTimeLeft(newTimeLeft)
    }, 1000 * 60) // Atualiza a cada minuto

    // Calcular tempo inicial
    vouchers.forEach(voucher => {
      if (voucher.expiresAt) {
        setTimeLeft(prev => ({
          ...prev,
          [voucher.id]: calculateTimeLeft(voucher.expiresAt)
        }))
      }
    })

    return () => clearInterval(timer)
  }, [vouchers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "used":
        return "bg-green-500"
      case "expired":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "used":
        return "Utilizado"
      case "expired":
        return "Expirado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9] mb-6">Meus Cupons</h1>
        <div className="text-[#7a7b9f]">Carregando...</div>
      </div>
    )
  }

  if (vouchers.length === 0) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9] mb-6">Meus Cupons</h1>
        <div className="text-[#7a7b9f]">Você ainda não possui cupons.</div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold text-[#e5e2e9] mb-6">Meus Cupons</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className="bg-[#131320] border-[#1a1b2d] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-[#e5e2e9]">
                  {voucher.establishment?.name || "Estabelecimento não disponível"}
                </h3>
              </div>
              <Badge className={getStatusColor(voucher.status)}>
                {getStatusText(voucher.status)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-[#7a7b9f] space-x-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {voucher.establishment?.address?.city || "Cidade"}/
                  {voucher.establishment?.address?.state || "Estado"}
                </span>
              </div>
              <div className="flex items-center text-[#7a7b9f] space-x-2">
                <Clock className="h-4 w-4" />
                <span>
                  Expira em: {timeLeft[voucher.id] || "Calculando..."}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1a1b2d]">
              <div className="text-center">
                <p className="text-sm text-[#7a7b9f] mb-1">Código do Voucher</p>
                <p className="text-2xl font-bold text-[#7435db]">{voucher.code}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-[#7a7b9f]">Desconto:</p>
              <p className="text-lg font-semibold text-emerald-500">
                {voucher.establishment?.discountValue || "Não disponível"}
              </p>
            </div>

            {voucher.status === "used" && voucher.usedAt && (
              <div className="text-sm text-[#7a7b9f]">
                Utilizado em: {new Date(voucher.usedAt).toLocaleDateString("pt-BR")}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
