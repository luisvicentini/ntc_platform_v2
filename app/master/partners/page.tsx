"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Partner {
  id: string
  displayName: string
  email: string
  establishments: number
  members: number
  status: "active" | "pending" | "blocked"
  createdAt: string
  updatedAt: string
}

export default function PartnersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const response = await fetch("/api/partners")
        if (!response.ok) {
          throw new Error("Erro ao carregar parceiros")
        }
        const data = await response.json()
        setPartners(data)
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    loadPartners()
  }, [])

  const filteredPartners = partners.filter((partner) => 
    partner.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: Partner["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-[#042f2e] text-[#2dd4bf] hover:bg-[#042f2e]">Ativo</Badge>
      case "pending":
        return <Badge className="bg-yellow-900 text-yellow-500 hover:bg-yellow-900">Pendente</Badge>
      case "blocked":
        return (
          <Badge variant="secondary" className="bg-red-900 text-red-500 hover:bg-red-900">
            Bloqueado
          </Badge>
        )
    }
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Parceiros</h1>

        <div className="relative w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
          <Input
            placeholder="Pesquisar parceiro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
          />
        </div>
      </div>

      <div className="rounded-md border border-[#1a1b2d] bg-[#131320]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
              <TableHead className="text-[#7a7b9f]">Nome</TableHead>
              <TableHead className="text-[#7a7b9f]">Email</TableHead>
              <TableHead className="text-[#7a7b9f]">Estabelecimentos</TableHead>
              <TableHead className="text-[#7a7b9f]">Membros</TableHead>
              <TableHead className="text-[#7a7b9f]">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#7a7b9f] py-4">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#7a7b9f] py-4">
                  Nenhum parceiro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((partner) => (
                <TableRow key={partner.id} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                  <TableCell className="font-medium text-[#e5e2e9]">{partner.displayName}</TableCell>
                  <TableCell className="text-[#7a7b9f]">{partner.email}</TableCell>
                  <TableCell className="text-[#7a7b9f]">{partner.establishments}</TableCell>
                  <TableCell className="text-[#7a7b9f]">{partner.members}</TableCell>
                  <TableCell>{getStatusBadge(partner.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-[#7a7b9f] hover:text-[#e5e2e9]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                        <DropdownMenuItem className="hover:bg-[#1a1b2d]">Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-[#1a1b2d]">Editar parceiro</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-[#1a1b2d] text-red-500">
                          Excluir parceiro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
