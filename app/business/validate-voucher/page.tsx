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
  customerEmail?: string
  checkInDate?: string
  discount?: string
  conditions?: string
  establishmentImage?: string
  code?: string
  voucherDescription?: string
  usageLimit?: string
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
      const sessionToken = localStorage.getItem("session_token")

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
          customerEmail: data.voucher.member.email || "Não informado",
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
      const sessionToken = localStorage.getItem("session_token");
      
      console.log("Realizando check-in para o voucher:", code);
      
      const response = await fetch("/api/vouchers/validate", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken || ""
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Atualizar apenas o status, mantendo isValid como true para que o ticket continue visível
        setValidationResult(prev => ({
          ...prev,
          status: "used",
          isValid: true // Manter como válido para não mostrar a mensagem de erro
        }));
        
        setCheckInDone(true);
        toast.success("Check-in realizado com sucesso!");
      } else {
        toast.error(data.error || data.message || "Erro ao realizar check-in");
        console.error("Erro no check-in:", data);
      }
    } catch (error) {
      console.error("Erro ao realizar check-in:", error);
      toast.error("Erro ao realizar check-in");
    }
  };

  const renderValidationResult = () => {
    if (!validationResult) return null

    // Se for um voucher válido com status "used" após check-in, não renderizar aqui
    // pois o ticket já será mostrado na outra parte da interface
    if (validationResult.isValid === true) {
      return null;
    }

    switch (validationResult.status) {
      case "valid":
        return (
          <Card className="mt-6 bg-zinc-100 border-zinc-200">
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
                  <h3 className="text-2xl font-bold text-zinc-500">Voucher Válido</h3>
                  <p className="text-zinc-400">Check-in realizado em: {validationResult.checkInDate}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-500">
                  <strong>Cliente:</strong> {validationResult.customerName}
                </p>
                <p className="text-zinc-400">
                  <strong>Telefone:</strong> {validationResult.customerPhone}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[#2dd4bf] font-semibold">{validationResult.discount}</p>
                <p className="text-[#b5b6c9] text-sm">{validationResult.conditions}</p>
              </div>
              {!checkInDone ? (
                <Button onClick={performCheckIn} className="w-full bg-primary hover:bg-[#a85fdd] text-white">
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
            <Button size="xl" onClick={() => {
              setVoucherCode(["", "", "", "", "", ""])
              setValidationResult(null)
              setCheckInDone(false)
            }} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xl">
              Inserir outro voucher
            </Button>
          </div>
        )
      case "used":
        return (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center space-y-4 mt-6">
            <p className="text-red-500 text-xl">Este voucher já foi utilizado!</p>
            <Button size="xl" onClick={() => {
              setVoucherCode(["", "", "", "", "", ""])
              setValidationResult(null)
              setCheckInDone(false)
            }} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xl">
              Inserir outro voucher
            </Button>
          </div>
        )
      case "invalid":
        return (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center space-y-4 mt-6">
            <p className="text-red-500 text-xl">Voucher inválido!</p>
            <Button size="xl" onClick={() => {
              setVoucherCode(["", "", "", "", "", ""])
              setValidationResult(null)
              setCheckInDone(false)
            }} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xl">
              Inserir outro voucher
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-zinc-500 mb-6 text-center">Validar Voucher</h1>

      <Card className="bg-zinc-100 border-zinc-200 p-6">
        <h2 className="text-xl text-zinc-500 mb-4 text-center">
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
              className="w-full h-24 text-center text-3xl bg-white text-zinc-500 border-zinc-400 border-2 focus:ring-[#a85fdd] focus:border-zinc-200"
              maxLength={index === 0 ? 6 : 1}
            />
          ))}
        </div>

        {!validationResult && (
          <Button
            onClick={validateVoucher}
            className="w-full bg-primary hover:bg-primary/80 text-lg text-white transition-all duration-300"
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
              customerEmail={validationResult.customerEmail}
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

            {validationResult.status === "verified" && checkInDone && (
              <div className="p-4 bg-emerald-500/10 rounded-lg text-center space-y-4 font-semibold">
                <p className="text-emerald-500 text-xl">Check-in ralizado com sucesso!</p>
              </div>
            )}

            <Button
              onClick={() => {
                setVoucherCode(["", "", "", "", "", ""])
                setValidationResult(null)
                setCheckInDone(false)
              }}
              variant="outline"
              className="w-full bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-400 hover:text-zinc-500 text-lg transition-all duration-300"
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
