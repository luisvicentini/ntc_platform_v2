"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "Como funciona o Clube Não Tem Chef?",
    answer: "O Clube Não Tem Chef é um serviço de assinatura que oferece descontos exclusivos em restaurantes selecionados, além de diversos benefícios como acesso a eventos, sorteios, e descontos em parceiros. Você paga uma mensalidade/anuidade e tem acesso a descontos que podem chegar a 50% nos melhores restaurantes."
  },
  {
    question: "Como utilizo os descontos nos restaurantes?",
    answer: "É simples! Após se tornar membro, você terá acesso ao aplicativo(acho melhor plataforma) do Clube Não Tem Chef. Lá você poderá ver todos os restaurantes parceiros, as ofertas disponíveis e fazer sua reserva. Ao chegar no restaurante, basta informar que você é membro do clube e aproveitar o desconto."
  },
  {
    question: "Preciso reservar com antecedência?",
    answer: "Recomendamos que você faça sua reserva com antecedência, principalmente para restaurantes mais populares. Porém, muitos restaurantes aceitam também visitas sem reserva, desde que você mostre que é membro do clube através do nosso aplicativo."
  },
  {
    question: "O desconto é válido para qualquer dia da semana?",
    answer: "Os descontos e condições podem variar de acordo com cada restaurante parceiro. Alguns oferecem descontos todos os dias, outros em dias específicos. Todas as informações sobre os dias e horários válidos estão disponíveis no aplicativo."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas adicionais. Oferecemos também garantia de 7 dias para reembolso caso você não esteja satisfeito com o serviço."
  },
  {
    question: "Os descontos são válidos para quantas pessoas?",
    answer: "Na maioria dos restaurantes, os descontos são válidos para o membro do clube e mais um acompanhante. Alguns restaurantes podem ter políticas diferentes, que estarão claramente informadas no aplicativo."
  },
  {
    question: "Como são selecionados os restaurantes parceiros?",
    answer: "Todos os restaurantes são pessoalmente avaliados e selecionados pelo Leo Corvo, garantindo a qualidade e autenticidade da experiência gastronômica. Priorizamos restaurantes com excelente culinária, bom atendimento e ambiente agradável."
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const toggleFaq = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(null)
    } else {
      setOpenIndex(index)
    }
  }

  return (
    <section ref={ref} className="py-16 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="bg-gradient-to-r from-[#f56444] to-[#f24857] text-transparent bg-clip-text text-lg font-bold">
            FAQ
          </span>
          <h2 className="text-3xl md:text-3xl lg:text-3xl font-bold mt-2 mb-4 text-zinc-800">
            Perguntas <span className="text-[#F24957]">Frequentes</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Clube Não Tem Chef
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left p-4 flex items-center justify-between"
              >
                <h3 className="text-sm font-semibold pr-8 text-zinc-800">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                )}
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 pb-6' : 'max-h-0'
                }`}
              >
                <p className="text-zinc-500 text-sm">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-zinc-400">
            Não encontrou a resposta para sua pergunta?{" "}
            <a href="https://wa.me/5519996148651?text=Ol%C3%A1,%20gostaria%20de%20saber%20mais%20sobre%20o%20N%C3%A3o%20Tem%20Chef." className="text-[#F24957] font-bold">
              Entre em contato
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
} 