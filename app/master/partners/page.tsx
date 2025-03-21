"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Partner {
  id: string
  displayName: string
  email: string
  photoURL?: string
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

  // Função para gerar as iniciais do nome
  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-500">Parceiros</h1>

        <div className="relative w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Pesquisar parceiro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-100 text-zinc-500 border-zinc-200"
          />
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-100">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 hover:bg-zinc-100">
              <TableHead className="text-zinc-400 w-[50px]"></TableHead>
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Estabelecimentos</TableHead>
              <TableHead className="text-zinc-400">Assinantes</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-400 py-4">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-400 py-4">
                  Nenhum parceiro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((partner) => (
                <TableRow key={partner.id} className="border-zinc-200 hover:bg-zinc-100">
                  <TableCell>
                    <Avatar>
                      {partner.photoURL ? (
                        <AvatarImage src={partner.photoURL} alt={partner.displayName} />
                      ) : (
                        <AvatarFallback>{getInitials(partner.displayName)}</AvatarFallback>
                      )}
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-zinc-500">{partner.displayName}</TableCell>
                  <TableCell className="text-zinc-400">{partner.email}</TableCell>
                  <TableCell className="text-zinc-400">{partner.establishments}</TableCell>
                  <TableCell className="text-zinc-400">{partner.members}</TableCell>
                  <TableCell>{getStatusBadge(partner.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-500">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-100 border-zinc-200 text-zinc-500">
                        <DropdownMenuItem className="hover:bg-zinc-100">Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-zinc-100">Editar parceiro</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-zinc-100 text-red-500">
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
