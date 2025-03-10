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
          className="w-full justify-between bg-zinc-100 border-zinc-200 hover:bg-zinc-100/80"
        >
          {value
            ? partners.find((partner) => partner.id === value)?.displayName
            : "Selecione um parceiro..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-100 border-zinc-200">
        <Command>
          <CommandInput placeholder="Buscar parceiro..." className="h-9 bg-zinc-100" />
          <CommandEmpty>Nenhum parceiro encontrado.</CommandEmpty>
          <CommandGroup>
            {partners.map((partner) => (
              <CommandItem
                key={partner.id}
                value={partner.displayName}
                onSelect={() => {
                  setValue(partner.id)
                  onSelect(partner)
                  setOpen(false)
                }}
                className="hover:bg-zinc-100"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === partner.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <p className="font-medium">{partner.displayName}</p>
                  <p className="text-sm text-zinc-400">{partner.email}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
