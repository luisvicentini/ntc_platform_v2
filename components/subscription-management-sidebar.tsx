import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Link as LinkIcon, AlertTriangle } from "lucide-react"
import { createPartnerLink, getPartnerLinks } from "@/lib/firebase/partner-links"
import type { PartnerSalesLink } from "@/types/partner"
import { PlanSelectionDialog } from "@/components/plan-selection-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface LastlinkPlan {
  name: string
  link: string
  interval: string
  description: string
}

interface CheckoutOptions {
  stripeEnabled: boolean
  lastlinkEnabled: boolean
  lastlinkPlans: LastlinkPlan[]
}

interface SubscriptionManagementSidebarProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

// Componente de alerta para mudanças não salvas
function AlertBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  
  return (
    <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700">Alterações não salvas</AlertTitle>
      <AlertDescription className="text-amber-600">
        Você tem alterações não salvas nas opções de checkout. 
        Para não perder suas configurações, clique em "Salvar" no final da página.
      </AlertDescription>
    </Alert>
  );
}

export function SubscriptionManagementSidebar({
  isOpen,
  onClose,
  memberId,
  memberName,
}: SubscriptionManagementSidebarProps) {
  const [loading, setLoading] = useState(false)
  const [newLinkName, setNewLinkName] = useState("")
  const [salesLinks, setSalesLinks] = useState<PartnerSalesLink[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [originalCheckoutOptions, setOriginalCheckoutOptions] = useState<CheckoutOptions>({
    stripeEnabled: true,
    lastlinkEnabled: false,
    lastlinkPlans: []
  })
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    phone: "",
    userType: "",
    status: "",
    pixelId: "", // Facebook Pixel ID
    analyticsId: "", // Google Analytics ID
    checkoutOptions: {
      stripeEnabled: true,
      lastlinkEnabled: false,
      lastlinkPlans: []
    } as CheckoutOptions
  })
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedPriceId, setSelectedPriceId] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
  } | null>(null)
  const [activeCheckoutTab, setActiveCheckoutTab] = useState("stripe")
  const [newLastlinkPlan, setNewLastlinkPlan] = useState({
    name: "",
    link: "",
    interval: "month",
    description: ""
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${memberId}`)
        if (response.ok) {
          const data = await response.json()
          const checkoutOptions = data.checkoutOptions || {
            stripeEnabled: true,
            lastlinkEnabled: false,
            lastlinkPlans: []
          };
          
          setUserData({
            displayName: data.displayName || "",
            email: data.email || "",
            phone: data.phone || "",
            userType: data.userType || "",
            status: data.status || "",
            pixelId: data.pixelId || "",
            analyticsId: data.analyticsId || "",
            checkoutOptions
          })
          
          // Armazenar as opções originais para poder comparar depois
          setOriginalCheckoutOptions(JSON.parse(JSON.stringify(checkoutOptions)))
          setHasUnsavedChanges(false)
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        toast.error("Erro ao carregar dados do usuário")
      }
    }

    if (isOpen && memberId) {
      fetchUserData()
    }
  }, [isOpen, memberId])

  useEffect(() => {
    const fetchPartnerLinks = async () => {
      if (userData.userType === "partner") {
        try {
          const links = await getPartnerLinks(memberId)
          setSalesLinks(links as PartnerSalesLink[])
        } catch (error) {
          console.error("Erro ao buscar links:", error)
          toast.error("Erro ao carregar links de pagamento")
        }
      }
    }

    if (isOpen && memberId) {
      fetchPartnerLinks()
    }
  }, [isOpen, memberId, userData.userType])

  // Comparar opções de checkout atuais com as originais quando houver alterações
  useEffect(() => {
    // Converter para JSON para fazer uma comparação profunda simples
    const currentOptionsJson = JSON.stringify(userData.checkoutOptions);
    const originalOptionsJson = JSON.stringify(originalCheckoutOptions);
    
    setHasUnsavedChanges(currentOptionsJson !== originalOptionsJson);
  }, [userData.checkoutOptions, originalCheckoutOptions]);

  const handleCheckoutOptionChange = (field: string, value: any) => {
    setUserData({
      ...userData,
      checkoutOptions: {
        ...userData.checkoutOptions,
        [field]: value
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar usuário")
      }

      // Atualizar as opções originais para refletir as novas configurações salvas
      setOriginalCheckoutOptions(JSON.parse(JSON.stringify(userData.checkoutOptions)))
      setHasUnsavedChanges(false)
      toast.success("Usuário atualizado com sucesso")
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast.error("Erro ao atualizar usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!newLinkName) {
      toast.error("Digite um nome para o link")
      return
    }

    if (activeCheckoutTab === "stripe" && !selectedPriceId) {
      toast.error("Selecione um plano")
      return
    }

    if (activeCheckoutTab === "lastlink" && userData.checkoutOptions.lastlinkPlans.length === 0) {
      toast.error("Cadastre pelo menos um plano Lastlink antes de criar links")
      return
    }

    try {
      setLoading(true)
      let priceId = selectedPriceId
      
      // Se for lastlink, usar ID do plano selecionado ou o primeiro plano
      if (activeCheckoutTab === "lastlink" && userData.checkoutOptions.lastlinkPlans.length > 0) {
        // Aqui podemos passar uma referência ao plano Lastlink
        priceId = "lastlink_" + userData.checkoutOptions.lastlinkPlans[0].name.replace(/\s/g, '_').toLowerCase()
      }
      
      const link = await createPartnerLink(memberId, newLinkName, priceId)
      setSalesLinks([...salesLinks, link])
      setNewLinkName("")
      setSelectedPriceId("")
      toast.success("Link criado com sucesso")
    } catch (error) {
      console.error("Erro ao criar link:", error)
      toast.error("Erro ao criar link")
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = (priceId: string, planDetails: any) => {
    setSelectedPriceId(priceId)
    setSelectedPlan({
      id: planDetails.id,
      name: planDetails.product.name,
      price: planDetails.unit_amount,
      currency: planDetails.currency,
      interval: planDetails.recurring.interval
    })
  }

  const handleAddLastlinkPlan = () => {
    if (!newLastlinkPlan.name || !newLastlinkPlan.link) {
      toast.error("Nome do plano e link são obrigatórios")
      return
    }

    const updatedPlans = [
      ...userData.checkoutOptions.lastlinkPlans,
      newLastlinkPlan
    ]

    setUserData({
      ...userData,
      checkoutOptions: {
        ...userData.checkoutOptions,
        lastlinkPlans: updatedPlans
      }
    })

    // Limpar o formulário
    setNewLastlinkPlan({
      name: "",
      link: "",
      interval: "month",
      description: ""
    })

    toast.success("Plano adicionado com sucesso")
  }

  const handleRemoveLastlinkPlan = (index: number) => {
    const updatedPlans = [...userData.checkoutOptions.lastlinkPlans]
    updatedPlans.splice(index, 1)

    setUserData({
      ...userData,
      checkoutOptions: {
        ...userData.checkoutOptions,
        lastlinkPlans: updatedPlans
      }
    })

    toast.success("Plano removido com sucesso")
  }

  // Filtrar links por tipo (Stripe ou Lastlink)
  const stripeSalesLinks = salesLinks.filter(link => !link.priceId.startsWith('lastlink_'))
  const lastlinkSalesLinks = salesLinks.filter(link => link.priceId.startsWith('lastlink_'))

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[640px] bg-white text-zinc-500 border-l border-zinc-200 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-zinc-500">Gerenciar Usuário</SheetTitle>
        </SheetHeader>

        {hasUnsavedChanges && <AlertBanner visible={hasUnsavedChanges} />}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <Accordion type="single" collapsible className="space-y-4">
            {/* Informações do Parceiro */}
            <AccordionItem value="info" className="border-zinc-200">
              <AccordionTrigger className="text-zinc-500 hover:text-zinc-500">
                Informações do Parceiro
              </AccordionTrigger>
              <AccordionContent>
                <Card className="bg-zinc-100 border-zinc-200">
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="displayName">Nome</Label>
                      <Input
                        id="displayName"
                        value={userData.displayName}
                        onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                        className="bg-zinc-100 border-zinc-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={userData.email}
                        disabled
                        className="bg-zinc-100 border-zinc-200 opacity-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <PhoneNumberInput
                        value={userData.phone}
                        onChange={(value) => setUserData({ ...userData, phone: value || "" })}
                        defaultCountry="BR"
                        className="bg-zinc-100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="userType">Tipo de Usuário</Label>
                      <Select
                        value={userData.userType}
                        onValueChange={(value) => setUserData({ ...userData, userType: value })}
                      >
                        <SelectTrigger className="bg-zinc-100 border-zinc-200">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-100 border-zinc-200">
                          <SelectItem value="business">Estabelecimento</SelectItem>
                          <SelectItem value="member">Assinante</SelectItem>
                          <SelectItem value="partner">Parceiro</SelectItem>
                          <SelectItem value="master">Master</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Opções de Checkout - apenas para parceiros */}
            {userData.userType === "partner" && (
              <AccordionItem value="checkout-options" className="border-zinc-200">
                <AccordionTrigger className="text-zinc-500 hover:text-zinc-500">
                  Opções de Checkout
                  {hasUnsavedChanges && <span className="ml-2 text-amber-500 text-xs">(Alterações não salvas)</span>}
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-zinc-100 border-zinc-200">
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1">
                          <Label htmlFor="stripe-enabled" className="font-medium">Checkout Stripe</Label>
                          <p className="text-sm text-zinc-400">Habilitar checkout usando Stripe</p>
                        </div>
                        <Switch
                          id="stripe-enabled"
                          checked={userData.checkoutOptions.stripeEnabled}
                          onCheckedChange={(checked) => handleCheckoutOptionChange('stripeEnabled', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1">
                          <Label htmlFor="lastlink-enabled" className="font-medium">Checkout Lastlink</Label>
                          <p className="text-sm text-zinc-400">Habilitar checkout usando Lastlink</p>
                        </div>
                        <Switch
                          id="lastlink-enabled"
                          checked={userData.checkoutOptions.lastlinkEnabled}
                          onCheckedChange={(checked) => handleCheckoutOptionChange('lastlinkEnabled', checked)}
                        />
                      </div>

                      {userData.checkoutOptions.lastlinkEnabled && (
                        <div className="pt-6 space-y-4">
                          <h3 className="font-medium">Configuração do Lastlink</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="plan-name">Nome do Plano</Label>
                              <Input
                                id="plan-name"
                                value={newLastlinkPlan.name}
                                onChange={(e) => setNewLastlinkPlan({
                                  ...newLastlinkPlan,
                                  name: e.target.value
                                })}
                                className="bg-white border-zinc-200"
                                placeholder="Ex: Plano Mensal Premium"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="plan-link">Link do Checkout</Label>
                              <Input
                                id="plan-link"
                                value={newLastlinkPlan.link}
                                onChange={(e) => setNewLastlinkPlan({
                                  ...newLastlinkPlan,
                                  link: e.target.value
                                })}
                                className="bg-white border-zinc-200"
                                placeholder="Ex: https://pay.lastlink.com/checkout/123456"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="plan-interval">Período</Label>
                              <Select
                                value={newLastlinkPlan.interval}
                                onValueChange={(value) => setNewLastlinkPlan({
                                  ...newLastlinkPlan,
                                  interval: value
                                })}
                              >
                                <SelectTrigger className="bg-white border-zinc-200">
                                  <SelectValue placeholder="Selecione o período" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-zinc-200">
                                  <SelectItem value="month">1 mês</SelectItem>
                                  <SelectItem value="quarter">3 meses</SelectItem>
                                  <SelectItem value="semester">6 meses</SelectItem>
                                  <SelectItem value="year">1 ano</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="plan-description">Descrição</Label>
                              <Textarea
                                id="plan-description"
                                value={newLastlinkPlan.description}
                                onChange={(e) => setNewLastlinkPlan({
                                  ...newLastlinkPlan,
                                  description: e.target.value
                                })}
                                className="bg-white border-zinc-200"
                                placeholder="Descreva os benefícios do plano"
                              />
                            </div>
                            
                            <Button
                              type="button"
                              onClick={handleAddLastlinkPlan}
                              className="w-full bg-primary hover:bg-red-700"
                            >
                              Adicionar Plano
                            </Button>
                          </div>

                          {/* Lista de planos Lastlink */}
                          {userData.checkoutOptions.lastlinkPlans.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Planos Cadastrados</h4>
                              <div className="space-y-2">
                                {userData.checkoutOptions.lastlinkPlans.map((plan, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-md border border-zinc-200"
                                  >
                                    <div>
                                      <p className="font-medium">{plan.name}</p>
                                      <p className="text-sm text-zinc-400">
                                        {plan.interval === "month" 
                                          ? "Mensal" 
                                          : plan.interval === "quarter" 
                                          ? "Trimestral" 
                                          : plan.interval === "semester"
                                          ? "Semestral"
                                          : "Anual"}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRemoveLastlinkPlan(index)}
                                      className="h-8 bg-red-500 hover:bg-red-700"
                                    >
                                      Remover
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Links de Pagamento - apenas para parceiros */}
            {userData.userType === "partner" && (
              <AccordionItem value="links" className="border-zinc-200">
                <AccordionTrigger className="text-zinc-500 hover:text-zinc-500">
                  Links de Pagamento
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-zinc-100 border-zinc-200">
                    <CardContent className="space-y-4 pt-4">
                      <Tabs defaultValue="stripe" onValueChange={setActiveCheckoutTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger className="bg-white border-zinc-200" value="stripe">Stripe</TabsTrigger>
                          <TabsTrigger className="bg-white border-zinc-200" value="lastlink">Lastlink</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="stripe">
                          <div className="flex gap-4 flex-1 pt-4">
                            <div className="flex gap-2 flex-1">
                              <Input
                                placeholder="Nome do link"
                                value={newLinkName}
                                onChange={(e) => setNewLinkName(e.target.value)}
                                className="bg-white border-zinc-200 flex-1"
                              />
                              <Button
                                type="button"
                                onClick={() => setShowPlanDialog(true)}
                                disabled={loading || !userData.checkoutOptions.stripeEnabled}
                                className="bg-white hover:bg-primary text-zinc-500 border border-zinc-200 hover:text-white"
                              >
                                Selecionar Plano
                              </Button>
                            </div>

                            {selectedPlan && (
                              <div className="p-3 bg-zinc-100 rounded-md mt-3">
                                <p className="font-medium">{selectedPlan.name}</p>
                                <p className="text-sm text-zinc-400">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: selectedPlan.currency,
                                  }).format(selectedPlan.price / 100)}
                                  /{selectedPlan.interval}
                                </p>
                              </div>
                            )}

                            <div className="">
                            <Button
                              type="button"
                              onClick={handleCreateLink}
                              disabled={loading || !selectedPriceId || !newLinkName || !userData.checkoutOptions.stripeEnabled}
                              className="w-full bg-primary hover:bg-red-700"
                            >
                              {loading ? "Criando..." : "Criar Link"}
                            </Button>
                            </div>
                          </div>

                          <div className="space-y-2 mt-4">
                            <h4 className="font-medium">Links Stripe</h4>
                            {stripeSalesLinks.length === 0 && (
                              <p className="text-sm text-zinc-400">Nenhum link Stripe criado</p>
                            )}
                            {stripeSalesLinks.map((link) => (
                              <div
                                key={link.id}
                                className="flex items-center justify-between p-3 bg-zinc-100 rounded-md"
                              >
                                <div>
                                  <p className="font-medium">{link.name}</p>
                                  <p className="text-sm text-zinc-400">
                                    Cliques: {link.clicks} | Conversões: {link.conversions}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/checkout/${link.code}`
                                    )
                                    toast.success("Link copiado!")
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="lastlink">
                          <div className="flex gap-4 flex-1 pt-4">
                            <div className="flex gap-2 flex-1">
                              <Input
                                placeholder="Nome do link"
                                value={newLinkName}
                                onChange={(e) => setNewLinkName(e.target.value)}
                                className="bg-white border-zinc-200"
                              />
                              <Select
                                disabled={userData.checkoutOptions.lastlinkPlans.length === 0 || !userData.checkoutOptions.lastlinkEnabled}
                                onValueChange={(value) => setSelectedPriceId(value)}
                              >
                                <SelectTrigger className="bg-white border-zinc-200">
                                  <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-zinc-200">
                                  {userData.checkoutOptions.lastlinkPlans.map((plan, index) => (
                                    <SelectItem 
                                      key={index} 
                                      value={`lastlink_${plan.name.replace(/\s/g, '_').toLowerCase()}`}
                                    >
                                      {plan.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="">
                            <Button
                              type="button"
                              onClick={handleCreateLink}
                              disabled={
                                loading || 
                                !newLinkName || 
                                !userData.checkoutOptions.lastlinkEnabled || 
                                userData.checkoutOptions.lastlinkPlans.length === 0
                              }
                              className="w-full bg-primary hover:bg-red-700"
                            >
                              {loading ? "Criando..." : "Criar Link"}
                            </Button>
                            </div>
                          </div>

                            <div className="space-y-2 mt-4">
                              <h4 className="font-medium">Links Lastlink</h4>
                              {lastlinkSalesLinks.length === 0 && (
                                <p className="text-sm text-zinc-400">Nenhum link Lastlink criado</p>
                              )}
                              {lastlinkSalesLinks.map((link) => (
                                <div
                                  key={link.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-md border border-zinc-200"
                                >
                                  <div>
                                    <p className="font-medium">{link.name}</p>
                                    <p className="text-sm text-zinc-400">
                                      Cliques: {link.clicks} | Conversões: {link.conversions}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/checkout/${link.code}`
                                      )
                                      toast.success("Link copiado!")
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Integrações - apenas para parceiros */}
            {userData.userType === "partner" && (
              <AccordionItem value="integrations" className="border-zinc-200">
                <AccordionTrigger className="text-zinc-500 hover:text-zinc-500">
                  Integrações
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-zinc-100 border-zinc-200">
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="pixelId">Facebook Pixel ID</Label>
                        <Input
                          id="pixelId"
                          value={userData.pixelId}
                          onChange={(e) => setUserData({ ...userData, pixelId: e.target.value })}
                          placeholder="Ex: 123456789012345"
                          className="bg-zinc-100 border-zinc-200"
                        />
                        <p className="text-sm text-zinc-400 mt-1">
                          Eventos: PageView, InitiateCheckout, Purchase
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="analyticsId">Google Analytics ID</Label>
                        <Input
                          id="analyticsId"
                          value={userData.analyticsId}
                          onChange={(e) => setUserData({ ...userData, analyticsId: e.target.value })}
                          placeholder="Ex: G-XXXXXXXXXX"
                          className="bg-zinc-100 border-zinc-200"
                        />
                        <p className="text-sm text-zinc-400 mt-1">
                          Eventos: page_view, begin_checkout, purchase
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`${hasUnsavedChanges ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-red-700'}`}
            >
              {loading ? "Salvando..." : hasUnsavedChanges ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
          
        </form>
      </SheetContent>
      <PlanSelectionDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        onSelectPlan={handlePlanSelect}
      />
    </Sheet>
  )
} 