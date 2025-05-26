"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { FaWhatsapp } from "react-icons/fa";

interface WhatsAppSupportButtonProps {
  phoneNumber?: string
  message?: string
}

export function WhatsAppSupportButton({ 
  phoneNumber = "5519996148651", // Substitua pelo número real de suporte
  message = "Olá, preciso de ajuda com o Clube Não Tem Chef."
}: WhatsAppSupportButtonProps) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  
  // Mostrar o botão apenas após um pequeno delay para evitar flash durante carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Construir a mensagem completa incluindo os dados do usuário
  const buildWhatsAppMessage = () => {
    let customMessage = message
    
    return encodeURIComponent(customMessage)
  }
  
  // Construir a URL do WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${buildWhatsAppMessage()}`
  
  if (!isVisible) return null
  
  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-24 right-3 z-10 flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300 animate-fade-in"
      aria-label="Suporte via WhatsApp"
    >
      {/* Ícone do WhatsApp */}
      <FaWhatsapp className="h-6 w-6 text-white" />
      
      {/* CSS para animação de fade-in */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </a>
  )
} 