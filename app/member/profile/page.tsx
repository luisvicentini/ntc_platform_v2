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
import { Coins, Receipt, ChevronRight, Loader } from "lucide-react"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { SubscriptionManagement } from "./subscription-management"
import { toast } from "sonner"

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
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const response = await fetch(`/api/user/profile?userId=${user.uid}`)
          if (response.ok) {
            const data = await response.json()
            console.log('Dados do perfil:', data) // Para debug
            
            setProfile({
              name: data.displayName || user.displayName || "",
              email: data.email || user.email || "",
              phone: data.phoneNumber || data.phone || user.phoneNumber || "", // Adicionado data.phone como fallback
              city: data.city || "",
            })
          } else {
            console.error("Erro ao buscar perfil:", response.statusText)
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error)
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

  const handleSync = async () => {
    try {
      setSyncLoading(true)
      
      // Primeiro, buscar a assinatura do usuário no Stripe
      const response = await fetch('/api/stripe/customer-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.uid }),
      })

      const data = await response.json()
      
      if (!data.subscriptionId) {
        toast.error('Nenhuma assinatura encontrada para sincronizar')
        return
      }

      // Simular o evento webhook do Stripe
      const webhookResponse = await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'manual-sync'
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              subscription: data.subscriptionId,
              customer: data.customerId
            }
          }
        })
      })

      const webhookResult = await webhookResponse.json()

      if (webhookResponse.ok) {
        toast.success('Assinatura sincronizada com sucesso!')
      } else {
        throw new Error(webhookResult.error || 'Erro ao sincronizar assinatura')
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast.error('Erro ao sincronizar assinatura')
    } finally {
      setSyncLoading(false)
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
      {/*<Card className="mb-8 overflow-hidden">
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
      */}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Gestão de Assinatura</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="bg-zinc-50 border-zinc-200">
            <CardHeader>
              <CardTitle className="text-zinc-500">Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={user?.photoURL || undefined} 
                alt={user?.displayName || "User"}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file && user?.uid) {
                      try {
                        // Verificar o tamanho do arquivo (máximo 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert("A imagem deve ter no máximo 5MB")
                          return
                        }

                        // Verificar o tipo do arquivo
                        if (!file.type.startsWith('image/')) {
                          alert("O arquivo deve ser uma imagem")
                          return
                        }

                        // Converter a imagem para base64
                        const reader = new FileReader()
                        reader.onload = async (event) => {
                          try {
                            const base64 = event.target?.result as string
                            console.log('Imagem convertida para base64')
                            
                            // Fazer o upload da imagem
                            console.log('Iniciando upload...')
                            const response = await fetch("/api/user/profile/upload", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                userId: user.uid,
                                imageBase64: base64,
                              }),
                            })

                            const result = await response.json()
                            
                            if (!response.ok) {
                              throw new Error(result.details || "Erro ao fazer upload da imagem")
                            }

                            if (result.success) {
                              console.log('Upload concluído com sucesso')
                              // Forçar revalidação dos dados
                              router.refresh()
                              
                              // Recarregar a página para atualizar a imagem
                              window.location.reload()
                            }
                          } catch (error: any) {
                            console.error("Erro detalhado:", error)
                            alert(error.message || "Erro ao fazer upload da imagem. Tente novamente.")
                          }
                        }

                        reader.onerror = () => {
                          console.error("Erro ao ler o arquivo")
                          alert("Erro ao processar a imagem. Tente novamente.")
                        }

                        console.log('Iniciando leitura do arquivo...')
                        reader.readAsDataURL(file)
                      } catch (error) {
                        console.error("Erro ao processar imagem:", error)
                        alert("Erro ao processar a imagem. Tente novamente.")
                      }
                    }
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1 rounded-full bg-primary hover:bg-[#a85fdd] cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </label>
              </>
            )}
          </div>
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
                    className="border-zinc-200 text-zinc-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled={true}
                    className="border-zinc-200 text-zinc-500 opacity-50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <PhoneNumberInput
                    defaultCountry="BR"
                    value={profile.phone}
                    onChange={(value) => setProfile({ ...profile, phone: value || "" })}
                    disabled={!isEditing}
                    className="text-zinc-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="border-zinc-200 text-zinc-500"
                  />
                </div>

                {isEditing && (
                  <Button 
                    className="w-full bg-primary hover:bg-[#a85fdd] text-white"
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
          <SubscriptionManagement userId={user?.uid || ''} />
        </TabsContent>
      </Tabs>

      {/* <div className="flex gap-4 mt-6">
        <Button
          onClick={handleSync}
          disabled={syncLoading}
          variant="secondary"
        >
          {syncLoading ? <Loader className="mr-2" /> : null}
          Sincronizar Assinatura
        </Button>
      </div> */}
    </div>
  )
}
