"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

interface Member {
  id: string
  displayName: string
  email: string
  photoURL?: string
  status: "active" | "pending" | "blocked"
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export default function MembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch(`/api/partners/${user?.uid}/members`)
        if (!response.ok) {
          throw new Error("Erro ao carregar membros")
        }
        const data = await response.json()
        setMembers(data)
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (user?.uid) {
      loadMembers()
    }
  }, [user?.uid])

  const filteredMembers = members.filter(
    (member) =>
      member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Meus Membros</h1>

        <div className="flex items-center space-x-4">
          <div className="relative w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
            <Input
              placeholder="Pesquisar membro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[#1a1b2d] bg-[#131320]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
              <TableHead className="text-[#7a7b9f] w-[50px]"></TableHead>
              <TableHead className="text-[#7a7b9f]">Nome</TableHead>
              <TableHead className="text-[#7a7b9f]">Email</TableHead>
              <TableHead className="text-[#7a7b9f]">Status</TableHead>
              <TableHead className="text-[#7a7b9f]">Expira em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[#7a7b9f]">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[#7a7b9f]">
                  Nenhum membro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id} className="border-[#1a1b2d]">
                  <TableCell>
                    <Avatar>
                      {member.photoURL ? (
                        <AvatarImage src={member.photoURL} alt={member.displayName} />
                      ) : (
                        <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                      )}
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-[#e5e2e9]">
                    {member.displayName}
                  </TableCell>
                  <TableCell className="text-[#7a7b9f]">{member.email}</TableCell>
                  <TableCell className="text-[#7a7b9f]">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        member.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {member.status === "active" ? "Ativo" : "Bloqueado"}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#7a7b9f]">
                    {member.expiresAt ? new Date(member.expiresAt).toLocaleDateString("pt-BR") : "Sem data"}
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
