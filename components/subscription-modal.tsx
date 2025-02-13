"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useSubscription } from "@/contexts/subscription-context"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

export function SubscriptionModal({ isOpen, onClose, memberId, memberName }: SubscriptionModalProps) {
  const { addSubscription } = useSubscription()
  const [partnerId, setPartnerId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addSubscription(memberId, partnerId)
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
              <Label htmlFor="partner" className="text-right">
                ID do Parceiro
              </Label>
              <Input
                id="partner"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="col-span-3 bg-[#1a1b2d] border-[#131320]"
                placeholder="Digite o ID do parceiro"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
              Vincular
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
