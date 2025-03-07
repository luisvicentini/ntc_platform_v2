"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { VoucherTicket } from "@/components/voucher-ticket"
import { Info, Users } from "lucide-react"

interface VoucherValidationResult {
  isValid: boolean
  status: "valid" | "invalid" | "expired" | "used" | "verified"
  customerName?: string
  customerPhone?: string
  customerAvatar?: string
  checkInDate?: string
  discount?: string
  conditions?: string
  establishmentImage?: string
  code?: string
  voucherDescription?: string
  usageLimit?: string
}

// Simulated validation function - in a real app this would call your API
const validateVoucherCode = (code: string): VoucherValidationResult => {
  // Simulate different voucher statuses
  switch (code) {
    case "123456":
      return {
        isValid: true,
        status: "valid",
        customerName: "Luis Henrique Vicentini",
        customerPhone: "+55 (19) 98430-5001",
        customerAvatar: "/placeholder.svg?height=200&width=300",
        checkInDate: new Date().toLocaleDateString(),
        discount: "15% de desconto em qualquer prato",
        conditions: "Válido apenas para consumo no local. Não cumulativo com outras promoções.",
        establishmentImage: "/placeholder.svg?height=200&width=300",
      }
    case "222222":
      return {
        isValid: false,
        status: "expired",
      }
    case "111111":
      return {
        isValid: false,
        status: "used",
      }
    default:
      return {
        isValid: false,
        status: "invalid",
      }
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Pendente"
    case "verified":
      return "Verificado"
    case "used":
      return "Utilizado"
    case "expired":
      return "Expirado"
    default:
      return "Status desconhecido"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-500"
    case "verified":
      return "bg-blue-500/10 text-blue-500"
    case "used":
      return "bg-emerald-500/10 text-emerald-500"
    case "expired":
      return "bg-red-500/10 text-red-500"
    default:
      return "bg-[#7a7b9f]/10 text-gray-500"
  }
}

export default function ValidateVoucherPage() {
  const [voucherCode, setVoucherCode] = useState(["", "", "", "", "", ""])
  const [validationResult, setValidationResult] = useState<VoucherValidationResult | null>(null)
  const [checkInDone, setCheckInDone] = useState(false)

  const handleInputChange = (index: number, value: string) => {
    const newCode = [...voucherCode]

    if (index === 0 && value.length > 1) {
      // Handling paste or multi-digit input in the first field
      const cleanedValue = value.slice(0, 6).toUpperCase()
      for (let i = 0; i < 6; i++) {
        newCode[i] = cleanedValue[i] || ""
      }
    } else {
      // Handling single digit input
      newCode[index] = value.slice(0, 1).toUpperCase()

      // Move to next input if value is entered and not on last input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }
    }

    setVoucherCode(newCode)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !voucherCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6).toUpperCase()
    const newVoucherCode = [...voucherCode]
    for (let i = 0; i < 6; i++) {
      newVoucherCode[i] = pastedData[i] || ""
    }
    setVoucherCode(newVoucherCode)

    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newVoucherCode.findIndex((v) => v === "") || 5
    const nextInput = document.getElementById(`code-${nextEmptyIndex}`)
    nextInput?.focus()
  }

  const validateVoucher = async () => {
    try {
      const code = voucherCode.join("")
      const sessionToken = localStorage.getItem("sessionToken")

      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken || "",
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (data.valid) {
        setValidationResult({
          isValid: true,
          status: "verified",
          code: code,
          customerName: data.voucher.member.name,
          customerPhone: data.voucher.member.phone || "Não informado",
          customerAvatar: data.voucher.member.photoURL,
          checkInDate: new Date().toLocaleDateString(),
          discount: data.voucher.discount,
          voucherDescription: data.voucher.voucherDescription || "Sem descrição específica",
          usageLimit: data.voucher.usageLimit || "Sem limite específico",
          conditions: data.voucher.conditions || "Sem condições especiais",
          establishmentImage: data.voucher.establishmentImage || "/placeholder.svg",
        })
      } else {
        // Mapear as diferentes respostas do backend para os status do frontend
        if (data.message.includes("expirado")) {
          setValidationResult({
            isValid: false,
            status: "expired"
          })
        } else if (data.message.includes("utilizado")) {
          setValidationResult({
            isValid: false,
            status: "used"
          })
        } else if (data.message.includes("não pertence")) {
          // Adicionando tratamento específico para voucher de outro estabelecimento
          setValidationResult({
            isValid: false,
            status: "invalid"
          })
          toast.error("Este voucher pertence a outro estabelecimento")
        } else {
          setValidationResult({
            isValid: false,
            status: "invalid"
          })
        }
      }
    } catch (error) {
      console.error("Erro ao validar voucher:", error)
      toast.error("Erro ao validar voucher")
      setValidationResult({
        isValid: false,
        status: "invalid"
      })
    }
  }

  const performCheckIn = async () => {
    try {
      const code = validationResult.code;
      
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code,
          action: "checkin" 
        }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        setCheckInDone(true);
        toast.success("Check-in realizado com sucesso!");
      } else {
        toast.error(data.message || "Erro ao realizar check-in");
      }
    } catch (error) {
      console.error("Erro ao realizar check-in:", error);
      toast.error("Erro ao realizar check-in");
    }
  };

  const renderValidationResult = () => {
    if (!validationResult) return null

    switch (validationResult.status) {
      case "valid":
        return (
          <Card className="mt-6 bg-[#131320] border-[#1a1b2d]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={validationResult.establishmentImage || "/placeholder.svg?height=100&width=100"}
                    alt="Estabelecimento"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#e5e2e9]">Voucher Válido</h3>
                  <p className="text-[#7a7b9f]">Check-in realizado em: {validationResult.checkInDate}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[#e5e2e9]">
                  <strong>Cliente:</strong> {validationResult.customerName}
                </p>
                <p className="text-[#7a7b9f]">
                  <strong>Telefone:</strong> {validationResult.customerPhone}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[#2dd4bf] font-semibold">{validationResult.discount}</p>
                <p className="text-[#b5b6c9] text-sm">{validationResult.conditions}</p>
              </div>
              {!checkInDone ? (
                <Button onClick={performCheckIn} className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-white">
                  Confirmar Check-in
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#2dd4bf] text-center font-semibold">Check-in Confirmado</p>
                  <Button onClick={() => {
                    setVoucherCode(["", "", "", "", "", ""])
                    setValidationResult(null)
                    setCheckInDone(false)
                  }} className="w-full bg-[#a85fdd] hover:bg-[#a85fdd]/80 text-white">
                    Validar outro voucher
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      case "expired":
        return (
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center space-y-4 mt-6">
            <p className="text-yellow-500 text-xl">Este voucher está expirado!</p>
            <Button onClick={() => {
              setVoucherCode(["", "", "", "", "", ""])
              setValidationResult(null)
              setCheckInDone(false)
            }} className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
              Inserir outro voucher
            </Button>
          </div>
        )
      case "used":
        return (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center space-y-4 mt-6">
            <p className="text-red-500 text-xl">Este voucher já foi utilizado!</p>
            <Button onClick={() => {
              setVoucherCode(["", "", "", "", "", ""])
              setValidationResult(null)
              setCheckInDone(false)
            }} className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
              Inserir outro voucher
            </Button>
          </div>
        )
      case "invalid":
        return (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center space-y-4 mt-6">
            <p className="text-red-500 text-xl">Voucher inválido!</p>
            <Button onClick={() => {
              setVoucherCode(["", "", "", "", "", ""])
              setValidationResult(null)
              setCheckInDone(false)
            }} className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
              Inserir outro voucher
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#e5e2e9] mb-6 text-center">Validar Voucher</h1>

      <Card className="bg-[#131320] border-[#1a1b2d] p-6">
        <h2 className="text-xl text-[#e5e2e9] mb-4 text-center">
          Digite o código do cupom para validar e fazer Check-in
        </h2>

        <div className="flex justify-center space-x-2 mb-6">
          {voucherCode.map((digit, index) => (
            <Input
              key={index}
              id={`code-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-full h-24 text-center text-3xl bg-[#0f0f1a] text-[#e5e2e9] border-[#a85fdd] focus:ring-[#a85fdd] focus:border-[#a85fdd]"
              maxLength={index === 0 ? 6 : 1}
            />
          ))}
        </div>

        {!validationResult && (
          <Button
            onClick={validateVoucher}
            className="w-full bg-[#7435db] hover:bg-[#6229c5] text-lg text-white transition-all duration-300"
            disabled={voucherCode.some(v => !v)}
            size="xl"
          >
            Verificar
          </Button>
        )}

        {validationResult && validationResult.isValid && (
          <div className="space-y-6">
            <VoucherTicket
              customerName={validationResult.customerName}
              customerPhone={validationResult.customerPhone}
              customerAvatar={validationResult.customerAvatar}
              checkInDate={validationResult.checkInDate}
              discount={validationResult.discount}
              conditions={validationResult.conditions}
              status={validationResult.status}
              establishmentImage={validationResult.establishmentImage}
              voucherDescription={validationResult.voucherDescription}
              usageLimit={validationResult.usageLimit}
            />

            {validationResult.status === "verified" && !checkInDone && (
              <Button
                onClick={performCheckIn}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg text-white"
                size="xl"
              >
                Confirmar Check-in
              </Button>
            )}

            <Button
              onClick={() => {
                setVoucherCode(["", "", "", "", "", ""])
                setValidationResult(null)
                setCheckInDone(false)
              }}
              variant="outline"
              className="w-full bg-[#1a1b2d] hover:bg-[#7a7b9f] border-[#1a1b2d] text-[#7a7b9f] hover:text-[#1a1b2d] text-lg transition-all duration-300"
              size="xl"
            >
              Inserir outro voucher
            </Button>
          </div>
        )}
      </Card>
      {renderValidationResult()}
    </div>
  )
}
