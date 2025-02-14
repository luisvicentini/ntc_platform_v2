"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SubscriptionManagementModal } from "@/components/subscription-management-modal"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { EstablishmentLinkModal } from "@/components/establishment-link-modal"
import { AddUserModal } from "@/components/add-user-modal"
import { DeleteUserModal } from "@/components/delete-user-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, User, Users, Crown, MoreVertical, Grid, List, Check, X } from "lucide-react"
import type { UserProfile, UserListResponse } from "@/types/user"

const ITEMS_PER_PAGE = 10

export default function UsersPage() {
  return (
    <SubscriptionProvider>
      <UsersContent />
    </SubscriptionProvider>
  )
}

function UsersContent() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [activeTab, searchTerm, allUsers])

  useEffect(() => {
    const total = filteredUsers.length
    setTotalPages(Math.ceil(total / ITEMS_PER_PAGE))
  }, [filteredUsers])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users/list", { credentials: "include" })

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários")
      }

      const data = await response.json()
      setAllUsers(data.users)
      filterUsers()
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...allUsers]

    // Filtrar por tipo
    if (activeTab !== "all") {
      filtered = filtered.filter(user => user.userType === activeTab)
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const getPaginatedUsers = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredUsers.slice(start, end)
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "business":
        return <Building2 className="h-4 w-4" />
      case "member":
        return <User className="h-4 w-4" />
      case "partner":
        return <Users className="h-4 w-4" />
      case "master":
        return <Crown className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "business":
        return "bg-blue-500"
      case "member":
        return "bg-green-500"
      case "partner":
        return "bg-purple-500"
      case "master":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUserTypeText = (userType: string) => {
    switch (userType) {
      case "business":
        return "Estabelecimento"
      case "member":
        return "Membro"
      case "partner":
        return "Parceiro"
      case "master":
        return "Master"
      default:
        return userType
    }
  }

  const handleEdit = async (user: UserProfile) => {
    setSelectedUser(user)
    setShowAddUserModal(true)
  }

  const handleResendActivation = async (user: UserProfile) => {
    try {
      const response = await fetch("/api/users/resend-activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao reenviar email de ativação")
      }

      toast.success("Email de ativação reenviado com sucesso")
      fetchUsers() // Atualizar lista para mostrar novo status
    } catch (error) {
      console.error("Erro ao reenviar email:", error)
      toast.error("Erro ao reenviar email de ativação")
    }
  }

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    const response = await fetch(`/api/users/${userToDelete.id}`, {
      method: "DELETE",
      credentials: "include"
    })

    if (!response.ok) {
      throw new Error("Erro ao excluir usuário")
    }

    // Atualizar lista após exclusão
    fetchUsers()
  }

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  const handleLinkSubscription = (user: UserProfile) => {
    setSelectedUser(user)
    setShowSubscriptionModal(true)
  }

  const handleCloseSubscriptionModal = () => {
    setSelectedUser(null)
    setShowSubscriptionModal(false)
    fetchUsers()
  }

  const handleLinkEstablishment = (user: UserProfile) => {
    setSelectedUser(user)
    setShowEstablishmentModal(true)
  }

  const handleCloseEstablishmentModal = () => {
    setSelectedUser(null)
    setShowEstablishmentModal(false)
    fetchUsers()
  }

  const handleCloseAddUserModal = () => {
    setSelectedUser(null)
    setShowAddUserModal(false)
    fetchUsers()
  }

  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9] mb-6">Usuários</h1>
        <div className="text-[#7a7b9f]">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Usuários</h1>
        <Button onClick={() => setShowAddUserModal(true)}>Adicionar Usuário</Button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#1a1b2d] text-[#e5e2e9]">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="business">Estabelecimentos</TabsTrigger>
              <TabsTrigger value="member">Membros</TabsTrigger>
              <TabsTrigger value="partner">Parceiros</TabsTrigger>
              <TabsTrigger value="master">Master</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-4">
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-[#1a1b2d] border-[#131320]"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
              className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
            >
              {viewMode === "card" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {viewMode === "card" ? renderUserCards(getPaginatedUsers()) : renderUserTable(getPaginatedUsers())}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {showSubscriptionModal && selectedUser && (
        <SubscriptionManagementModal
          isOpen={showSubscriptionModal}
          onClose={handleCloseSubscriptionModal}
          memberId={selectedUser.id}
          memberName={selectedUser.displayName}
        />
      )}

      {showEstablishmentModal && selectedUser && (
        <EstablishmentLinkModal
          isOpen={showEstablishmentModal}
          onClose={handleCloseEstablishmentModal}
          userId={selectedUser.id}
          userName={selectedUser.displayName}
        />
      )}

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={handleCloseAddUserModal}
        user={selectedUser}
      />

      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          isOpen={showDeleteModal}
          onClose={handleDeleteModalClose}
          user={userToDelete}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )

  function renderUserCards(users: UserProfile[]) {
    if (users.length === 0) {
      return (
        <div className="text-[#7a7b9f]">Nenhum usuário encontrado.</div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="bg-[#131320] border-[#1a1b2d] p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-end space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photoURL || ""} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Badge className={getUserTypeColor(user.userType)}>
                  <span className="flex items-center space-x-1">
                    {getUserTypeIcon(user.userType)}
                    <span>{getUserTypeText(user.userType)}</span>
                  </span>
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1b2d] border-[#131320]">
                  <DropdownMenuItem onClick={() => handleEdit(user)} className="text-[#e5e2e9]">
                    Editar
                  </DropdownMenuItem>
                  {(user.status === "inactive" || user.status === "expired") && (
                    <DropdownMenuItem onClick={() => handleResendActivation(user)} className="text-[#e5e2e9]">
                      Reenviar Email de Ativação
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-red-500">
                    Excluir
                  </DropdownMenuItem>
                  {user.userType === "member" && (
                    <DropdownMenuItem onClick={() => handleLinkSubscription(user)} className="text-[#e5e2e9]">
                      Vincular Assinatura
                    </DropdownMenuItem>
                  )}
                  {user.userType === "business" && (
                    <DropdownMenuItem onClick={() => handleLinkEstablishment(user)} className="text-[#e5e2e9]">
                      Vincular Estabelecimento
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-4">
              <h3 className="text-[#e5e2e9] font-semibold truncate">{user.displayName}</h3>
              <p className="text-[#7a7b9f] text-sm truncate">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="border-[#1a1b2d]">
                  {user.status === "active" ? (
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <X className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {user.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
            
            {user.userType === "business" && "establishment" in user && (
              <p className="text-[#7a7b9f] text-sm mt-2">
                Estabelecimento: {(user as any).establishment?.name || "Não vinculado"}
                {(user as any).establishments?.length > 1 && (
                  <span className="ml-1 text-sm text-[#7435db]">
                    +{(user as any).establishments.length - 1}
                  </span>
                )}
              </p>
            )}

            {user.userType === "member" && "partner" in user && (
              <p className="text-[#7a7b9f] text-sm mt-2">
                Parceiro: {(user as any).partner?.name || "Não vinculado"}
              </p>
            )}
          </Card>
        ))}
      </div>
    )
  }

  function renderUserTable(users: UserProfile[]) {
    if (users.length === 0) {
      return (
        <div className="text-[#7a7b9f]">Nenhum usuário encontrado.</div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vínculo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-[#e5e2e9]">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{user.displayName}</span>
                </div>
              </TableCell>
              <TableCell className="text-[#7a7b9f]">{user.email}</TableCell>
              <TableCell>
                <Badge className={getUserTypeColor(user.userType)}>
                  <span className="flex items-center space-x-1">
                    {getUserTypeIcon(user.userType)}
                    <span>{getUserTypeText(user.userType)}</span>
                  </span>
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-[#1a1b2d]">
                  {user.status === "active" ? (
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <X className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {user.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-[#7a7b9f]">
                {user.userType === "business" && (
                  <>
                    {(user as any).establishment?.name || "Não vinculado"}
                    {(user as any).establishments?.length > 1 && (
                      <span className="ml-1 text-sm text-[#7435db]">
                        +{(user as any).establishments.length - 1}
                      </span>
                    )}
                  </>
                )}
                {user.userType === "member" && (
                  <>
                    {(user as any).partner?.name || "Não vinculado"}
                    {(user as any).partners?.length > 1 && (
                      <span className="ml-1 text-sm text-[#7435db]">
                        +{(user as any).partners.length - 1}
                      </span>
                    )}
                  </>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1b2d] border-[#131320]">
                    <DropdownMenuItem onClick={() => handleEdit(user)} className="text-[#e5e2e9]">
                      Editar
                    </DropdownMenuItem>
                    {(user.status === "inactive" || user.status === "expired") && (
                      <DropdownMenuItem onClick={() => handleResendActivation(user)} className="text-[#e5e2e9]">
                        Reenviar Email de Ativação
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-red-500">
                      Excluir
                    </DropdownMenuItem>
                    {user.userType === "member" && (
                      <DropdownMenuItem onClick={() => handleLinkSubscription(user)} className="text-[#e5e2e9]">
                        Vincular Assinatura
                      </DropdownMenuItem>
                    )}
                    {user.userType === "business" && (
                      <DropdownMenuItem onClick={() => handleLinkEstablishment(user)} className="text-[#e5e2e9]">
                        Vincular Estabelecimento
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
}
