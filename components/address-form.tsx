"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { Address } from "@/types/establishment"

interface AddressFormProps {
  onChange: (address: Address) => void
  defaultValues?: Partial<Address>
}

export function AddressForm({ onChange, defaultValues }: AddressFormProps) {
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState<Address>({
    cep: defaultValues?.cep || "",
    street: defaultValues?.street || "",
    number: defaultValues?.number || "",
    complement: defaultValues?.complement || "",
    neighborhood: defaultValues?.neighborhood || "",
    city: defaultValues?.city || "",
    state: defaultValues?.state || ""
  })

  const handleCepChange = async (cep: string) => {
    // Formatar CEP para apenas números
    cep = cep.replace(/\D/g, "")
    
    if (cep.length === 8) {
      setLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()

        if (data.erro) {
          toast.error("CEP não encontrado")
          return
        }

        const newAddress = {
          ...address,
          cep: cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }

        setAddress(newAddress)
        onChange(newAddress)
      } catch (error) {
        toast.error("Erro ao buscar CEP")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChange = (field: keyof Address, value: string) => {
    const newAddress = { ...address, [field]: value }
    setAddress(newAddress)
    onChange(newAddress)
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="cep" className="text-right">
          CEP
        </Label>
        <Input
          id="cep"
          value={address.cep}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2")
            handleChange("cep", value)
            handleCepChange(value)
          }}
          placeholder="00000-000"
          maxLength={9}
          className="col-span-3 bg-zinc-100 border-zinc-200"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="street" className="text-right">
          Rua
        </Label>
        <Input
          id="street"
          value={address.street}
          onChange={(e) => handleChange("street", e.target.value)}
          className="col-span-3 bg-zinc-100 border-zinc-200"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="number" className="text-right">
          Número
        </Label>
        <Input
          id="number"
          value={address.number}
          onChange={(e) => handleChange("number", e.target.value)}
          className="col-span-1 bg-zinc-100 border-zinc-200"
        />
        <Label htmlFor="complement" className="text-right">
          Complemento
        </Label>
        <Input
          id="complement"
          value={address.complement}
          onChange={(e) => handleChange("complement", e.target.value)}
          className="col-span-1 bg-zinc-100 border-zinc-200"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="neighborhood" className="text-right">
          Bairro
        </Label>
        <Input
          id="neighborhood"
          value={address.neighborhood}
          onChange={(e) => handleChange("neighborhood", e.target.value)}
          className="col-span-3 bg-zinc-100 border-zinc-200"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="city" className="text-right">
          Cidade
        </Label>
        <Input
          id="city"
          value={address.city}
          onChange={(e) => handleChange("city", e.target.value)}
          className="col-span-2 bg-zinc-100 border-zinc-200"
          disabled={loading}
        />
        <Input
          id="state"
          value={address.state}
          onChange={(e) => handleChange("state", e.target.value)}
          className="col-span-1 bg-zinc-100 border-zinc-200"
          disabled={loading}
          maxLength={2}
        />
      </div>
    </div>
  )
}
