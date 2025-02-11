"use client"

import { useState } from "react"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Copy, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// interface Coupon {
//   id: string
//   establishment: string
//   location: string
//   date: string
//   expiresIn: string
//   status: "pending" | "expired"
//   code: string
// }

// const coupons: Coupon[] = [
//   {
//     id: "1",
//     establishment: "Niva's Lanches",
//     location: "Limeira/SP",
//     date: "02/02/2025",
//     expiresIn: "Expira em 3 dias",
//     status: "pending",
//     code: "123456",
//   },
//   {
//     id: "2",
//     establishment: "Niva's Lanches",
//     location: "Limeira/SP",
//     date: "02/02/2025",
//     expiresIn: "Expira em 3 dias",
//     status: "expired",
//     code: "123456",
//   },
//   // Add more coupons as needed
// ]

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([])
  const { establishments, getUserVouchers } = useEstablishment()

  // In a real app, get the actual user ID
  const userVouchers = getUserVouchers("current-user")

  const getEstablishmentDetails = (establishmentId: string) => {
    return establishments.find((e) => e.id === establishmentId)
  }

  const formatExpirationTime = (expiresAt: number) => {
    const now = Date.now()
    if (now >= expiresAt) return "Expirado"

    const diff = expiresAt - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `Expira em ${days} dias`
    }

    return `Expira em ${hours}h${minutes.toString().padStart(2, "0")}`
  }

  const filteredVouchers = userVouchers.filter((voucher) => {
    const establishment = getEstablishmentDetails(voucher.establishmentId)
    if (!establishment) return false

    return (
      establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      establishment.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVouchers(filteredVouchers.map((voucher) => voucher.code))
    } else {
      setSelectedVouchers([])
    }
  }

  const handleSelectVoucher = (voucherCode: string, checked: boolean) => {
    if (checked) {
      setSelectedVouchers([...selectedVouchers, voucherCode])
    } else {
      setSelectedVouchers(selectedVouchers.filter((id) => id !== voucherCode))
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Código copiado para a área de transferência!")
    } catch (err) {
      toast.error("Erro ao copiar código")
    }
  }

  const shareOnWhatsApp = (voucher: any) => {
    const establishment = getEstablishmentDetails(voucher.establishmentId)
    const text = `Olá! Aqui está meu cupom para ${establishment?.name}: ${voucher.code}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const cancelVoucher = (voucherCode: string) => {
    // Implement coupon cancellation logic here
    toast.success("Cupom cancelado com sucesso!")
  }

  const deleteVouchers = () => {
    // Implement bulk delete logic here
    toast.success(`${selectedVouchers.length} cupons deletados com sucesso!`)
    setSelectedVouchers([])
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Meus Cupons</h1>

        <div className="flex items-center space-x-4">
          <div className="relative w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
            <Input
              placeholder="Pesquisar local"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="space-x-2 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]">
                <Filter className="h-4 w-4" />
                <span>Filtrar</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#131320] text-[#e5e2e9]">
              <SheetHeader>
                <SheetTitle className="text-[#e5e2e9]">Filtros</SheetTitle>
              </SheetHeader>
              {/* Add filter options here */}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {selectedVouchers.length > 0 && (
        <div className="mb-4">
          <Button variant="destructive" onClick={deleteVouchers} className="bg-red-600 hover:bg-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Apagar {selectedVouchers.length} cupons selecionados
          </Button>
        </div>
      )}

      <div className="rounded-md border border-[#1a1b2d] bg-[#131320]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedVouchers.length === filteredVouchers.length}
                  onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                />
              </TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Expiração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Código do Cupom</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVouchers.map((voucher) => {
              const establishment = getEstablishmentDetails(voucher.establishmentId)
              if (!establishment) return null

              return (
                <TableRow key={voucher.code} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                  <TableCell>
                    <Checkbox
                      checked={selectedVouchers.includes(voucher.code)}
                      onCheckedChange={(checked: boolean) => handleSelectVoucher(voucher.code, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-[#e5e2e9]">{establishment.name}</div>
                      <div className="text-sm text-[#7a7b9f]">{establishment.location}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#7a7b9f]">{new Date(voucher.generatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-[#7a7b9f]">{formatExpirationTime(voucher.expiresAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={voucher.status === "pending" ? "default" : "secondary"}
                      className={
                        voucher.status === "pending"
                          ? "bg-[#042f2e] text-[#2dd4bf] hover:bg-[#042f2e]"
                          : "bg-yellow-900 text-yellow-500 hover:bg-yellow-900"
                      }
                    >
                      {voucher.status === "pending" ? "Aguardando check-in" : "Expirado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center space-x-2 cursor-pointer group"
                      onClick={() => copyToClipboard(voucher.code)}
                    >
                      <span className="text-[#e5e2e9] font-mono">{voucher.code}</span>
                      <Copy className="w-4 h-4 text-[#7a7b9f] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-[#7a7b9f] hover:text-[#e5e2e9]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                        <DropdownMenuItem onClick={() => shareOnWhatsApp(voucher)} className="hover:bg-[#1a1b2d]">
                          Enviar para WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => cancelVoucher(voucher.code)}
                          className="hover:bg-[#1a1b2d] text-red-500"
                        >
                          Cancelar cupom
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

