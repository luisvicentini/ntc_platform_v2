"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Search, Filter, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CheckIn {
  id: string
  customerName: string
  customerPhone: string
  associatedBusiness: string
  checkInDate: string
  status: "completed" | "expired" | "invalid" | "used"
  voucherCode: string
}

// Simulated data - in a real app this would come from your backend
const checkIns: CheckIn[] = [
  {
    id: "1",
    customerName: "Luis Henrique Vicentini",
    customerPhone: "+55 (19) 98430-5001",
    associatedBusiness: "Não Tem Chef",
    checkInDate: "02/02/2025",
    status: "completed",
    voucherCode: "123456",
  },
  {
    id: "2",
    customerName: "Luis Henrique Vicentini",
    customerPhone: "+55 (19) 98430-5001",
    associatedBusiness: "Não Tem Chef",
    checkInDate: "02/02/2025",
    status: "completed",
    voucherCode: "123456",
  },
  {
    id: "3",
    customerName: "Luis Henrique Vicentini",
    customerPhone: "+55 (19) 98430-5001",
    associatedBusiness: "Não Tem Chef",
    checkInDate: "02/02/2025",
    status: "completed",
    voucherCode: "123456",
  },
]

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCheckIns = checkIns.filter((checkIn) =>
    checkIn.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: CheckIn["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-[#042f2e] text-[#2dd4bf] hover:bg-[#042f2e]">Check-in Realizado</Badge>
      case "expired":
        return (
          <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-500">
            Voucher Expirado
          </Badge>
        )
      case "invalid":
        return (
          <Badge variant="destructive" className="bg-red-900/50 text-red-500">
            Voucher Inválido
          </Badge>
        )
      case "used":
        return (
          <Badge variant="secondary" className="bg-gray-900/50 text-gray-400">
            Voucher Já Utilizado
          </Badge>
        )
    }
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Relatório de Check-ins</h1>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
          <Input
            placeholder="Pesquisar clientes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
          />
        </div>
        <Button
          variant="outline"
          className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320] hover:bg-[#131320] hover:text-[#e5e2e9]"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtrar
        </Button>
      </div>

      <Card className="bg-[#131320] border-[#1a1b2d]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
              <TableHead className="text-[#7a7b9f]">Cliente</TableHead>
              <TableHead className="text-[#7a7b9f]">Associado</TableHead>
              <TableHead className="text-[#7a7b9f]">Data do Check-in</TableHead>
              <TableHead className="text-[#7a7b9f]">Status</TableHead>
              <TableHead className="text-[#7a7b9f]">Código do Cupom</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCheckIns.map((checkIn) => (
              <TableRow key={checkIn.id} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#e5e2e9]">{checkIn.customerName}</span>
                    <span className="text-sm text-[#7a7b9f]">{checkIn.customerPhone}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#7a7b9f]">{checkIn.associatedBusiness}</TableCell>
                <TableCell className="text-[#7a7b9f]">{checkIn.checkInDate}</TableCell>
                <TableCell>{getStatusBadge(checkIn.status)}</TableCell>
                <TableCell className="font-medium text-[#e5e2e9]">{checkIn.voucherCode}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-[#7a7b9f] hover:text-[#e5e2e9]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                      <DropdownMenuItem className="hover:bg-[#1a1b2d]">Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-[#1a1b2d]">Exportar PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

