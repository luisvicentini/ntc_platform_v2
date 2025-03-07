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
import { Copy, Link as LinkIcon } from "lucide-react"
import { createPartnerLink, getPartnerLinks } from "@/lib/firebase/partner-links"
import type { PartnerSalesLink } from "@/types/partner"
import { PlanSelectionDialog } from "@/components/plan-selection-dialog"

interface SubscriptionManagementSidebarProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
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
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    phone: "",
    userType: "",
    status: "",
    pixelId: "", // Facebook Pixel ID
    analyticsId: "", // Google Analytics ID
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${memberId}`)
        if (response.ok) {
          const data = await response.json()
          setUserData({
            displayName: data.displayName || "",
            email: data.email || "",
            phone: data.phone || "",
            userType: data.userType || "",
            status: data.status || "",
            pixelId: data.pixelId || "",
            analyticsId: data.analyticsId || "",
          })
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
          setSalesLinks(links)
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

    if (!selectedPriceId) {
      toast.error("Selecione um plano")
      return
    }

    try {
      setLoading(true)
      const link = await createPartnerLink(memberId, newLinkName, selectedPriceId)
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[640px] bg-[#131320] text-[#e5e2e9] border-l border-[#1a1b2d] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#e5e2e9]">Gerenciar Usuário</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <Accordion type="single" collapsible className="space-y-4">
            {/* Informações do Parceiro */}
            <AccordionItem value="info" className="border-[#1a1b2d]">
              <AccordionTrigger className="text-[#e5e2e9] hover:text-[#7435db]">
                Informações do Parceiro
              </AccordionTrigger>
              <AccordionContent>
                <Card className="bg-[#1a1b2d] border-[#131320]">
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="displayName">Nome</Label>
                      <Input
                        id="displayName"
                        value={userData.displayName}
                        onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                        className="bg-[#131320] border-[#1a1b2d]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={userData.email}
                        disabled
                        className="bg-[#131320] border-[#1a1b2d] opacity-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <PhoneNumberInput
                        value={userData.phone}
                        onChange={(value) => setUserData({ ...userData, phone: value || "" })}
                        defaultCountry="BR"
                        className="bg-[#131320]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="userType">Tipo de Usuário</Label>
                      <Select
                        value={userData.userType}
                        onValueChange={(value) => setUserData({ ...userData, userType: value })}
                      >
                        <SelectTrigger className="bg-[#131320] border-[#1a1b2d]">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1b2d] border-[#131320]">
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

            {/* Links de Pagamento - apenas para parceiros */}
            {userData.userType === "partner" && (
              <AccordionItem value="links" className="border-[#1a1b2d]">
                <AccordionTrigger className="text-[#e5e2e9] hover:text-[#7435db]">
                  Links de Pagamento
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-[#1a1b2d] border-[#131320]">
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do link"
                          value={newLinkName}
                          onChange={(e) => setNewLinkName(e.target.value)}
                          className="bg-[#131320] border-[#1a1b2d]"
                        />
                        <Button
                          type="button"
                          onClick={() => setShowPlanDialog(true)}
                          disabled={loading}
                          className="bg-[#7435db] hover:bg-[#a85fdd]"
                        >
                          Selecionar Plano
                        </Button>
                      </div>

                      {selectedPlan && (
                        <div className="p-3 bg-[#131320] rounded-md">
                          <p className="font-medium">{selectedPlan.name}</p>
                          <p className="text-sm text-[#7a7b9f]">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: selectedPlan.currency,
                            }).format(selectedPlan.price / 100)}
                            /{selectedPlan.interval}
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleCreateLink}
                        disabled={loading || !selectedPriceId || !newLinkName}
                        className="w-full bg-[#7435db] hover:bg-[#a85fdd]"
                      >
                        {loading ? "Criando..." : "Criar Link"}
                      </Button>

                      <div className="space-y-2">
                        {salesLinks.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-3 bg-[#131320] rounded-md"
                          >
                            <div>
                              <p className="font-medium">{link.name}</p>
                              <p className="text-sm text-[#7a7b9f]">
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
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Integrações - apenas para parceiros */}
            {userData.userType === "partner" && (
              <AccordionItem value="integrations" className="border-[#1a1b2d]">
                <AccordionTrigger className="text-[#e5e2e9] hover:text-[#7435db]">
                  Integrações
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-[#1a1b2d] border-[#131320]">
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="pixelId">Facebook Pixel ID</Label>
                        <Input
                          id="pixelId"
                          value={userData.pixelId}
                          onChange={(e) => setUserData({ ...userData, pixelId: e.target.value })}
                          placeholder="Ex: 123456789012345"
                          className="bg-[#131320] border-[#1a1b2d]"
                        />
                        <p className="text-sm text-[#7a7b9f] mt-1">
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
                          className="bg-[#131320] border-[#1a1b2d]"
                        />
                        <p className="text-sm text-[#7a7b9f] mt-1">
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
              className="border-[#1a1b2d]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#7435db] hover:bg-[#a85fdd]"
            >
              {loading ? "Salvando..." : "Salvar"}
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