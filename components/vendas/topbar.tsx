"use client"

import { useState, useEffect } from "react"
import { ChevronsRight, Menu, User, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "../ui/button"
// import router from "next/router" // Removido pois não é usado diretamente para navegação de menu aqui

// Definição dos itens do menu fora do componente para melhor performance
const menuItems = [
  { label: "Início", href: "#hero-section", action: "scroll" }, // Adicionado ID para scroll
  // { label: "Ver todos os Restaurantes", href: "", action: "openRestaurantsModal" }, 
  { label: "Calculadora de economia", href: "", action: "openCalculatorModal" },
  { label: "Planos", href: "#plans", action: "scroll" }, // Adicionado ID para scroll
  { label: "Benefícios e vantagens", href: "#benefits", action: "scroll" }, // Adicionado ID para scroll
];

interface TopbarProps {
  openRestaurantsModal: () => void;
  openCalculatorModal: () => void;
}

export default function Topbar({ openRestaurantsModal, openCalculatorModal }: TopbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Efeito para detectar o scroll e alterar o estilo do topbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Efeito para bloquear/desbloquear o scroll do body quando o modal do menu está aberto/fechado
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    // Cleanup para garantir que o overflow seja resetado se o componente for desmontado
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const handleMenuClick = (item: typeof menuItems[0]) => {
    setIsMenuOpen(false); // Fecha o modal do menu primeiro
    if (item.action === "openRestaurantsModal") {
      openRestaurantsModal();
    } else if (item.action === "openCalculatorModal") {
      openCalculatorModal();
    } else if (item.action === "scroll" && item.href) {
      const section = document.querySelector(item.href);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // Se href for apenas "", não faz nada ou pode ser um link para o topo da página, ex: window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        className="fixed top-3 left-2 right-2 z-50 flex w-auto items-center justify-center"
      >
        <div
          className={`mx-auto flex w-full items-center justify-between gap-3 transition-all duration-300 
                      ${
                        isScrolled
                          ? "bg-white/90 backdrop-blur-sm shadow-md rounded-xl px-4 py-2 max-sm:px-2" // Estilo quando rolado
                          : "bg-transparent px-4 py-3 max-sm:px-2" // Estilo inicial transparente
                      }`}
        >
          {/* Coluna da Esquerda: Botão de Menu e Logo */}
          <div className="flex flex-none items-center justify-start gap-2 sm:gap-3 max-sm:gap-1">
            <motion.div // Animação para o grupo menu+logo
              className="flex items-center gap-2 sm:gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-800 hover:bg-zinc-200 rounded-lg"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Image
                src="/homepage/logo.svg"
                alt="Não Tem Chef Logo"
                width={80} // Largura intrínseca da imagem
                height={25} // Altura intrínseca da imagem
                className="object-contain h-auto w-[70px] max-sm:w-[70px]" // Largura renderizada responsiva
                priority // Considerar para LCP
              />
            </motion.div>
          </div>

          {/* Coluna da Direita: Botões de Ação */}
          <div className="flex flex-none items-center justify-end gap-2 max-sm:gap-1">
            <Button
              variant="ghost"
              className="text-zinc-800 rounded-xl hover:bg-zinc-200 px-2 py-2 sm:px-3"
              onClick={() => window.location.href = "/login"}
            >
              <User className="w-4 h-4 sm:mr-1" />
              <span className="sm:inline text-xs sm:text-sm text-zinc-800">
                Fazer login
              </span>
            </Button>
            <Button
              variant="default"
              className="bg-[#F24957] text-white rounded-xl hover:bg-[#e03846] px-3 py-2 sm:px-4"
              onClick={() => window.location.href = "#plans"}
            >
              <ChevronsRight className="w-4 h-4 sm:mr-1" />
              <span className="text-xs sm:text-sm">Assine agora</span>
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-white flex flex-col p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-title" // Para acessibilidade
          >
            {/* Cabeçalho do Modal: Logo e Botão de Fechar */}
            <div className="flex justify-between items-center mb-10 sm:mb-12">
              <h2 id="menu-title" className="sr-only">Menu Principal</h2> {/* Título para leitores de tela */}
              <Image
                src="/homepage/logo.svg"
                alt="Não Tem Chef Logo"
                width={100}
                height={30}
                className="object-contain h-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="text-zinc-800 hover:bg-zinc-200 rounded-lg"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6 sm:h-7 sm:w-7" />
              </Button>
            </div>

            {/* Navegação Principal do Modal */}
            <nav className="flex flex-col items-start space-y-4 sm:space-y-5">
              {menuItems.map((item) => (
                <button // Alterado de <a> para <button> para melhor semântica e evitar navegação padrão
                  key={item.label}
                  // href={item.href} // Removido pois o clique é gerenciado pela função
                  className="text-2xl sm:text-3xl font-bold text-zinc-700 hover:text-[#F24957] transition-colors py-2 w-full text-left"
                  onClick={() => handleMenuClick(item)} 
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Rodapé do Modal: Botões de Ação */}
            <div className="flex items-center justify-center mt-auto pt-10 gap-4">
              <Button
                variant="outline"
                className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-xl py-3 text-sm sm:text-base font-medium"
                onClick={() => {
                  window.location.href = '/login';
                  setIsMenuOpen(false);
                }}
              >
                <User className="w-4 h-4 sm:mr-1" />
                <span className="sm:inline text-xs sm:text-sm text-zinc-800">
                  Fazer login
                </span>
              </Button>
              <Button
                variant="default"
                className="w-full bg-[#F24957] text-white rounded-xl hover:bg-[#e03846] py-3 text-sm sm:text-base font-medium"
                onClick={() => {
                  window.location.href = '#plans';
                  setIsMenuOpen(false);
                }}
              >
                <ChevronsRight className="w-4 h-4 sm:mr-1" />
                <span className="text-xs sm:text-sm">Assine agora</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
