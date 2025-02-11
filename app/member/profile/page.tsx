"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Coins, Receipt, ChevronRight } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const response = await fetch(`/api/user/profile?userId=${user.uid}`)
          if (response.ok) {
            const data = await response.json()
            setProfile({
              name: data.displayName || user.displayName || "",
              email: data.email || user.email || "",
              phone: data.phoneNumber || user.phoneNumber || "",
              city: data.city || "",
            })
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        }
      }
    }

    fetchProfile()
  }, [user])

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          displayName: profile.name,
          phoneNumber: profile.phone,
          city: profile.city,
          photoURL: user?.photoURL,
          email: user?.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const result = await response.json()
      
      if (result.success) {
        // Atualizar o estado local
        setIsEditing(false)
        
        // Forçar revalidação dos dados
        router.refresh()
        
        // Recarregar a página para garantir que todos os componentes sejam atualizados
        window.location.reload()
      } else {
        throw new Error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Erro ao atualizar perfil. Tente novamente.")
    }
  }

  // Desabilitar campos que não devem ser editados
  const isEmailDisabled = true // Email vem do provedor de autenticação

  // Mock data for subscription
  const subscription = {
    plan: "Premium",
    price: "R$ 29,90",
    billingCycle: "Mensal",
    nextBilling: "15/06/2023",
    status: "Ativo",
  }

  // Mock data for savings
  const savings = {
    total: 184.21,
    monthly: [
      { month: "Janeiro", amount: 45.25 },
      { month: "Dezembro", amount: 34.22 },
    ],
  }

  // Mock data for transactions
  const transactions = [
    { id: 1, date: "01/05/2023", description: "Pagamento de assinatura", amount: "R$ 29,90", status: "Concluído" },
    { id: 2, date: "01/04/2023", description: "Pagamento de assinatura", amount: "R$ 29,90", status: "Concluído" },
    { id: 3, date: "01/03/2023", description: "Pagamento de assinatura", amount: "R$ 29,90", status: "Concluído" },
  ]

  return (
    <div className="container max-w-4xl py-10">
      {/* Savings Overview Card */}
      <Card className="mb-8 overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#7435db] to-[#a85fdd] p-6">
          <div className="absolute top-6 right-6 flex items-center space-x-2 text-white/90">
            <Badge variant="outline" className="border-white/20 bg-white/10">
              {subscription.status}
            </Badge>
            <span className="text-sm">•</span>
            <span className="text-sm">{subscription.plan}</span>
            <span className="text-sm">•</span>
            <span className="text-sm">{subscription.price}/mês</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white/90">Economia total</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-white">R$ {savings.total.toFixed(2).replace(".", ",")}</span>
                  <ChevronRight className="h-6 w-6 text-white/80" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-white/80">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm font-medium">Últimas economias</span>
                </div>
                <div className="flex space-x-6">
                  {savings.monthly.map((month) => (
                    <div key={month.month} className="space-y-1">
                      <p className="text-sm text-white/60">{month.month}</p>
                      <p className="font-medium text-white">R$ {month.amount.toFixed(2).replace(".", ",")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative h-32 w-32">
              <div className="absolute right-0 top-0">
                <Coins className="h-20 w-20 text-white/20" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Gestão de Assinatura</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="bg-[#131320] border-[#1a1b2d]">
            <CardHeader>
              <CardTitle className="text-[#e5e2e9]">Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
                <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Cancelar" : "Editar Perfil"}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled={true}
                    className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9] opacity-50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="bg-[#1a1b2d] border-[#131320] text-[#e5e2e9]"
                  />
                </div>

                {isEditing && (
                  <Button 
                    className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-white"
                    onClick={handleSave}
                  >
                    Salvar Alterações
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscription">
          <Card className="bg-[#131320] border-[#1a1b2d]">
            <CardHeader>
              <CardTitle className="text-[#e5e2e9]">Gestão de Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-[#1a1b2d] p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-[#e5e2e9] mb-4">Plano Atual: {subscription.plan}</h3>
                <div className="space-y-2 text-[#b5b6c9]">
                  <p>Preço: {subscription.price}</p>
                  <p>Ciclo de Cobrança: {subscription.billingCycle}</p>
                  <p>Próxima Cobrança: {subscription.nextBilling}</p>
                </div>
                <div className="mt-6 space-x-4">
                  <Button className="bg-[#7435db] hover:bg-[#a85fdd] text-white">Fazer Upgrade</Button>
                  <Button variant="outline" className="text-rose-500 hover:bg-rose-500/10">
                    Cancelar Assinatura
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#e5e2e9] mb-4">Histórico de Transações</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                      <TableHead className="text-[#7a7b9f]">Data</TableHead>
                      <TableHead className="text-[#7a7b9f]">Descrição</TableHead>
                      <TableHead className="text-[#7a7b9f]">Valor</TableHead>
                      <TableHead className="text-[#7a7b9f]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                        <TableCell className="text-[#e5e2e9]">{transaction.date}</TableCell>
                        <TableCell className="text-[#e5e2e9]">{transaction.description}</TableCell>
                        <TableCell className="text-[#e5e2e9]">{transaction.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
