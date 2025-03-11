"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, Calendar, Ticket, Percent, AlertCircle, Info, Users, Mail, Phone } from "lucide-react"

interface VoucherTicketProps {
  customerName: string
  customerEmail: string
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
  customerEmail,
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
        return "bg-zinc-400/10 text-zinc-500 text-xl"
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

  // Formatar o telefone para exibição mais amigável
  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === "Não informado") return "Telefone não informado";
    
    // Se já estiver formatado com parênteses, retornar como está
    if (phone.includes("(")) return phone;
    
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Formato brasileiro: +55 (XX) XXXXX-XXXX
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    // Outros formatos, retorna como está
    return phone;
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
      <div className="absolute left-0 right-0 h-4 flex justify-between items-center left-[-10px] right-[-10px]" style={{ top: "183px" }}>
        <div className="w-4 h-4 bg-zinc-100 rounded-full" />
        <div className="flex-1 border-t-2 border-dashed border-zinc-100 mx-2" />
        <div className="w-4 h-4 bg-zinc-100 rounded-full" />
      </div>

      {/* Conteúdo do ticket */}
      <div className="p-6 pt-8 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-zinc-200">
              {customerAvatar && (
                <AvatarImage 
                  src={customerAvatar} 
                  alt={customerName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-zinc-100 text-zinc-500">
                {getInitials(customerName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-500">
                {customerName || "Usuário"}
              </h3>
              <div className="flex items-center text-sm text-zinc-400">
                <Phone className="h-3 w-3 mr-1" />
                {formatPhoneNumber(customerPhone)}
              </div>
              <div className="flex items-center text-sm text-zinc-400">
                <Mail className="h-3 w-3 mr-1" />
                {customerEmail || "Email não informado"}
              </div>
            </div>
          </div>
          <Badge className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-4 text-zinc-400">
            <Calendar className="h-4 w-8" />
            <div className="flex-1">
              <h4 className="text-sm">Data da Verificação:</h4>
              <p className="text-zinc-500 font-medium">{checkInDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-zinc-400">
            <Percent className="h-4 w-8" />
            <div className="flex-1">
              <h4 className="text-sm">Desconto:</h4>
              <p className="text-zinc-500 font-medium">{discount}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-zinc-400">
            <Info className="h-4 w-8" />
            <div className="flex-1">
              <h4 className="text-sm">Regras do Desconto:</h4>
              <p className="text-zinc-500 font-medium">{voucherDescription}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-zinc-400">
            <Users className="h-4 w-8" />
            <div className="flex-1">
              <h4 className="text-sm">Limite de Uso:</h4>
              <p className="text-zinc-500 font-medium">{usageLimit}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 