"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useSubscription } from "@/contexts/subscription-context"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Partner {
  id: string
  displayName: string
  email: string
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

export function SubscriptionModal({ isOpen, onClose, memberId, memberName }: SubscriptionModalProps) {
  const { addSubscription } = useSubscription()
  const [partners, setPartners] = useState<Partner[]>([])
  const [open, setOpen] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState("")
  const [selectedPartnerName, setSelectedPartnerName] = useState("")

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const response = await fetch("/api/partners/list")
        if (!response.ok) {
          throw new Error("Erro ao carregar parceiros")
        }
        const data = await response.json()
        setPartners(data)
      } catch (error) {
        console.error("Erro ao carregar parceiros:", error)
      }
    }
    loadPartners()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addSubscription(memberId, selectedPartnerId)
      onClose()
    } catch (error) {
      // Erro já é tratado no contexto
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#131320] text-[#e5e2e9] border-[#1a1b2d]">
        <DialogHeader>
          <DialogTitle>Vincular Membro a Parceiro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member" className="text-right">
                Membro
              </Label>
              <Input
                id="member"
                value={memberName}
                disabled
                className="col-span-3 bg-[#1a1b2d] border-[#131320]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Parceiro
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="col-span-3 justify-between bg-[#1a1b2d] border-[#131320] hover:bg-[#1a1b2d]/80"
                  >
                    {selectedPartnerId
                      ? partners.find((partner) => partner.id === selectedPartnerId)?.displayName
                      : "Selecione um parceiro..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#1a1b2d] border-[#131320]">
                  <Command>
                    <CommandInput placeholder="Buscar parceiro..." className="h-9 bg-[#1a1b2d]" />
                    <CommandEmpty>Nenhum parceiro encontrado.</CommandEmpty>
                    <CommandGroup>
                      {partners.map((partner) => (
                        <CommandItem
                          key={partner.id}
                          value={partner.displayName}
                          onSelect={() => {
                            setSelectedPartnerId(partner.id)
                            setSelectedPartnerName(partner.displayName)
                            setOpen(false)
                          }}
                          className="hover:bg-[#131320]"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPartnerId === partner.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {partner.displayName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-[#7435db] hover:bg-[#a85fdd] text-white"
              disabled={!selectedPartnerId}
            >
              Vincular
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
