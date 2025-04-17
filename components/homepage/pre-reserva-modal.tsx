"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PreReservaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PreReservaModal({ isOpen, onClose }: PreReservaModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulando envio do formulário
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)

      // Reset após 3 segundos
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
        setFormData({
          nome: "",
          email: "",
          telefone: "",
          cidade: "",
        })
      }, 3000)
    }, 1500)
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
            className="bg-[#2A2A2A] rounded-lg w-full max-w-md relative overflow-hidden"
          >
            {/* Cabeçalho do modal */}
            <div className="bg-[#FF5733] p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Pré-reserva para o Clube</h3>
              <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium mb-1">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="w-full p-2 rounded bg-[#3A3A3A] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full p-2 rounded bg-[#3A3A3A] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium mb-1">
                      Telefone (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      required
                      className="w-full p-2 rounded bg-[#3A3A3A] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label htmlFor="cidade" className="block text-sm font-medium mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      required
                      className="w-full p-2 rounded bg-[#3A3A3A] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 rounded transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar pré-reserva"}
                  </button>
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
                  <p className="text-gray-300">Em breve entraremos em contato com mais informações sobre o clube.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
