"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Search, Filter, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Report {
  id: string
  customerName: string
  customerPhone: string
  associatedBusiness: string
  checkInDate: string
  status: string
  voucherCode: string
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/business/reports")
        if (!response.ok) {
          throw new Error("Erro ao carregar relatórios")
        }
        const data = await response.json()
        setReports(data)
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error)
        setError("Não foi possível carregar os relatórios")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const filteredReports = reports.filter((report) =>
    report.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Check-in Realizado":
        return <Badge className="bg-[#042f2e] text-[#2dd4bf] hover:bg-[#042f2e]">{status}</Badge>
      case "Voucher Expirado":
        return (
          <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-500">
            {status}
          </Badge>
        )
      case "Check-in Pendente":
        return (
          <Badge variant="secondary" className="bg-gray-900/50 text-gray-400">
            {status}
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-900/50 text-gray-400">
            {status}
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
              {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7a7b9f]"></div>
                    <span className="ml-2 text-[#7a7b9f]">Carregando relatórios...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-[#7a7b9f]">
                  Nenhum relatório encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#e5e2e9]">{report.customerName}</span>
                      <span className="text-sm text-[#7a7b9f]">{report.customerPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#7a7b9f]">{report.associatedBusiness}</TableCell>
                  <TableCell className="text-[#7a7b9f]">{report.checkInDate}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="font-medium text-[#e5e2e9]">{report.voucherCode}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
