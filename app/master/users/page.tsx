"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: "user" | "partner"
  status: "active" | "blocked"
}

// Simulated API functions
const api = {
  getUsers: (): User[] => [
    { id: "1", name: "John Doe", email: "john@example.com", role: "user", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "partner", status: "active" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "user", status: "blocked" },
  ],
  addUser: (user: Omit<User, "id">): User => ({ ...user, id: Math.random().toString() }),
  updateUser: (id: string, user: Partial<User>): User => ({ id, ...user }) as User,
  deleteUser: (id: string): void => {},
  resendAccess: (id: string): void => {},
  blockUser: (id: string): void => {},
  resetPassword: (id: string): void => {},
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(api.getUsers())
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [newUser, setNewUser] = useState<Omit<User, "id">>({ name: "", email: "", role: "user", status: "active" })
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = () => {
    const addedUser = api.addUser(newUser)
    setUsers([...users, addedUser])
    setIsAddUserOpen(false)
    setNewUser({ name: "", email: "", role: "user", status: "active" })
    toast.success("Usuário adicionado com sucesso!")
  }

  const handleUpdateUser = (id: string, updatedFields: Partial<User>) => {
    const updatedUser = api.updateUser(id, updatedFields)
    setUsers(users.map((user) => (user.id === id ? updatedUser : user)))
    setIsEditUserOpen(false)
    setEditingUser(null)
    toast.success("Usuário atualizado com sucesso!")
  }

  const handleDeleteUser = (id: string) => {
    api.deleteUser(id)
    setUsers(users.filter((user) => user.id !== id))
    toast.success("Usuário excluído com sucesso!")
  }

  const handleResendAccess = (id: string) => {
    api.resendAccess(id)
    toast.success("Email de acesso reenviado com sucesso!")
  }

  const handleBlockUser = (id: string) => {
    const user = users.find((u) => u.id === id)
    if (user) {
      const newStatus = user.status === "active" ? "blocked" : "active"
      handleUpdateUser(id, { status: newStatus })
      toast.success(`Usuário ${newStatus === "active" ? "desbloqueado" : "bloqueado"} com sucesso!`)
    }
  }

  const handleResetPassword = (id: string) => {
    api.resetPassword(id)
    toast.success("Senha resetada com sucesso!")
  }

  const openEditUserModal = (user: User) => {
    setEditingUser(user)
    setIsEditUserOpen(true)
  }

  return (
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
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "user" | "partner" })}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320] text-[#e5e2e9] rounded-md"
                  >
                    <option value="user">Usuário</option>
                    <option value="partner">Parceiro</option>
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
                <TableCell className="font-medium text-[#e5e2e9]">{user.name}</TableCell>
                <TableCell className="text-[#7a7b9f]">{user.email}</TableCell>
                <TableCell className="text-[#7a7b9f]">{user.role === "user" ? "Usuário" : "Parceiro"}</TableCell>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
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
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as "user" | "partner" })}
                  className="col-span-3 bg-[#1a1b2d] border-[#131320] text-[#e5e2e9] rounded-md"
                >
                  <option value="user">Usuário</option>
                  <option value="partner">Parceiro</option>
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
  )
}

