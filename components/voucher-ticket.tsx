"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, Calendar, Ticket, Percent, AlertCircle, Info, Users } from "lucide-react"

interface VoucherTicketProps {
  customerName: string
  customerPhone: string
  customerAvatar?: string | null
  checkInDate: string
  discount: string
  conditions: string
  status: string
  establishmentImage: string
  voucherDescription: string
  usageLimit: string
}

export function VoucherTicket({
  customerName,
  customerPhone,
  customerAvatar,
  checkInDate,
  discount,
  conditions,
  status,
  establishmentImage,
  voucherDescription,
  usageLimit
}: VoucherTicketProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-blue-500/10 text-blue-500 text-xl"
      case "used":
        return "bg-emerald-500/10 text-emerald-500 text-xl"
      default:
        return "bg-gray-500/10 text-gray-500 text-xl"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verificado"
      case "used":
        return "Utilizado"
      default:
        return "Status desconhecido"
    }
  }

  // Função para gerar iniciais mesmo quando o nome está vazio
  const getInitials = (name: string) => {
    if (!name) return "U" // U de "User" como fallback
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative bg-white rounded-lg overflow-hidden">
      {/* Imagem do estabelecimento */}
      <div className="h-48 w-full">
        <img
          src={establishmentImage}
          alt="Estabelecimento"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Linha pontilhada decorativa */}
      <div className="absolute left-0 right-0 h-4 flex justify-between items-center left-[-10px] right-[-10px]" style={{ top: "184px" }}>
        <div className="w-4 h-4 bg-[#131320] rounded-full" />
        <div className="flex-1 border-t-2 border-dashed border-[#131320] mx-2" />
        <div className="w-4 h-4 bg-[#131320] rounded-full" />
      </div>

      {/* Conteúdo do ticket */}
      <div className="p-6 pt-8 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-[#7435db]">
              {customerAvatar && (
                <AvatarImage 
                  src={customerAvatar} 
                  alt={customerName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-[#7435db]/10 text-[#7435db]">
                {getInitials(customerName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-[#7a7b9f]">
                {customerName || "Usuário"}
              </h3>
              <p className="text-sm text-[#7a7b9f]">
                {customerPhone || "Telefone não informado"}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2 text-[#7a7b9f]">
            <Calendar className="h-4 w-4" />
            <div className="flex-1">
              <h4 className="text-sm">Data da Verificação:</h4>
              <p>{checkInDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[#7a7b9f]">
            <Percent className="h-4 w-4" />
            <div className="flex-1">
              <h4 className="text-sm">Desconto:</h4>
              <p>{discount}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[#7a7b9f]">
            <Info className="h-4 w-4" />
            <div className="flex-1">
              <h4 className="text-sm">Regras do Desconto:</h4>
              <p>{voucherDescription}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[#7a7b9f]">
            <Users className="h-4 w-4" />
            <div className="flex-1">
              <h4 className="text-sm">Limite de Uso:</h4>
              <p>{usageLimit}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 