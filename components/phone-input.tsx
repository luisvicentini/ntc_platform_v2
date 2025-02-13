"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { phoneCodes, formatPhoneNumber } from "@/lib/phone-codes"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  value: string
  onChange: (value: { phone: string; ddi: string }) => void
  defaultDDI?: string
  label?: string
}

export function PhoneInput({ value, onChange, defaultDDI = "55", label = "Telefone" }: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [ddi, setDDI] = useState(defaultDDI)

  const selectedCountry = phoneCodes.find((code) => code.code === ddi)

  const handlePhoneChange = (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone, ddi)
    onChange({ phone: formattedPhone, ddi })
  }

  const handleDDIChange = (newDDI: string) => {
    setDDI(newDDI)
    // Reformatar o número com a nova máscara
    const formattedPhone = formatPhoneNumber(value.replace(/\D/g, ""), newDDI)
    onChange({ phone: formattedPhone, ddi: newDDI })
    setOpen(false)
  }

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">{label}</Label>
      <div className="col-span-3 flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[140px] justify-between bg-[#1a1b2d] border-[#131320] hover:bg-[#1a1b2d]/80"
            >
              {selectedCountry ? (
                <>
                  <span>{selectedCountry.flag}</span>
                  <span>+{selectedCountry.code}</span>
                </>
              ) : (
                "Selecionar DDI"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-[#131320] border-[#1a1b2d]">
            <Command>
              <CommandInput placeholder="Buscar país..." className="h-9 bg-[#1a1b2d]" />
              <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {phoneCodes.map((code) => (
                  <CommandItem
                    key={code.code}
                    value={code.country}
                    onSelect={() => handleDDIChange(code.code)}
                    className="hover:bg-[#1a1b2d]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        ddi === code.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{code.flag}</span>
                    <span>{code.country}</span>
                    <span className="ml-auto">+{code.code}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          value={value}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className="flex-1 bg-[#1a1b2d] border-[#131320]"
          placeholder={selectedCountry?.mask.replace(/9/g, "0")}
        />
      </div>
    </div>
  )
}
