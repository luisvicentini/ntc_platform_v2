"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { UserProfile } from "@/types/user"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
  onConfirm: () => Promise<void>
}

export function DeleteUserModal({ isOpen, onClose, user, onConfirm }: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (confirmText !== "DELETE_USER") {
      toast.error("Digite DELETE_USER para confirmar a exclusão")
      return
    }

    setIsLoading(true)
    try {
      await onConfirm()
      toast.success("Usuário excluído com sucesso")
      onClose()
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast.error("Erro ao excluir usuário")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription className="text-[#7a7b9f]">
            Você está prestes a excluir o usuário:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p><strong>Nome:</strong> {user.displayName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Tipo:</strong> {user.userType}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[#7a7b9f]">
              Digite DELETE_USER para confirmar a exclusão:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-[#1a1b2d] border-[#131320]"
              placeholder="DELETE_USER"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320] hover:bg-[#1a1b2d]/80"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || confirmText !== "DELETE_USER"}
          >
            {isLoading ? "Excluindo..." : "Excluir Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
