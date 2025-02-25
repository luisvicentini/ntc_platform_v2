"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, LayoutGrid, List } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { MemberSheet } from "@/components/member-sheet"
import { MemberFilter } from "@/components/member-filter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DateRange } from "react-day-picker"
import { MemberFilterSheet } from "@/components/member-filter-sheet"
import { MemberFilterModal } from "@/components/member-filter-modal"

interface Member {
  id: string
  displayName: string
  email: string
  phone: string
  photoURL?: string
  subscription: {
    createdAt: string
    expiresAt: string
    status: string
  }
  subscriptions?: Array<{
    createdAt: string
    expiresAt: string
    status: string
  }>
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange>()
  const [loading, setLoading] = useState(true)

  // Função para verificar se há filtros ativos
  const hasActiveFilters = statusFilter !== "all" || (dateRange?.from && dateRange?.to)

  // Função para limpar os filtros
  const handleClearFilters = () => {
    setStatusFilter("all")
    setDateRange(undefined)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/partner/members", {
        headers: {
          "x-session-token": localStorage.getItem("session_token") || ""
        }
      })

      if (!response.ok) {
        throw new Error("Falha ao carregar membros")
      }

      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error("Erro ao carregar membros:", error)
      toast.error("Erro ao carregar membros")
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      member.displayName?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(searchTerm)

    const matchesStatus = 
      statusFilter === "all" ||
      member.subscription?.status === statusFilter

    const matchesDate = 
      !dateRange?.from || !dateRange?.to ||
      (new Date(member.subscription?.expiresAt) >= dateRange.from &&
       new Date(member.subscription?.expiresAt) <= dateRange.to)

    return matchesSearch && matchesStatus && matchesDate
  })

  const handleEditMember = async (member: Member) => {
    try {
      const response = await fetch(`/api/partner/members/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": localStorage.getItem("session_token") || ""
        },
        body: JSON.stringify({
          displayName: member.displayName,
          phone: member.phone,
          subscription: {
            status: member.subscription.status
          }
        })
      })

      if (!response.ok) {
        throw new Error("Falha ao atualizar membro")
      }

      toast.success("Membro atualizado com sucesso")
      fetchMembers() // Recarrega a lista de membros
    } catch (error) {
      console.error("Erro ao atualizar membro:", error)
      toast.error("Erro ao atualizar membro")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7435db]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-[#e5e2e9]">Membros</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#7a7b9f]" />
                <Input
                  placeholder="Buscar membro..."
                  className="pl-8 bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <MemberFilterModal
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="bg-[#131320] border-[#1a1b2d]"
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4 text-[#7a7b9f]" />
              ) : (
                <LayoutGrid className="h-4 w-4 text-[#7a7b9f]" />
              )}
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="bg-[#131320] border-[#1a1b2d] cursor-pointer hover:border-[#7435db] transition-colors"
                onClick={() => setSelectedMember(member)}
              >
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-4">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.displayName}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#1a1b2d] flex items-center justify-center">
                        <User className="h-6 w-6 text-[#7a7b9f]" />
                      </div>
                    )}
                    <CardTitle className="text-sm font-medium text-[#e5e2e9]">
                      {member.displayName}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-[#7a7b9f]">
                    <p>{member.email}</p>
                    <p>{member.phone || "Telefone não informado"}</p>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <Badge
                        variant={member.subscription?.status === "active" ? "success" : "destructive"}
                        className="bg-emerald-500/30 text-emerald-200 border-emerald-500"
                      >
                        {member.subscription?.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {member.subscription?.expiresAt && (
                      <p>
                        Expira em:{" "}
                        {format(new Date(member.subscription.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-[#1a1b2d]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1a1b2d]">
                  <TableHead className="text-[#7a7b9f]">Membro</TableHead>
                  <TableHead className="text-[#7a7b9f]">Email</TableHead>
                  <TableHead className="text-[#7a7b9f]">Telefone</TableHead>
                  <TableHead className="text-[#7a7b9f]">Status</TableHead>
                  <TableHead className="text-[#7a7b9f]">Expira em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="border-[#1a1b2d] cursor-pointer hover:bg-[#1a1b2d]"
                    onClick={() => setSelectedMember(member)}
                  >
                    <TableCell className="font-medium text-[#e5e2e9]">
                      <div className="flex items-center space-x-3">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#1a1b2d] flex items-center justify-center">
                            <User className="h-4 w-4 text-[#7a7b9f]" />
                          </div>
                        )}
                        <span>{member.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#7a7b9f]">{member.email}</TableCell>
                    <TableCell className="text-[#7a7b9f]">
                      {member.phone || "Não informado"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.subscription?.status === "active" ? "success" : "destructive"}
                        className="bg-opacity-15"
                      >
                        {member.subscription?.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#7a7b9f]">
                      {member.subscription?.expiresAt
                        ? format(new Date(member.subscription.expiresAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredMembers.length === 0 && (
          <div className="text-center text-[#7a7b9f] py-10">
            {searchTerm ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
          </div>
        )}

        <MemberSheet
          member={selectedMember}
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          onEdit={handleEditMember}
        />
      </div>
    </div>
  )
}
