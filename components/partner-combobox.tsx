"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Partner {
  id: string
  displayName: string
  email: string
  establishmentsCount?: number
}

interface PartnerComboboxProps {
  partners: Partner[]
  onSelect: (partner: Partner) => void
}

export function PartnerCombobox({ partners, onSelect }: PartnerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? partners.find((partner) => partner.id === value)?.displayName
            : "Selecione um parceiro..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar parceiro..." />
          <CommandEmpty>Nenhum parceiro encontrado.</CommandEmpty>
          <CommandGroup>
            {partners.map((partner) => (
              <CommandItem
                key={partner.id}
                value={partner.id}
                onSelect={(currentValue) => {
                  setValue(currentValue)
                  setOpen(false)
                  onSelect(partner)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === partner.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{partner.displayName}</span>
                  <span className="text-sm text-muted-foreground">
                    {partner.establishmentsCount || 0} estabelecimentos
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
