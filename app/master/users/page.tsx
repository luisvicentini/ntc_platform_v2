"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal, Plus, Link as LinkIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { SubscriptionModal } from "@/components/subscription-modal"
import { SubscriptionProvider } from "@/contexts/subscription-context"

interface User {
  id: string
  displayName: string
  email: string
  userType: "master" | "partner" | "member" | "business"
  status: "pending" | "active" | "blocked"
  createdAt: string
  updatedAt: string
}

const api = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetch("/api/users")
    if (!response.ok) {
      throw new Error("Erro ao buscar usuários")
    }
    return response.json()
  },
  addUser: async (user: { name: string, email: string, role: string }): Promise<User> => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erro ao adicionar usuário")
    }
    return response.json()
  },
  updateUser: async (id: string, user: Partial<User>): Promise<User> => {
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
    if (!response.ok) {
      throw new Error("Erro ao atualizar usuário")
    }
    return response.json()
  },
  deleteUser: async (id: string): Promise<void> => {
    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Erro ao excluir usuário")
    }
  },
  resendAccess: async (id: string): Promise<void> => {
    const response = await fetch(`/api/users/${id}/resend-access`, {
      method: "POST",
    })
    if (!response.ok) {
      throw new Error("Erro ao reenviar acesso")
    }
  },
  blockUser: async (id: string): Promise<void> => {
    const response = await fetch(`/api/users/${id}/block`, {
      method: "POST",
    })
    if (!response.ok) {
      throw new Error("Erro ao alterar status do usuário")
    }
  },
}

export default function UsersPage() {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    displayName: "",
    email: "",
    userType: "master" as "master" | "partner" | "member",
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await api.getUsers()
        setUsers(data)
      } catch (error: any) {
        toast.error(error.message)
      }
    }
    loadUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = async () => {
    try {
      const addedUser = await api.addUser({
        name: newUser.displayName,
        email: newUser.email,
        role: newUser.userType,
      })
      setUsers([...users, addedUser])
      setIsAddUserOpen(false)
      setNewUser({
        displayName: "",
        email: "",
        userType: "master",
      })
      toast.success("Usuário adicionado com sucesso! Um email de ativação foi enviado.")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateUser = async (id: string, updatedFields: Partial<User>) => {
    try {
      const updatedUser = await api.updateUser(id, updatedFields)
      setUsers(users.map((user) => (user.id === id ? updatedUser : user)))
      setIsEditUserOpen(false)
      setEditingUser(null)
      toast.success("Usuário atualizado com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id)
      setUsers(users.filter((user) => user.id !== id))
      toast.success("Usuário excluído com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleResendAccess = async (id: string) => {
    try {
      await api.resendAccess(id)
      toast.success("Email de acesso reenviado com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleBlockUser = async (id: string) => {
    try {
      await api.blockUser(id)
      const user = users.find((u) => u.id === id)
      if (user) {
        const newStatus = user.status === "active" ? "blocked" : "active"
        setUsers(users.map((u) => 
          u.id === id ? { ...u, status: newStatus } : u
        ))
        toast.success(`Usuário ${newStatus === "active" ? "desbloqueado" : "bloqueado"} com sucesso!`)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleResetPassword = async (id: string) => {
    try {
      await api.resendAccess(id)
      toast.success("Email de redefinição de senha enviado com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openEditUserModal = (user: User) => {
    setEditingUser(user)
    setIsEditUserOpen(true)
  }

  const openSubscriptionModal = (user: User) => {
    setSelectedMember({ id: user.id, name: user.displayName })
    setIsSubscriptionModalOpen(true)
  }

  return (
    <SubscriptionProvider>
      <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Usuários e Parceiros</h1>

        <div className="flex items-center space-x-4">
          <div className="relative w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
            <Input
              placeholder="Pesquisar usuário ou parceiro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
            />
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7435db] hover:bg-[#7435db]/80">
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#131320] text-[#e5e2e9]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário/Parceiro</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Função
                  </Label>
                  <select
                    id="role"
                    value={newUser.userType}
                    onChange={(e) => setNewUser({ ...newUser, userType: e.target.value as "master" | "partner" | "member" })}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320] text-[#e5e2e9] rounded-md"
                  >
                    <option value="master">Master</option>
                    <option value="partner">Parceiro</option>
                    <option value="member">Membro</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleAddUser} className="bg-[#7435db] hover:bg-[#7435db]/80">
                Adicionar
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border border-[#1a1b2d] bg-[#131320]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
              <TableHead className="text-[#7a7b9f]">Nome</TableHead>
              <TableHead className="text-[#7a7b9f]">Email</TableHead>
              <TableHead className="text-[#7a7b9f]">Função</TableHead>
              <TableHead className="text-[#7a7b9f]">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                <TableCell className="font-medium text-[#e5e2e9]">{user.displayName}</TableCell>
                <TableCell className="text-[#7a7b9f]">{user.email}</TableCell>
                <TableCell className="text-[#7a7b9f]">
                  {user.userType === "master" ? "Usuário" : user.userType === "partner" ? "Parceiro" : "Membro"}
                </TableCell>
                <TableCell className="text-[#7a7b9f]">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      user.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {user.status === "active" ? "Ativo" : "Bloqueado"}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-[#7a7b9f] hover:text-[#e5e2e9]">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                      <DropdownMenuItem onClick={() => openEditUserModal(user)} className="hover:bg-[#1a1b2d]">
                        Editar usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user.id)}
                        className="hover:bg-[#1a1b2d] text-red-500"
                      >
                        Excluir usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResendAccess(user.id)} className="hover:bg-[#1a1b2d]">
                        Reenviar acesso
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBlockUser(user.id)} className="hover:bg-[#1a1b2d]">
                        {user.status === "active" ? "Bloquear acesso" : "Desbloquear acesso"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user.id)} className="hover:bg-[#1a1b2d]">
                        Resetar senha
                      </DropdownMenuItem>
                      {user.userType === "member" && (
                        <DropdownMenuItem onClick={() => openSubscriptionModal(user)} className="hover:bg-[#1a1b2d]">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Vincular a Parceiro
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

        {selectedMember && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            memberId={selectedMember.id}
            memberName={selectedMember.name}
          />
        )}

        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="bg-[#131320] text-[#e5e2e9]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Função
                </Label>
                <select
                  id="edit-role"
                  value={editingUser.userType}
                  onChange={(e) => setEditingUser({ ...editingUser, userType: e.target.value as "master" | "partner" | "member" })}
                  className="col-span-3 bg-[#1a1b2d] border-[#131320] text-[#e5e2e9] rounded-md"
                >
                  <option value="master">Usuário</option>
                  <option value="partner">Parceiro</option>
                  <option value="member">Membro</option>
                </select>
              </div>
            </div>
          )}
          <Button
            onClick={() => editingUser && handleUpdateUser(editingUser.id, editingUser)}
            className="bg-[#7435db] hover:bg-[#7435db]/80"
          >
            Salvar Alterações
          </Button>
        </DialogContent>
      </Dialog>
      </div>
    </SubscriptionProvider>
  )
}
