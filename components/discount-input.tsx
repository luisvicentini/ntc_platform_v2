"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DiscountInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

type DiscountType = "percentage" | "fixed"

export function DiscountInput({ value, onChange, label = "Valor do Desconto" }: DiscountInputProps) {
  const [type, setType] = useState<DiscountType>("percentage")
  const [amount, setAmount] = useState("")

  useEffect(() => {
    // Ao inicializar, detectar o tipo de desconto baseado no valor
    if (value) {
      if (value.includes("%")) {
        setType("percentage")
        setAmount(value.replace("%", ""))
      } else {
        setType("fixed")
        setAmount(value.replace("R$ ", ""))
      }
    }
  }, [value])

  const handleTypeChange = (newType: DiscountType) => {
    setType(newType)
    updateValue(amount, newType)
  }

  const handleAmountChange = (newAmount: string) => {
    // Remover caracteres não numéricos, exceto ponto decimal
    newAmount = newAmount.replace(/[^\d.]/g, "")
    
    // Garantir que só haja um ponto decimal
    const parts = newAmount.split(".")
    if (parts.length > 2) {
      newAmount = parts[0] + "." + parts.slice(1).join("")
    }

    // Limitar casas decimais
    if (parts[1]?.length > 2) {
      newAmount = parts[0] + "." + parts[1].slice(0, 2)
    }

    setAmount(newAmount)
    updateValue(newAmount, type)
  }

  const updateValue = (newAmount: string, discountType: DiscountType) => {
    if (!newAmount) {
      onChange("")
      return
    }

    const numericValue = parseFloat(newAmount)
    if (isNaN(numericValue)) return

    if (discountType === "percentage") {
      // Limitar porcentagem a 100%
      if (numericValue > 100) {
        setAmount("100")
        onChange("100%")
        return
      }
      onChange(`${numericValue}%`)
    } else {
      onChange(`R$ ${numericValue.toFixed(2)}`)
    }
  }

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">{label}</Label>
      <div className="col-span-3 flex gap-4">
        <Select
          value={type}
          onValueChange={(value: DiscountType) => handleTypeChange(value)}
        >
          <SelectTrigger className="w-[180px] bg-[#1a1b2d] border-[#131320]">
            <SelectValue placeholder="Tipo de desconto" />
          </SelectTrigger>
          <SelectContent className="bg-[#131320] border-[#1a1b2d]">
            <SelectItem 
              value="percentage"
              className="hover:bg-[#1a1b2d] focus:bg-[#1a1b2d]"
            >
              Porcentagem
            </SelectItem>
            <SelectItem 
              value="fixed"
              className="hover:bg-[#1a1b2d] focus:bg-[#1a1b2d]"
            >
              Valor Fixo
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Input
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="pl-8 bg-[#1a1b2d] border-[#131320]"
            placeholder={type === "percentage" ? "10" : "50.00"}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7b9f]">
            {type === "percentage" ? "%" : "R$"}
          </span>
        </div>
      </div>
    </div>
  )
}
