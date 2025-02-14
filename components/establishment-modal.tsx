"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, X } from "lucide-react"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { AddressForm } from "@/components/address-form"
import { BusinessUserSelect } from "@/components/business-user-select"
import type { Address } from "@/types/establishment"
import { PhoneInput } from "@/components/phone-input"
import { BusinessHours } from "@/components/business-hours"
import { DiscountInput } from "@/components/discount-input"
import { EstablishmentTypeSelect } from "@/components/establishment-type-select"
import type { Establishment } from "@/types/establishment"

type EstablishmentFormData = Omit<
  Establishment,
  "id" | "partnerId" | "status" | "createdAt" | "updatedAt" | "rating" | "totalRatings" | "isFeatured"
> & {
  businessUserId: string
}

interface EstablishmentModalProps {
  isOpen: boolean
  onClose: () => void
  establishment: Establishment | null
}

export function EstablishmentModal({ isOpen, onClose, establishment }: EstablishmentModalProps) {
  const { addEstablishment, updateEstablishment } = useEstablishment()
  const [formData, setFormData] = useState<EstablishmentFormData>({
    name: "",
    description: "",
    phone: { phone: "", ddi: "55" },
    openingHours: "",
    voucherDescription: "",
    discountValue: "",
    discountRules: "",
    usageLimit: "",
    voucherAvailability: "unlimited",
    voucherQuantity: 0,
    voucherCooldown: 24,
    images: [],
    type: { type: "", category: "" },
    address: {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: ""
    },
    voucherExpiration: 48,
    lastVoucherGenerated: {},
    businessUserId: ""
  })

  useEffect(() => {
    if (establishment) {
      const { 
        id, partnerId, status, createdAt, updatedAt, rating, totalRatings, isFeatured,
        ...rest 
      } = establishment
      setFormData({ ...rest, businessUserId: "" })
    }
  }, [establishment])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: "unlimited" | "limited") => {
    setFormData((prev) => ({ ...prev, voucherAvailability: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && formData.images.length < 5) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...newImages].slice(0, 5) }))
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i: number) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Atualizar usuário business com o ID do estabelecimento
    if (formData.businessUserId) {
      try {
        const response = await fetch(`/api/users/${formData.businessUserId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            establishmentId: establishment?.id
          }),
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Erro ao vincular usuário ao estabelecimento")
        }
      } catch (error) {
        console.error("Erro ao vincular usuário:", error)
        return
      }
    }

    // Remover businessUserId antes de salvar o estabelecimento
    const { businessUserId, ...establishmentData } = formData

    if (establishment) {
      updateEstablishment(establishment.id, establishmentData)
    } else {
      addEstablishment(establishmentData)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#131320] text-[#e5e2e9] border-[#1a1b2d] max-w-3xl">
        <DialogHeader>
          <DialogTitle>{establishment ? "Editar Estabelecimento" : "Novo Estabelecimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="discount">Desconto</TabsTrigger>
              <TabsTrigger value="photos">Fotos</TabsTrigger>
              <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
              <TabsTrigger value="user">Usuário</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <div className="grid gap-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>

                <AddressForm
                  onChange={(address: Address) => setFormData(prev => ({ ...prev, address }))}
                  defaultValues={formData.address}
                />

                <PhoneInput
                  value={formData.phone.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  defaultDDI={formData.phone.ddi}
                />

                <BusinessHours
                  value={formData.openingHours}
                  onChange={(value) => setFormData(prev => ({ ...prev, openingHours: value }))}
                />

                <EstablishmentTypeSelect
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                />
              </div>
            </TabsContent>
            <TabsContent value="discount">
              <div className="grid gap-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voucherDescription" className="text-right">
                    Descrição do Voucher
                  </Label>
                  <Input
                    id="voucherDescription"
                    name="voucherDescription"
                    value={formData.voucherDescription}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>

                <DiscountInput
                  value={formData.discountValue}
                  onChange={(value) => setFormData(prev => ({ ...prev, discountValue: value }))}
                />

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discountRules" className="text-right">
                    Regras do Desconto
                  </Label>
                  <Textarea
                    id="discountRules"
                    name="discountRules"
                    value={formData.discountRules}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="usageLimit" className="text-right">
                    Limite de Uso
                  </Label>
                  <Input
                    id="usageLimit"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="photos">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-5 gap-4">
                  {formData.images.map((image: string, index: number) => (
                    <div key={index} className="relative">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Establishment ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <div className="flex items-center justify-center w-full h-24 bg-[#1a1b2d] border-2 border-dashed border-[#131320] rounded">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Plus className="h-6 w-6 text-[#7a7b9f]" />
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          multiple
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="availability">
              <div className="grid gap-4 py-4">
                <RadioGroup
                  value={formData.voucherAvailability}
                  onValueChange={handleRadioChange}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlimited" id="unlimited" />
                    <Label htmlFor="unlimited">Sempre disponível</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited" id="limited" />
                    <Label htmlFor="limited">Quantidade específica</Label>
                  </div>
                </RadioGroup>
                {formData.voucherAvailability === "limited" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="voucherQuantity" className="text-right">
                      Quantidade de Vouchers
                    </Label>
                    <Input
                      id="voucherQuantity"
                      name="voucherQuantity"
                      type="number"
                      value={formData.voucherQuantity}
                      onChange={handleChange}
                      className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voucherCooldown" className="text-right">
                    Período de Espera (horas)
                  </Label>
                  <Input
                    id="voucherCooldown"
                    name="voucherCooldown"
                    type="number"
                    value={formData.voucherCooldown}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voucherExpiration" className="text-right">
                    Expiração do Voucher (horas)
                  </Label>
                  <Input
                    id="voucherExpiration"
                    name="voucherExpiration"
                    type="number"
                    value={formData.voucherExpiration}
                    onChange={handleChange}
                    className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="user">
              <div className="grid gap-4 py-4">
                <BusinessUserSelect
                  value={formData.businessUserId}
                  onChange={(value) => setFormData(prev => ({ ...prev, businessUserId: value }))}
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="submit" className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
