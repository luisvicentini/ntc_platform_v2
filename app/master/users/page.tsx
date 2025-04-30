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
import { DefaultPaymentLinkModal } from "@/components/default-payment-link-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Building2, User, Users, Crown, MoreVertical, Grid, List, Check, X, Edit, Mail, Trash, Link, CreditCard } from "lucide-react"
import type { UserProfile, UserListResponse } from "@/types/user"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PopoverArrow } from "@radix-ui/react-popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SubscriptionManagementSidebar } from "@/components/subscription-management-sidebar"

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [showSubscriptionSidebar, setShowSubscriptionSidebar] = useState(false)
  const ITEMS_PER_PAGE = 12
  const [totalRecords, setTotalRecords] = useState(0)
  const [showDefaultPaymentLinkModal, setShowDefaultPaymentLinkModal] = useState(false)

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdownId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdownId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users/list", { credentials: "include" })

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários")
      }

      const data = await response.json()
      setAllUsers(data.users)
      setTotalRecords(data.total)
      filterUsers()
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...allUsers]

    if (activeTab !== "all") {
      filtered = filtered.filter(user => user.userType === activeTab)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.displayName?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(filtered)
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
        return "bg-blue-500 text-white font-medium"
      case "member":
        return "bg-green-500 text-white font-medium"
      case "partner":
        return "bg-purple-500 text-white font-medium"
      case "master":
        return "bg-yellow-500 text-white font-medium"
      default:
        return "bg-zinc-400 text-white font-medium"
    }
  }

  const getUserTypeText = (userType: string) => {
    switch (userType) {
      case "business":
        return "Estabelecimento"
      case "member":
        return "Assinante"
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-zinc-500 mb-6">Usuários</h1>
        <div className="text-zinc-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-500 mb-1">Gerenciar Usuários</h1>
          <p className="text-sm text-zinc-400">
            Total de {totalRecords} usuários no sistema | Exibindo: {getPaginatedUsers().length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            onClick={() => setShowDefaultPaymentLinkModal(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Link Padrão
          </Button>
          
          <Button onClick={() => setShowAddUserModal(true)}>
            <User className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-zinc-100 text-zinc-500">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="business">Estabelecimentos</TabsTrigger>
              <TabsTrigger value="member">Assinantes</TabsTrigger>
              <TabsTrigger value="partner">Parceiros</TabsTrigger>
              <TabsTrigger value="master">Master</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-4">
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-zinc-100 border-zinc-200"
            />
            <Button
              variant="outline"
              size="default"
              onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
              className="bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-500"
            >
              {viewMode === "card" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {viewMode === "card" ? renderUserCards(filteredUsers) : renderUserTable(filteredUsers)}
        </div>
      </div>

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

      {selectedUser && (
        <SubscriptionManagementSidebar
          isOpen={showSubscriptionSidebar}
          onClose={() => {
            setSelectedUser(null)
            setShowSubscriptionSidebar(false)
          }}
          memberId={selectedUser.id}
          memberName={selectedUser.displayName}
        />
      )}

      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          isOpen={showDeleteModal}
          onClose={handleDeleteModalClose}
          user={userToDelete}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => {
          setSelectedUser(null)
          setShowAddUserModal(false)
        }}
        user={selectedUser}
      />

      <DefaultPaymentLinkModal
        isOpen={showDefaultPaymentLinkModal}
        onClose={() => setShowDefaultPaymentLinkModal(false)}
      />
    </div>
  )

  function renderUserCards(users: UserProfile[]) {
    if (users.length === 0) {
      return (
        <div className="text-zinc-400">Nenhum usuário encontrado.</div>
      )
    }

    const paginatedUsers = getPaginatedUsers()

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedUsers.map((user) => (
            <Card key={user.id} className="bg-zinc-50 border-zinc-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-end space-x-4">
                  <Avatar className="h-12 w-12 bg-zinc-200">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || 'Usuário'} />
                    <AvatarFallback>
                      {user.displayName 
                        ? user.displayName.substring(0, 2).toUpperCase()
                        : user.email 
                          ? user.email.substring(0, 2).toUpperCase()
                          : 'U'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <Badge className={getUserTypeColor(user.userType)}>
                    <span className="flex items-center space-x-1">
                      {getUserTypeIcon(user.userType)}
                      <span>{getUserTypeText(user.userType)}</span>
                    </span>
                  </Badge>
                </div>
                <div className="dropdown-container relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                    className="relative z-10 hover:bg-zinc-200 rounded-xl p-2"
                  >
                    <MoreVertical className="h-4 w-4 text-zinc-500" />
                  </Button>
                  
                  {openDropdownId === user.id && (
                    <div className="absolute right-0 top-full mt-1 min-w-[200px] rounded-md bg-zinc-100 p-2 shadow-md border border-zinc-200 z-50">
                      <div className="flex flex-col space-y-1">
                        <button
                          className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowSubscriptionSidebar(true)
                            setOpenDropdownId(null)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </button>
                        
                        {(user.status === "inactive" || user.status === "expired") && (
                          <button
                            className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                            onClick={() => {
                              handleResendActivation(user)
                              setOpenDropdownId(null)
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Reenviar Email de Ativação
                          </button>
                        )}
                        
                        <button
                          className="text-left px-2 py-1.5 text-sm text-red-500 hover:bg-zinc-100 rounded-sm flex items-center"
                          onClick={() => {
                            handleDeleteClick(user)
                            setOpenDropdownId(null)
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </button>
                        
                        {user.userType === "member" && (
                          <button
                            className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                            onClick={() => {
                              handleLinkSubscription(user)
                              setOpenDropdownId(null)
                            }}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Vincular Assinatura
                          </button>
                        )}
                        
                        {user.userType === "business" && (
                          <button
                            className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                            onClick={() => {
                              handleLinkEstablishment(user)
                              setOpenDropdownId(null)
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Vincular Estabelecimento
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-zinc-500 font-semibold truncate">{user.displayName}</h3>
                <p className="text-zinc-400 text-sm truncate">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className="bg-white border-zinc-100 text-zinc-500 hover:bg-white hover:text-zinc-500">
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
                <p className="text-zinc-400 text-sm mt-2">
                  Estabelecimento: {(user as any).establishment?.name || "Não vinculado"}
                  {(user as any).establishments?.length > 1 && (
                    <span className="ml-1 text-sm text-zinc-500">
                      +{(user as any).establishments.length - 1}
                    </span>
                  )}
                </p>
              )}

              {user.userType === "member" && "partner" in user && (
                <p className="text-zinc-400 text-sm mt-2">
                  Parceiro: {(user as any).partner?.name || "Não vinculado"}
                </p>
              )}
            </Card>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </>
    )
  }

  function renderUserTable(users: UserProfile[]) {
    if (users.length === 0) {
      return (
        <div className="text-zinc-400">Nenhum usuário encontrado.</div>
      )
    }

    const paginatedUsers = getPaginatedUsers()

    return (
      <>
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
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-zinc-100">
                <TableCell className="font-medium text-zinc-500">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || 'Usuário'} />
                      <AvatarFallback>
                        {user.displayName 
                          ? user.displayName.substring(0, 2).toUpperCase()
                          : user.email 
                            ? user.email.substring(0, 2).toUpperCase()
                            : 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400">{user.email}</TableCell>
                <TableCell>
                  <Badge className={getUserTypeColor(user.userType)}>
                    <span className="flex items-center space-x-1">
                      {getUserTypeIcon(user.userType)}
                      <span>{getUserTypeText(user.userType)}</span>
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-white border-zinc-100 text-zinc-500 hover:bg-white hover:text-zinc-500">
                    {user.status === "active" ? (
                      <Check className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {user.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-400">
                  {user.userType === "business" && (
                    <>
                      {(user as any).establishment?.name || "Não vinculado"}
                      {(user as any).establishments?.length > 1 && (
                        <span className="ml-1 text-sm text-zinc-500">
                          +{(user as any).establishments.length - 1}
                        </span>
                      )}
                    </>
                  )}
                  {user.userType === "member" && (
                    <>
                      {(user as any).partner?.name || "Não vinculado"}
                      {(user as any).partners?.length > 1 && (
                        <span className="ml-1 text-sm text-zinc-500">
                          +{(user as any).partners.length - 1}
                        </span>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="dropdown-container relative">
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                      className="relative z-10 hover:bg-zinc-100"
                    >
                      <MoreVertical className="h-4 w-4 text-zinc-500 hover:text-zinc-500" />
                    </Button>
                    
                    {openDropdownId === user.id && (
                      <div className="absolute right-0 top-full mt-1 min-w-[200px] rounded-md bg-zinc-100 p-2 shadow-md border border-zinc-200 z-50">
                        <div className="flex flex-col space-y-1">
                          <button
                            className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowSubscriptionSidebar(true)
                              setOpenDropdownId(null)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </button>
                          
                          {(user.status === "inactive" || user.status === "expired") && (
                            <button
                              className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                              onClick={() => {
                                handleResendActivation(user)
                                setOpenDropdownId(null)
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Reenviar Email de Ativação
                            </button>
                          )}
                          
                          <button
                            className="text-left px-2 py-1.5 text-sm text-red-500 hover:bg-zinc-100 rounded-sm flex items-center"
                            onClick={() => {
                              handleDeleteClick(user)
                              setOpenDropdownId(null)
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir
                          </button>
                          
                          {user.userType === "member" && (
                            <button
                              className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                              onClick={() => {
                                handleLinkSubscription(user)
                                setOpenDropdownId(null)
                              }}
                            >
                              <Link className="h-4 w-4 mr-2" />
                              Vincular Assinatura
                            </button>
                          )}
                          
                          {user.userType === "business" && (
                            <button
                              className="text-left px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 rounded-sm flex items-center"
                              onClick={() => {
                                handleLinkEstablishment(user)
                                setOpenDropdownId(null)
                              }}
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              Vincular Estabelecimento
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </>
    )
  }
}
