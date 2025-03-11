"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { establishmentTypes } from "@/lib/establishment-types"

interface EstablishmentTypeSelectProps {
  value?: {
    type: string;
    category: string;
  };
  onChange: (value: { type: string; category: string }) => void;
  label?: string;
}

export function EstablishmentTypeSelect({
  value = { type: "", category: "" },
  onChange,
  label = "Tipo de Estabelecimento" 
}: EstablishmentTypeSelectProps) {
  const [selectedType, setSelectedType] = useState(value?.type || "")
  const [selectedCategory, setSelectedCategory] = useState(value?.category || "")

  // Obter as categorias do tipo selecionado
  const getCategories = () => {
    const type = establishmentTypes.find(t => t.id === selectedType)
    return type?.categories || []
  }

  useEffect(() => {
    if (value) {
      setSelectedType(value.type || "")
      setSelectedCategory(value.category || "")
    }
  }, [value])

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId)
    setSelectedCategory("") // Resetar categoria ao mudar o tipo
    onChange({ type: typeId, category: "" })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    onChange({ type: selectedType, category })
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">{label}</Label>
        <div className="col-span-3">
          <Select
            value={selectedType}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="w-full border-zinc-200">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="border-zinc-200">
              {establishmentTypes.map((type) => (
                <SelectItem 
                  key={type.id} 
                  value={type.id}
                  className="hover:bg-zinc-100 focus:bg-zinc-100"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedType && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Categoria</Label>
          <div className="col-span-3">
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full border-zinc-200">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-100 border-zinc-200">
                {getCategories().map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    className="hover:bg-zinc-100 focus:bg-zinc-100"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
