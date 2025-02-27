"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ticket, MapPin, Clock, Search, Filter, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, Info, Users } from "lucide-react"
import type { Voucher } from "@/types/voucher"
import { Timestamp } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow, TableHeader, TableHead, TableBody, Table } from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { collection, addDoc } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function CouponsPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9 // 9 itens por página no grid (3x3)

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

  const calculateTimeLeft = (expiresAt: any) => {
    try {
      const expirationTime = expiresAt?.seconds ? 
        new Date(expiresAt.seconds * 1000).getTime() : 
        new Date(expiresAt).getTime()
      
      const diff = expirationTime - Date.now()
      
      if (diff <= 0) {
        // Atualizar status para expirado quando o tempo acabar
        return "Expirado"
      }
      
      // Ajustando para mostrar no máximo 24 horas
      const totalHours = Math.floor(diff / (1000 * 60 * 60))
      const hours = totalHours % 24
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24)
        return `${days}d ${hours}h ${minutes}m`
      }
      
      return `${hours}h ${minutes}m ${seconds}s`
    } catch (error) {
      console.error("Erro ao calcular tempo restante:", error)
      return "Erro no cálculo"
    }
  }

  useEffect(() => {
    const timer = setInterval(async () => {
      const newTimeLeft: Record<string, string> = {}
      
      for (const voucher of vouchers) {
        if (voucher.expiresAt) {
          const timeLeft = calculateTimeLeft(voucher.expiresAt)
          newTimeLeft[voucher.id] = timeLeft
          
          if (timeLeft === "Expirado" && 
              voucher.status !== "expired" && 
              voucher.status !== "verified" && 
              voucher.status !== "used") {
            try {
              // Atualizar status no Firestore
              const voucherRef = doc(db, "vouchers", voucher.id)
              await updateDoc(voucherRef, {
                status: "expired"
              })
              
              // Criar notificação de expiração
              const notificationsRef = collection(db, "notifications")
              await addDoc(notificationsRef, {
                type: "voucher_expired",
                memberId: voucher.memberId,
                establishmentId: voucher.establishmentId,
                establishmentName: voucher.establishmentName,
                voucherId: voucher.id,
                createdAt: new Date(),
                status: "pending",
                title: "Voucher Expirado",
                message: `Seu voucher para ${voucher.establishmentName} expirou.`
              })
              
              // Atualizar estado local
              setVouchers(prev => prev.map(v => 
                v.id === voucher.id ? { ...v, status: "expired" } : v
              ))
            } catch (error) {
              console.error("Erro ao atualizar status do voucher:", error)
            }
          }
        }
      }
      
      setTimeLeft(newTimeLeft)
    }, 1000)

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
        return "bg-yellow-500/20 rounded-full px-2 py-1 font-medium text-yellow-500"
      case "used":
        return "bg-green-500/20  rounded-full px-2 py-1 font-medium text-green-500"
      case "expired":
        return "bg-red-500/20 rounded-full px-2 py-1 font-medium text-red-500"
      default:
        return "bg-gray-500/20 rounded-full px-2 py-1 font-medium text-gray-500"
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

  // Função para filtrar os vouchers
  const getFilteredVouchers = () => {
    return vouchers.filter((voucher) => {
      const matchesSearch = 
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (voucher.establishment?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = 
        statusFilter === "all" || 
        voucher.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }

  // Função para paginar os resultados
  const getPaginatedVouchers = () => {
    const filtered = getFilteredVouchers()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  // Resetar página quando mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const filteredVouchers = getFilteredVouchers()
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage)
  const paginatedVouchers = getPaginatedVouchers()

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatExpirationTime = (expiresAt: any) => {
    try {
      let expirationDate: Date;
      
      // Se for um Timestamp do Firestore
      if (expiresAt?.toDate) {
        expirationDate = expiresAt.toDate();
      }
      // Se for uma string de data
      else if (typeof expiresAt === 'string') {
        expirationDate = new Date(expiresAt);
      }
      // Se já for um objeto Date
      else if (expiresAt instanceof Date) {
        expirationDate = expiresAt;
      }
      // Se for um timestamp em segundos
      else if (expiresAt?.seconds) {
        expirationDate = new Date(expiresAt.seconds * 1000);
      }
      else {
        return "Data inválida";
      }

      const now = new Date();
      const diff = expirationDate.getTime() - now.getTime();
      
      if (diff <= 0) return "Expirado";
      
      // Ajustando para mostrar no máximo 24 horas
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const hours = totalHours % 24;
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        return `${days}d ${hours}h ${minutes}m`;
      }
      
      return `${hours}h ${minutes}m ${seconds}s`;
    } catch (error) {
      console.error("Erro ao formatar data de expiração:", error);
      return "Data inválida";
    }
  }

  const formatUsedDate = (dateString: any) => {
    try {
      let date;
      
      // Se for um timestamp do Firestore
      if (dateString?.seconds) {
        date = new Date(dateString.seconds * 1000);
      }
      // Se for um timestamp numérico
      else if (typeof dateString === 'number') {
        date = new Date(dateString);
      }
      // Se for uma string de data
      else if (typeof dateString === 'string') {
        date = new Date(dateString);
      }
      // Se já for um objeto Date
      else if (dateString instanceof Date) {
        date = dateString;
      }
      else {
        return "Data não disponível";
      }

      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }

      return format(date, "dd/MM 'às' HH:mm", {
        locale: ptBR,
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Meus Cupons</h1>
        <div className="flex gap-2">
          <div className="flex-1 md:w-[300px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#7a7b9f]" />
              <Input
                placeholder="Buscar cupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]"
              />
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-[#131320] border-[#1a1b2d]">
                <Filter className="h-4 w-4 text-[#7a7b9f]" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#0d0d1d] border-[#1a1b2d]">
              <SheetHeader>
                <SheetTitle className="text-[#e5e2e9]">Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#e5e2e9]">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131320] border-[#1a1b2d]">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="used">Utilizado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="icon"
            className="bg-[#131320] border-[#1a1b2d]"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
          >
            {viewMode === "grid" ? (
              <LayoutList className="h-4 w-4 text-[#7a7b9f]" />
            ) : (
              <LayoutGrid className="h-4 w-4 text-[#7a7b9f]" />
            )}
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedVouchers.map((voucher) => (
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
                  <div className="flex items-center text-[#7a7b9f] space-x-4">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {voucher.establishment?.address?.city || "Cidade"}/
                      {voucher.establishment?.address?.state || "Estado"}
                    </span>
                  </div>
                  <div className="flex items-center text-[#7a7b9f] space-x-4">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {formatExpirationTime(voucher.expiresAt)}
                    </span>
                  </div>
                  <div className="flex items-center text-[#7a7b9f] space-x-4">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">
                      {voucher.voucherDescription || "Sem descrição"}
                    </span>
                  </div>
                  <div className="flex items-center text-[#7a7b9f] space-x-4">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {voucher.usageLimit || "Sem limite"}
                    </span>
                  </div>
                </div>

                <div className="relative pb-1">
                  {/* Linha pontilhada decorativa */}
                  <div className="absolute  h-4 flex justify-between items-center left-[-33px] right-[-33px]" >
                    <div className="w-4 h-4 bg-[#0F0F1A] rounded-full" />
                    <div className="flex-1 border-t-2 border-dashed border-[#0F0F1A] mx-2" />
                    <div className="w-4 h-4 bg-[#0F0F1A] rounded-full" />
                  </div>
                </div>

                <div className="mt-4 pt-4">
                  <div className="text-center">
                    <p className="text-sm text-[#7a7b9f] mb-1">Código do Voucher</p>
                    <p className="text-2xl font-bold text-[#7435db]">{voucher.code}</p>
                  </div>
                </div>

                <div className="flex flex-row gap-4 justify-between">
                  <div className="mt-2">
                    <p className="text-sm text-[#7a7b9f]">Desconto:</p>
                    <p className="text-lg font-semibold text-emerald-500">
                      {voucher.establishment?.discountValue || "Não disponível"}
                    </p>
                  </div>
                  <div>
                    {voucher.status === "used" && voucher.usedAt && (
                    <div className="mt-2">
                      <p className="text-sm text-[#7a7b9f]">Utilizado em:</p>
                      <p className="text-sm font-semibold text-[#7a7b9f]">
                        {formatUsedDate(voucher.usedAt)}
                      </p>
                    </div>
                    )}
                  </div>
                </div>

                
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(i + 1)}
                    className={`bg-[#1a1b2d] border-[#131320] ${
                      currentPage === i + 1 ? "text-primary" : "text-[#e5e2e9]"
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estabelecimento</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Regras</TableHead>
                <TableHead>Limite de uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.establishment?.name}</TableCell>
                  <TableCell>{voucher.code}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(voucher.status)}>
                      {getStatusText(voucher.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{timeLeft[voucher.id]}</TableCell>
                  <TableCell>{voucher.voucherDescription || "Sem descrição"}</TableCell>
                  <TableCell>{voucher.usageLimit || "Sem limite"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(i + 1)}
                    className={`bg-[#1a1b2d] border-[#131320] ${
                      currentPage === i + 1 ? "text-primary" : "text-[#e5e2e9]"
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
