"use client"

import { useState, useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { motion } from "framer-motion"
import { Check, ChevronsUpDown, DollarSign } from "lucide-react"
import Image from "next/image"

// Valor da assinatura mensal do clube
const SUBSCRIPTION_FEE = 49.90;

export default function SavingsCalculator() {
  // Estado para controlar os valores selecionados
  const [monthlySpending, setMonthlySpending] = useState(1200)
  const [diningFrequency, setDiningFrequency] = useState(3) // Por default, 3 vezes por semana
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Calcular economias
  const calculateSavings = () => {
    // Calcular valor médio por jantar
    const diningPerMonth = diningFrequency * 4; // Aproximadamente 4 semanas por mês
    const averageCostPerDining = monthlySpending / diningPerMonth;

    // Desconto mínimo (10%)
    const minSavingsPerDining = averageCostPerDining * 0.1;
    const minMonthlySavings = minSavingsPerDining * diningPerMonth;
    const minRealSavings = minMonthlySavings - SUBSCRIPTION_FEE;

    // Desconto médio (30%)
    const avgSavingsPerDining = averageCostPerDining * 0.3;
    const avgMonthlySavings = avgSavingsPerDining * diningPerMonth;
    const avgRealSavings = avgMonthlySavings - SUBSCRIPTION_FEE;

    // Desconto máximo (50%)
    const maxSavingsPerDining = averageCostPerDining * 0.5;
    const maxMonthlySavings = maxSavingsPerDining * diningPerMonth;
    const maxRealSavings = maxMonthlySavings - SUBSCRIPTION_FEE;

    return {
      minSavings: minRealSavings > 0 ? minRealSavings : 0,
      avgSavings: avgRealSavings > 0 ? avgRealSavings : 0,
      maxSavings: maxRealSavings > 0 ? maxRealSavings : 0,
      diningPerMonth,
      averageCostPerDining: averageCostPerDining > 0 ? averageCostPerDining : 0
    };
  }

  const savings = calculateSavings();

  // Formatar valor para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }

  // Dias da semana para seleção
  const daysOfWeek = [
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 3, label: "3x" },
    { value: 4, label: "4x" },
    { value: 5, label: "5x" },
    { value: 6, label: "6x" },
    { value: 7, label: "7x" },
  ];

  return (
    <section ref={ref} className="py-16 px-0 md:px-8 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="bg-gradient-to-r from-[#f56444] to-[#f24857] text-transparent bg-clip-text font-bold">
          CALCULADORA DE ECONOMIA
        </span>
        <h2 className="text-3xl md:text-3xl lg:text-3xl font-bold mt-2 mb-4 text-black">
          Quanto você vai <span className="text-[#F24957]">economizar</span> por mês?
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Simule quanto você pode economizar com o Clube Não Tem Chef baseado nos seus gastos atuais com jantares.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto overflow-hidden">
        <div className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            
            {/* Lado Esquerdo - Inputs */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <label className="block text-zinc-600 text-lg font-medium">
                  1. Qual seu gasto mensal com jantares?
                </label>
                <div className="relative mt-0">
                  <div className="flex items-center text-2xl font-bold text-zinc-800 mb-1">
                    {formatCurrency(monthlySpending)}
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="5000"
                    step="200"
                    value={monthlySpending}
                    onChange={(e) => setMonthlySpending(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#F24957]"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>R$200</span>
                    <span>R$1.000</span>
                    <span>R$1.800</span>
                    <span>R$2.600</span>
                    <span>R$3.400</span>
                    <span>R$4.200</span>
                    <span>R$5.000</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-zinc-600 text-lg font-medium">
                  2. Quantas vezes por semana você janta fora?
                </label>
                <div className="flex flex-wrap gap-2 justify-between mt-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => setDiningFrequency(day.value)}
                      className={`relative px-4 py-2 rounded-full font-medium transition-all ${
                        diningFrequency === day.value
                          ? "bg-[#F24957] text-white"
                          : "bg-zinc-200 text-zinc-800 hover:bg-zinc-400"
                      }`}
                    >
                      {day.label}
                      {day.value === 3 && (
                        <span className="absolute -top-2 right-0 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          Média
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700 text-sm italic">
                  "A maioria das pessoas janta fora cerca de 3 vezes por semana, gastando em média {formatCurrency(1200)} por mês."
                </p>
              </div>
            </motion.div>

            {/* Lado Direito - Resultados */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-zinc-100 rounded-xl p-6 border border-zinc-200"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-zinc-800 text-xl font-bold mb-1">Sua economia mensal</h3>
                  <p className="text-zinc-400 text-sm mb-1">
                    Baseado em {savings.diningPerMonth} jantares por mês
                  </p>
                  <p className="text-zinc-400 text-xs mb-4">
                    (Média de {formatCurrency(savings.averageCostPerDining)} por jantar)
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-lg shadow-zinc-200">
                  <div className="text-center">
                    <p className="text-zinc-400 text-xs sm:text-sm">Mínima (10%)</p>
                    <p className="text-zinc-800 font-bold text-sm sm:text-base">{formatCurrency(savings.minSavings)}</p>
                  </div>
                  <div className="h-10 w-px bg-zinc-700 hidden sm:block"></div>
                  <div className="text-center relative">
                    <div className="absolute w-24 -top-6 left-1/2 transform -translate-x-1/2 bg-[#F24957] text-white text-xs px-2 py-0.5 rounded">
                      Mais comum
                    </div>
                    <p className="text-zinc-400 text-xs sm:text-sm">Média (30%)</p>
                    <p className="text-green-500 font-bold text-lg sm:text-xl">{formatCurrency(savings.avgSavings)}</p>
                  </div>
                  <div className="h-10 w-px bg-zinc-700 hidden sm:block"></div>
                  <div className="text-center">
                    <p className="text-zinc-400 text-xs sm:text-sm">Máxima (50%)</p>
                    <p className="text-zinc-800 font-bold text-sm sm:text-base">{formatCurrency(savings.maxSavings)}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#F24957] mt-0.5 flex-shrink-0" />
                    <p className="text-zinc-500 text-sm">Economia já considerando o valor da assinatura mensal de {formatCurrency(SUBSCRIPTION_FEE)}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#F24957] mt-0.5 flex-shrink-0" />
                    <p className="text-zinc-500 text-sm">Sorteios exclusivos e brindes especiais não inclusos no cálculo</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#F24957] mt-0.5 flex-shrink-0" />
                    <p className="text-zinc-500 text-sm">Acesso a eventos exclusivos do Clube Não Tem Chef</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-300">
                  <div className="text-center">
                    <p className="text-zinc-800 font-medium mb-1">Sua economia anual estimada</p>
                    <p className="text-green-500 text-2xl font-bold">{formatCurrency(savings.avgSavings * 12)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className=" p-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-zinc-800 text-sm"
          >
            Com o Clube Não Tem Chef, você pode economizar até <span className="font-bold text-green-500">{formatCurrency(savings.maxSavings * 12)}</span> por ano!
          </motion.p>
        </div>
      </div>
    </section>
  )
} 