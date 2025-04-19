"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ShieldCheck, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Script from "next/script"

// Declaração de tipo para o intlTelInput
declare global {
  interface Window {
    intlTelInput: any;
  }
}

interface PreReservaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PreReservaModal({ isOpen, onClose }: PreReservaModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const itiRef = useRef<any>(null)

  // Função para obter parâmetros UTM da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      
      utmFields.forEach(field => {
        const value = urlParams.get(field)
        if (value) {
          setFormData(prev => ({ ...prev, [field]: value }))
        }
      })
    }
  }, [])

  // Inicializar o intl-tel-input quando o componente montar
  useEffect(() => {
    if (isOpen && phoneInputRef.current && typeof window !== 'undefined') {
      // Carregar o CSS do intl-tel-input
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.css'
      document.head.appendChild(link)
      
      // Carregar o script do intl-tel-input
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js'
      script.async = true
      script.onload = () => {
        if (typeof window.intlTelInput !== 'undefined' && phoneInputRef.current) {
          itiRef.current = window.intlTelInput(phoneInputRef.current, {
            initialCountry: "br",
            preferredCountries: ["br", "us", "pt"],
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
          })
        }
      }
      document.head.appendChild(script)
      
      return () => {
        // Limpar recursos quando o componente desmontar
        if (itiRef.current) {
          itiRef.current.destroy()
        }
        document.head.removeChild(link)
        document.head.removeChild(script)
      }
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Obter o número de telefone completo com DDI
      let phoneNumber = formData.phone
      if (itiRef.current) {
        phoneNumber = itiRef.current.getNumber()
      }
      
      const response = await fetch('https://crm.agenciavnove.com.br/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: phoneNumber,
          product_id: '7421a68a-f5e7-498e-9cf6-3401a75c5e9d',
          form_id: '48321c09-cf4e-4879-b4c3-17fbf40e9198',
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar formulário')
      }

      setIsSuccess(true)
      
      // Redirecionar após 1.5 segundos
      setTimeout(() => {
        window.location.href = 'https://naotemchef.com.br/pre-reserva-concluida'
      }, 1500)
      
    } catch (error) {
      console.error('Erro:', error)
      alert('Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-200 rounded-lg w-full max-w-md relative overflow-hidden"
          >
            {/* Cabeçalho do modal */}
            <div className="bg-zinc-400/30 p-5 flex justify-between items-center">
              <h3 className="text-zinc-900 text-sm font-medium">Preencha seu dados abaixo para fazer sua pré-reserva no clube e receber todas as informações</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="bume-form gap-2">
                  <div className="bume-form-field">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f24957]"
                    />
                  </div>
                  <div className="bume-form-field">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Seu melhor email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f24957]"
                    />
                  </div>
                  <div className="bume-form-field">
                    <div className="bume-phone-input">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        ref={phoneInputRef}
                        placeholder="Seu whatsapp"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-white/10 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#f24957]"
                      />
                    </div>
                  </div>
                  
                  {/* Campos UTM ocultos */}
                  <div className="bume-hidden-field">
                    <input type="hidden" name="utm_source" value={formData.utm_source} />
                    <input type="hidden" name="utm_medium" value={formData.utm_medium} />
                    <input type="hidden" name="utm_campaign" value={formData.utm_campaign} />
                    <input type="hidden" name="utm_content" value={formData.utm_content} />
                    <input type="hidden" name="utm_term" value={formData.utm_term} />
                  </div>
                  
                  <div className="bume-form-button">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-[#4CAF50] text-white font-medium text-lg py-3 px-4 rounded-xl hover:bg-[#45a049] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando...' : 'Quero fazer minha pré-reserva'}
                    </button>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-zinc-500 text-sm">
                      Seus dados estão seguros, nao enviamos spam!<ShieldCheck className="inline-block ml-2 w-5 h-5 text-emerald-500" />
                    </p>
                  </div>
                </form>
                
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#4CAF50] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Pré-reserva realizada!</h3>
                  <p className="text-zinc-300">Em breve entraremos em contato com mais informações sobre o clube.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
