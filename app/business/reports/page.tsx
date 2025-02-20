"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, Columns3, List } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface Member {
  id: string
  name: string
  phone: string
  photoURL?: string
}

interface Establishment {
  id: string
  name: string
}

interface Voucher {
  id: string
  code: string
  status: "pending" | "verified" | "used" | "expired"
  createdAt: string
  expiresAt: string
  usedAt?: string
  member: Member
  establishment: Establishment
  discount: number
}

export default function ReportsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const sessionToken = localStorage.getItem("sessionToken")
      console.log("Iniciando busca de vouchers")
      
      const response = await fetch("/api/business/reports", {
        headers: {
          "x-session-token": sessionToken || "",
        },
      })
      
      console.log("Status da resposta:", response.status)
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar vouchers: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Total de vouchers recebidos:", data.vouchers?.length || 0)
      console.log("Primeiro voucher:", data.vouchers?.[0])
      
      setVouchers(data.vouchers)
    } catch (error) {
      console.error("Erro ao buscar vouchers:", error)
      toast.error("Erro ao carregar vouchers")
    } finally {
      setLoading(false)
    }
  }

  const performCheckIn = async (code: string) => {
    try {
      const sessionToken = localStorage.getItem("sessionToken")
      const response = await fetch("/api/vouchers/validate", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken || "",
        },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        toast.success("Check-in realizado com sucesso!")
        await fetchVouchers()
        setIsDetailsOpen(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao realizar check-in")
      }
    } catch (error) {
      console.error("Erro ao realizar check-in:", error)
      toast.error("Erro ao realizar check-in")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500"
      case "verified":
        return "bg-blue-500/10 text-blue-500"
      case "used":
        return "bg-emerald-500/10 text-emerald-500"
      case "expired":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "verified":
        return "Verificado"
      case "used":
        return "Utilizado"
      case "expired":
        return "Expirado"
      default:
        return "Desconhecido"
    }
  }

  const formatFirebaseDate = (date: string | { seconds: number, nanoseconds: number }) => {
    if (typeof date === 'string') {
      return format(new Date(date), "dd/MM/yyyy")
    }
    if ('seconds' in date) {
      return format(new Date(date.seconds * 1000), "dd/MM/yyyy")
    }
    return "Data inválida"
  }

  const VoucherCard = ({ voucher }: { voucher: Voucher }) => (
    <Card 
      className="bg-[#131320] border-[#1a1b2d] p-4 cursor-pointer hover:border-[#7435db] transition-colors"
      onClick={() => {
        setSelectedVoucher(voucher)
        setIsDetailsOpen(true)
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 border border-[#1a1b2d]">
            {voucher.member.photoURL && (
              <AvatarImage src={voucher.member.photoURL} />
            )}
            <AvatarFallback className="bg-[#1a1b2d] text-[#7a7b9f]">
              {voucher.member.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-[#e5e2e9]">{voucher.member.name}</p>
            <p className="text-xs text-[#7a7b9f]">{voucher.code}</p>
          </div>
        </div>
        <Badge className={getStatusColor(voucher.status)}>
          {getStatusText(voucher.status)}
        </Badge>
      </div>
      <div className="text-xs text-[#7a7b9f] space-y-1">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Criado em: {formatFirebaseDate(voucher.createdAt)}</span>
        </div>
      </div>
    </Card>
  )

  const KanbanView = () => {
    const columns = ["pending", "verified", "used", "expired"]
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(status => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#e5e2e9] font-medium capitalize">
                {getStatusText(status)}
              </h3>
              <Badge variant="outline" className="border-[#1a1b2d] text-[#7a7b9f]">
                {vouchers.filter(v => v.status === status).length}
              </Badge>
            </div>
            <div className="space-y-2">
              {vouchers
                .filter(v => v.status === status)
                .map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9] mb-6">Relatórios</h1>
        <div className="text-[#7a7b9f]">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Relatórios</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="border-[#1a1b2d] text-[#7a7b9f] hover:bg-[#1a1b2d]"
            onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
          >
            {viewMode === "list" ? <Columns3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            className="border-[#1a1b2d] text-[#7a7b9f] hover:bg-[#1a1b2d]"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.code}</TableCell>
                  <TableCell>{voucher.member.name}</TableCell>
                  <TableCell>
                    {formatFirebaseDate(voucher.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(voucher.status)}>
                      {getStatusText(voucher.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-[#7a7b9f] hover:text-[#e5e2e9]"
                      onClick={() => {
                        setSelectedVoucher(voucher)
                        setIsDetailsOpen(true)
                      }}
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <KanbanView />
      )}

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="bg-[#131320] border-l-[#1a1b2d]">
          <SheetHeader>
            <SheetTitle className="text-[#e5e2e9]">Detalhes do Voucher</SheetTitle>
          </SheetHeader>
          {selectedVoucher && (
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#7a7b9f]">Código</h3>
                <p className="text-[#e5e2e9]">{selectedVoucher.code}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#7a7b9f]">Cliente</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {selectedVoucher.member.photoURL && (
                      <AvatarImage src={selectedVoucher.member.photoURL} />
                    )}
                    <AvatarFallback>
                      {selectedVoucher.member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[#e5e2e9]">{selectedVoucher.member.name}</p>
                    <p className="text-sm text-[#7a7b9f]">{selectedVoucher.member.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#7a7b9f]">Status</h3>
                <Badge className={getStatusColor(selectedVoucher.status)}>
                  {getStatusText(selectedVoucher.status)}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#7a7b9f]">Datas</h3>
                <div className="space-y-1 text-[#e5e2e9]">
                  <p>Criação: {formatFirebaseDate(selectedVoucher.createdAt)}</p>
                  <p>Expiração: {formatFirebaseDate(selectedVoucher.expiresAt)}</p>
                  {selectedVoucher.usedAt && (
                    <p>Utilização: {formatFirebaseDate(selectedVoucher.usedAt)}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#7a7b9f]">Desconto</h3>
                <p className="text-[#e5e2e9]">{selectedVoucher.discount}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-[#7a7b9f]">Condições</h3>
                <p className="text-[#e5e2e9]">{selectedVoucher.conditions}</p>
              </div>

              {selectedVoucher.status !== "used" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => performCheckIn(selectedVoucher.code)}
                >
                  Realizar Check-in
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
