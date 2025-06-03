"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { Check } from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Faça sua assinatura",
    description: "Escolha o plano que melhor se adapta às suas necessidades e conclua sua assinatura."
  },
  {
    number: 2,
    title: "Ative sua conta",
    description: "Ative sua conta clicando no link de ativação que receberá por e-mail."
  },
  {
    number: 3,
    title: "Faça login e explore os restaurantes e ofertas",
    description: "Navegue pelos melhores restaurantes com descontos exclusivos."
  },
  {
    number: 4,
    title: "Gere o seu voucher",
    description: "Selecione o restaurante desejado e gere o seu voucher. Lembre-se de apresentar o voucher no estabelecimento."
  },
  {
    number: 5,
    title: "Aproveite os descontos",
    description: "Gere quantos vouchers quiser para o dia que desejar, não tem limite de uso, apenas respeite as regras do estabelecimento."
  }
]

export default function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Função para scroll suave até a seção de planos
  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans')
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section ref={ref} className="py-16 px-4 md:px-8 lg:px-16 bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="bg-gradient-to-r from-[#f56444] to-[#f24857] text-transparent bg-clip-text text-lg font-bold">
            SIMPLES E FÁCIL
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-2 mb-4">
            Como funciona o <span className="text-[#F24957]">Clube</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Veja como é fácil aproveitar todos os benefícios do Clube Não Tem Chef
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Mockup de telefone com vídeo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-[320px] mx-auto">
              {/* Frame do iPhone */}
              <div className="relative w-full aspect-[9/19.5] bg-black rounded-[40px] p-3 border-4 border-zinc-800 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-xl z-20"></div>
                
                {/* Tela do iPhone */}
                <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-zinc-100">
                  {/* Video embedded dentro da tela do celular */}
                  <div className="relative w-full h-full">
                    <video 
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src="/vendas/videos/app-demo.mp4" type="video/mp4" />
                      {/* Fallback para imagem estática caso o vídeo não carregue */}
                      <Image
                        src="/homepage/video-thumbnail.jpg"
                        alt="Demonstração do Clube Não Tem Chef"
                        fill
                        className="object-cover"
                      />
                    </video>
                  </div>
                </div>
              </div>
              
              {/* Reflexo/sombra embaixo do telefone */}
              <div className="absolute bottom-[-20px] left-[10%] right-[10%] h-[20px] bg-zinc-800 blur-md rounded-full"></div>
            </div>
          </motion.div>
          
          {/* Passos */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start"
              >
                <div className="mr-4 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#F24957] flex items-center justify-center text-white font-bold">
                    {step.number}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                  <p className="text-zinc-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              onClick={scrollToPlans}
              className="mt-8 bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-3 px-8 rounded-xl text-lg hover:scale-105 transition-all w-full md:w-auto"
            >
              Quero fazer parte do clube
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 