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
      <DialogContent className="bg-zinc-100 border-zinc-200 text-zinc-500 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription className="text-zinc-400">
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
            <p className="text-zinc-400">
              Digite DELETE_USER para confirmar a exclusão:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-zinc-100 border-zinc-200"
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
            className="bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-100/80"
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
