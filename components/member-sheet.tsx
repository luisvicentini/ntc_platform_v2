"use client"

import { useState, useEffect, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Edit, Save, User, Phone } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { countries } from "@/lib/countries"
import InputMask from "react-input-mask-next"
import { phoneMasks, getPhoneMask } from "@/lib/phone-masks"

interface Subscription {
  createdAt: string
  expiresAt: string
  status: string
}

interface Member {
  id: string
  displayName: string
  email: string
  phone: string
  photoURL?: string
  subscription: Subscription
  subscriptions?: Subscription[]
  firebaseUid: string
}

interface MemberSheetProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  onEdit: (member: Member) => void
}

export function MemberSheet({ member, isOpen, onClose, onEdit }: MemberSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMember, setEditedMember] = useState<Member | null>(null)
  const [selectedCountry, setSelectedCountry] = useState("BR")

  useEffect(() => {
    if (member) {
      setEditedMember(member)
      if (member.phone) {
        const countryCode = member.phone.split(" ")[0]
        const country = countries.find(c => c.dial_code === countryCode)
        if (country) {
          setSelectedCountry(country.code)
        }
      }
    }
  }, [member])

  if (!member) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedMember({ ...member })
  }

  const handleSave = async () => {
    if (editedMember) {
      try {
        const subscriptionsResponse = await fetch(`/api/partner/subscriptions/${editedMember.firebaseUid}`, {
          headers: {
            "x-session-token": localStorage.getItem("session_token") || ""
          }
        })

        if (!subscriptionsResponse.ok) {
          throw new Error("Falha ao buscar assinatura")
        }

        const { subscription } = await subscriptionsResponse.json()

        const response = await fetch(`/api/partner/members/${editedMember.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": localStorage.getItem("session_token") || ""
          },
          body: JSON.stringify({
            displayName: editedMember.displayName,
            phone: editedMember.phone,
            subscription: {
              id: subscription.id,
              status: editedMember.subscription.status
            }
          })
        })

        if (!response.ok) {
          throw new Error("Falha ao atualizar Assinante")
        }

        onEdit(editedMember)
        setIsEditing(false)
        toast.success("Assinante atualizado com sucesso")
      } catch (error) {
        console.error("Erro ao atualizar Assinante:", error)
        toast.error("Erro ao atualizar Assinante")
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedMember(null)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedMember) {
      setEditedMember(prev => 
        prev ? { ...prev, phone: e.target.value } : null
      )
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] bg-zinc-100 border-l border-zinc-200 text-zinc-500">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="text-zinc-500">Detalhes do Assinante</SheetTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditClick}
              className="hover:bg-zinc-100"
            >
              <Edit className="h-4 w-4 text-zinc-400" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="hover:bg-zinc-100"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="bg-primary hover:bg-[#8445e9]"
              >
                Salvar
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center space-x-4">
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt={member.displayName}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center">
                <span className="text-xl text-zinc-400">
                  {getInitials(member.displayName)}
                </span>
              </div>
            )}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedMember?.displayName}
                    onChange={(e) => setEditedMember(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                    className="bg-zinc-100 border-[#2a2b3d] text-zinc-500"
                    placeholder="Nome do Assinante"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{member.displayName}</h3>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Email</Label>
            <Input
              value={editedMember?.email || ""}
              disabled
              className="bg-zinc-100 border-[#2a2b3d] text-zinc-500 opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Telefone</Label>
            <div className="flex gap-2">
              <Select
                value={selectedCountry}
                onValueChange={(value) => {
                  setSelectedCountry(value)
                  if (editedMember) {
                    const country = countries.find(c => c.code === value)
                    setEditedMember(prev => 
                      prev ? { 
                        ...prev, 
                        phone: country?.dial_code + " " 
                      } : null
                    )
                  }
                }}
                disabled={!isEditing}
              >
                <SelectTrigger className="w-[120px] bg-zinc-100 border-[#2a2b3d] text-zinc-500">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://flagcdn.com/24x18/${selectedCountry.toLowerCase()}.png`}
                        alt={countries.find(c => c.code === selectedCountry)?.name}
                        className="w-6 h-4 object-cover rounded"
                      />
                      {countries.find(c => c.code === selectedCountry)?.dial_code}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-100 border-[#2a2b3d]">
                  {countries.map((country) => (
                    <SelectItem
                      key={country.code}
                      value={country.code}
                      className="text-zinc-500"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/24x18/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-6 h-4 object-cover rounded"
                        />
                        <span>{country.dial_code}</span>
                        <span className="text-zinc-400 text-xs">{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputMask
                mask={getPhoneMask(selectedCountry).mask}
                value={editedMember?.phone?.split(" ").slice(1).join(" ") || ""}
                onChange={handlePhoneChange}
                disabled={!isEditing}
                placeholder={getPhoneMask(selectedCountry).placeholder}
                className="flex-1 bg-zinc-100 border-[#2a2b3d] text-zinc-500 h-10 px-3 rounded-md"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-400">Status da Assinatura</h4>
            {isEditing ? (
              <Select
                value={editedMember?.subscription.status}
                onValueChange={(value) => setEditedMember(prev => 
                  prev ? { 
                    ...prev, 
                    subscription: { ...prev.subscription, status: value } 
                  } : null
                )}
              >
                <SelectTrigger className="bg-zinc-100 border-[#2a2b3d] text-zinc-500">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-100 border-[#2a2b3d]">
                  <SelectItem value="active" className="text-zinc-500">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-zinc-500">Inativo</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant={member.subscription?.status === "active" ? "success" : "destructive"}
                className="bg-opacity-15"
              >
                {member.subscription?.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-400">Histórico de Assinaturas</h4>
            <div className="rounded-md border border-zinc-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200">
                    <TableHead className="text-zinc-400">Data Início</TableHead>
                    <TableHead className="text-zinc-400">Data Fim</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.subscriptions?.map((sub, index) => (
                    <TableRow key={index} className="border-zinc-200">
                      <TableCell className="text-zinc-500">
                        {format(new Date(sub.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {format(new Date(sub.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.status === "active" ? "success" : "destructive"}
                          className="bg-opacity-15"
                        >
                          {sub.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 