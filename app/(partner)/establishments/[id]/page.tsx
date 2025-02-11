"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function EditEstablishmentPage({ params }: { params: { id: string } }) {
  const isNewEstablishment = params.id === "new"
  const [establishment, setEstablishment] = useState({
    name: "",
    address: "",
    description: "",
    phone: "",
    openingHours: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEstablishment({ ...establishment, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui você adicionaria a lógica para salvar o estabelecimento
    console.log("Estabelecimento salvo:", establishment)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        {isNewEstablishment ? "Novo Estabelecimento" : "Editar Estabelecimento"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Estabelecimento</Label>
              <Input id="name" name="name" value={establishment.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" value={establishment.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" value={establishment.address} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={establishment.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openingHours">Horário de Funcionamento</Label>
            <Input
              id="openingHours"
              name="openingHours"
              value={establishment.openingHours}
              onChange={handleChange}
              placeholder="Ex: Segunda a Sábado, 10h às 22h"
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          {isNewEstablishment ? "Criar Estabelecimento" : "Atualizar Estabelecimento"}
        </Button>
      </form>
    </div>
  )
}

