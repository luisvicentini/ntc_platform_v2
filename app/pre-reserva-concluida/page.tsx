"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, ArrowRight, MessageSquare, Mail } from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"

export default function ObrigadoPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)
  const whatsappLink = "https://chat.whatsapp.com/CdyRLbTZuqvCksdvocpXMY" // Link do grupo do WhatsApp
  const { trackEvent } = useAnalytics()

  // Ref para controlar se o evento já foi disparado
  const eventFiredRef = useRef(false)

  // Efeito para disparar o evento de conversão apenas uma vez
  useEffect(() => {
    // Verificar se o evento já foi disparado
    if (!eventFiredRef.current) {
      // Marcar que o evento foi disparado
      eventFiredRef.current = true

      // Disparar eventos de conversão quando a página carregar (apenas uma vez)
    trackEvent("lead", {
      content_name: "pre-reserva-clube",
      currency: "BRL",
      value: 0.0,
      page_location: window.location.href,
      page_title: document.title,
    })

    // Disparar evento diretamente para o Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Lead", {
        content_name: "pre-reserva-clube",
        currency: "BRL",
        value: 0.0,
      })
    }
  }
  }, [trackEvent]) // Removi countdown da dependência


    // Efeito separado para o contador regressivo
    useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Disparar evento de clique no WhatsApp antes do redirecionamento automático
      trackEvent("click_whatsapp_group", {
        button_location: "thank_you_page",
        interaction_type: "auto_redirect",
      })

      // Redirecionar quando o contador chegar a zero
      router.push(whatsappLink)
    }
  }, [countdown, router, whatsappLink, trackEvent])

  // Função para lidar com o clique manual no botão do WhatsApp
  const handleWhatsAppClick = () => {
    trackEvent("click_whatsapp_group", {
      button_location: "thank_you_page",
      interaction_type: "manual_click",
    })
  }

  return (
    <main className="bg-[#1A1A1A] min-h-screen text-white overflow-hidden">
      {/* Header com logo */}
      <div className="flex justify-center pt-10 pb-0">
        <Image
          src="https://naotemchef.com.br/homepage/logo.svg"
          alt="Não Tem Chef Logo"
          width={100}
          height={100}
          className="object-contain"
        />
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#2A2A2A] rounded-lg p-8 text-center"
        >
          {/* Ícone de confirmação */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-[#4CAF50] rounded-full flex items-center justify-center -mt-14 border-4 border-[#1a1a1a]">
              <CheckCircle size={38} className="text-white" />
            </div>
          </div>

          {/* Título e mensagem */}
          <h1 className="text-3xl md:text-4xl font-primary-ntc font-bold mb-4">
          <span className="text-[#f24857] px-2 py-1">Falta apenas 1 passo</span>
          </h1>

          <p className="text-xl mb-8 max-sm:text-sm">Sua pré-reserva para o Clube Não Tem Chef foi realizada com sucesso, agora falta apenas entrar no grupo exclusivo do WhatsApp.</p>

          <div className="mb-8">
            <p className="text-lg text-gray-400 mb-6 max-sm:text-sm">
              Você será redirecionado para o grupo do WhatsApp automaticamente em:<br /> <span className="text-[#f24857] font-bold text-2xl">{countdown}{" "}
              segundos</span>
            </p>

            {/* Botão WhatsApp */}
            <a
              href={whatsappLink}
              className="inline-flex items-center bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-4 px-8 rounded-xl text-lg transition-all"
              onClick={handleWhatsAppClick}
            >
              Entrar no grupo do WhatsApp
              <ArrowRight className="ml-2" size={20} />
            </a>
          </div>
        </motion.div>

        {/* Seção de Suporte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-primary-ntc font-bold mb-8">
            Fale com o suporte abaixo se precisar de alguma ajuda
          </h2>

          {/* Card de WhatsApp */}
          <a
            href="https://wa.me/5519982240767?text=Quero%20entrar%20no%20grupo%20do%20Clube%20Não%20Tem%20Chef"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-6 bg-[#1E1E1E] rounded-lg border-2 border-[#4CAF50] p-6 transition-transform hover:scale-105"
            onClick={() => trackEvent("click_support_whatsapp", { support_type: "whatsapp" })}
          >
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
              <MessageSquare size={48} className="text-[#4CAF50]" />
              <div className="text-left">
                <h3 className="text-xl font-primary-ntc font-bold">ATENDIMENTO POR WHATSAPP</h3>
                <p className="text-gray-300">
                  Clique no número: <span className="font-bold">(19) 98224-0767</span>
                </p>
              </div>
            </div>
          </a>

          {/* Card de Email */}
          <a
            href="mailto:suporte@naotemchef.com.br"
            className="block bg-[#1E1E1E] rounded-lg border-2 border-[#FF5733] p-6 transition-transform hover:scale-105"
            onClick={() => trackEvent("click_support_email", { support_type: "email" })}
          >
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
              <Mail size={48} className="text-[#FF5733]" />
              <div className="text-left">
                <h3 className="text-xl font-primary-ntc font-bold">ATENDIMENTO POR EMAIL</h3>
                <p className="text-gray-300">
                  Mande um e-mail agora para: <span className="font-bold">suporte@naotemchef.com.br</span>
                </p>
              </div>
            </div>
          </a>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-gray-500 border-t border-gray-800">
        <p>© 2023 Não Tem Chef. Todos direitos reservados.</p>
      </footer>
    </main>
  )
}
