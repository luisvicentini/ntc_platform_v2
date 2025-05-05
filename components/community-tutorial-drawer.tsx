"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { MessageSquareText } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils/utils"

// Steps do tutorial
const tutorialSteps = [
  {
    id: 1,
    title: "Entre na plataforma Lastlink",
    description: "Após a sua compra, você recebeu um email da Lastlink com as instruções para acessar a plataforma. Acesse sua conta com o email e a senha.",
    image: "/images/comunidade/passo1.png"
  },
  {
    id: 2,
    title: "Acesse o produto 'Clube Não Tem Chef'",
    description: "Clique no botão 'Acessar'",
    image: "/images/comunidade/passo2.png"
  },
  {
    id: 3,
    title: "Entre na comunidade do Clube Não Tem Chef no Whatsapp",
    description: "Na aba que se abre, se você ainda nao estiver na comunidade, clique em 'Entrar no grupo' e siga as instruções na tela do Whatsapp.",
    image: "/images/comunidade/passo3.png"
  }
]

// Link para a comunidade
const COMMUNITY_LINK = "https://lastlink.com/app/login"

// Disponibilizando o estado do drawer e sua função de abertura em um contexto global
const CommunityDrawerContext = React.createContext<{
  openDrawer: () => void;
  isOpen: boolean;
}>({
  openDrawer: () => {},
  isOpen: false,
});

export const useCommunityDrawer = () => React.useContext(CommunityDrawerContext);

// Provedor do contexto que encapsula o Drawer
export function CommunityDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  
  const openDrawer = React.useCallback(() => {
    setOpen(true);
  }, []);
  
  return (
    <CommunityDrawerContext.Provider value={{ openDrawer, isOpen: open }}>
      {children}
      <CommunityDrawerContent open={open} onOpenChange={setOpen} />
    </CommunityDrawerContext.Provider>
  );
}

// Componente do botão que abre o drawer
interface CommunityTutorialButtonProps {
  className?: string;
}

export function CommunityTutorialButton({ className }: CommunityTutorialButtonProps) {
  const { openDrawer } = useCommunityDrawer();
  const [isMobile, setIsMobile] = React.useState(false);

  // Detectar se é dispositivo móvel
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <Button 
      onClick={openDrawer} 
      variant="ghost" 
      className={cn(
        "relative",
        isMobile 
          ? "p-2 h-9 w-9 rounded-full flex items-center justify-center" 
          : "flex items-center gap-2 rounded-xl",
        className
      )}
    >
      <MessageSquareText className="h-5 w-5" />
      {!isMobile && <span>Comunidade</span>}
    </Button>
  );
}

// Conteúdo do Drawer
interface CommunityDrawerContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CommunityDrawerContent({ open, onOpenChange }: CommunityDrawerContentProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  // Detectar se é dispositivo móvel
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Funções auxiliares para o carrossel
  const getItemWidth = () => {
    if (!carouselRef.current) return 0;
    return isMobile ? 320 : carouselRef.current.offsetWidth * 0.32; // Tamanho fixo no mobile
  };

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    
    const itemWidth = getItemWidth();
    const containerWidth = carouselRef.current.offsetWidth;
    const maxScrollLeft = carouselRef.current.scrollWidth - containerWidth;
    
    // Se for o último item, scroll total até o fim
    let targetScrollLeft = itemWidth * index;
    
    // Garantir que o último item seja completamente visível
    if (index === tutorialSteps.length - 1) {
      targetScrollLeft = maxScrollLeft;
    }
    
    // Garantir que não ultrapasse os limites
    targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));
    
    carouselRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth"
    });
    
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const scrollLeft = carouselRef.current.scrollLeft;
    const itemWidth = getItemWidth();
    const containerWidth = carouselRef.current.offsetWidth;
    const maxScrollLeft = carouselRef.current.scrollWidth - containerWidth;
    
    // Se estiver próximo do final, considerar como último item
    if (Math.abs(scrollLeft - maxScrollLeft) < 20) {
      setCurrentIndex(tutorialSteps.length - 1);
      return;
    }
    
    const newIndex = Math.round(scrollLeft / itemWidth);
    setCurrentIndex(newIndex);
  };

  // Funções para o drag do carrossel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    if (carouselRef.current.style) {
      carouselRef.current.style.cursor = 'grabbing';
      carouselRef.current.style.userSelect = 'none';
    }
    // Impedir seleção de texto durante o arrasto
    document.body.style.userSelect = 'none';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Não atualizar a posição do scroll durante o movimento do mouse
    // Apenas registrar que estamos arrastando
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Não atualizar a posição do scroll durante o movimento do toque
    // Apenas registrar que estamos arrastando
    if (!isDragging) return;
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) {
      setIsDragging(false);
      return;
    }
    
    // Calcular a diferença entre onde o mouse/toque começou e onde terminou
    let endX = 0;
    if ('touches' in e) {
      // É um evento de toque
      if (e.changedTouches && e.changedTouches.length > 0) {
        endX = e.changedTouches[0].pageX - carouselRef.current.offsetLeft;
      }
    } else {
      // É um evento de mouse
      endX = e.pageX - carouselRef.current.offsetLeft;
    }
    
    const diff = startX - endX;
    
    // Se a diferença for significativa, mover para o próximo ou anterior slide
    if (Math.abs(diff) > 50) {
      const direction = diff > 0 ? 1 : -1; // 1 para próximo, -1 para anterior
      
      // Prevenir navegação além dos limites
      const newIndex = Math.min(
        Math.max(currentIndex + direction, 0),
        tutorialSteps.length - 1
      );
      
      // Caso especial para o último item
      if (newIndex === tutorialSteps.length - 1) {
        // Forçar scroll até o final
        const maxScrollLeft = carouselRef.current.scrollWidth - carouselRef.current.offsetWidth;
        carouselRef.current.scrollTo({
          left: maxScrollLeft,
          behavior: "smooth"
        });
        setCurrentIndex(newIndex);
      } else {
        scrollToIndex(newIndex);
      }
    } else {
      // Se o movimento foi muito pequeno, voltar para o slide atual
      scrollToIndex(currentIndex);
    }
    
    setIsDragging(false);
    if (carouselRef.current && carouselRef.current.style) {
      carouselRef.current.style.cursor = 'grab';
      carouselRef.current.style.removeProperty('user-select');
    }
    // Restaurar seleção de texto quando terminar o arrasto
    document.body.style.removeProperty('user-select');
  };

  React.useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll);
      
      // Garantir que o carrossel tenha espaço após o último item no mobile
      if (isMobile) {
        const lastItem = carousel.children[carousel.children.length - 1] as HTMLElement;
        if (lastItem) {
          const observer = new ResizeObserver(() => {
            const containerWidth = carousel.offsetWidth;
            const lastItemRight = lastItem.offsetLeft + lastItem.offsetWidth;
            
            // Se o último item não estiver completamente visível ao alcançar o fim do scroll
            if (lastItemRight > carousel.scrollWidth) {
              // Adicionar padding adequado depois do último item
              carousel.style.paddingRight = `${containerWidth - (carousel.scrollWidth - lastItemRight)}px`;
            }
          });
          
          observer.observe(carousel);
          observer.observe(lastItem);
          
          return () => {
            observer.disconnect();
            carousel.removeEventListener('scroll', handleScroll);
          };
        }
      }
      
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, tutorialSteps.length]);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] max-h-[90vh]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-md md:text-2xl font-bold">
              Tutorial da Comunidade
            </DrawerTitle>
          </DrawerHeader>

          {/* Carrossel */}
          <div className="relative px-1 md:px-6 py-2 flex-1 overflow-hidden">
            {/* Container do carrossel */}
            <div 
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-0 select-none carousel-container"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                cursor: 'grab',
                paddingRight: isMobile ? '40px' : '0' // Adiciona padding no fim para garantir scroll completo no mobile
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragEnd}
              onClick={(e) => isDragging && e.stopPropagation()}
            >
              {tutorialSteps.map((step, index) => (
                <div 
                  key={step.id}
                  className={cn(
                    "flex-shrink-0 snap-center transition-all duration-300",
                    isMobile 
                      ? "w-80 pr-5" // Mobile: 1 item + pequena porção do próximo
                      : "w-[32%] md:pr-[1%]" // Desktop: mostra vários itens com espaçamento menor
                  )}
                >
                  <div className="bg-zinc-50 rounded-lg p-2 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative h-96 md:h-96 w-full mb-4 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                      {step.image ? (
                        <Image 
                          src={step.image} 
                          alt={step.title}
                          width={400}
                          height={300}
                          className="max-h-full max-w-full object-contain rounded-lg"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">Imagem do passo {index + 1}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm md:text-lg mb-2"><span className="text-primary">Passo {index + 1}:</span> {step.title}</h3>
                    <p className="text-zinc-600 text-xs md:text-sm flex-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicadores */}
            <div className="flex justify-center space-x-2 mt-4">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentIndex === index 
                      ? "bg-primary w-6" 
                      : "bg-zinc-300"
                  )}
                  aria-label={`Ir para o slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Botão para entrar na comunidade */}
          <DrawerFooter className="px-4 pb-6">
            <Link href={COMMUNITY_LINK} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button 
                variant="default" 
                size="xl"
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                <MessageSquareText className="mr-2 h-5 w-5" />
                Entrar na Comunidade
              </Button>
            </Link>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Estilos para esconder a barra de rolagem */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (hover: hover) {
          .scrollbar-hide:hover {
            cursor: grab;
          }
          .scrollbar-hide:active {
            cursor: grabbing !important;
          }
        }

        /* Centralizar o slide atual */
        .snap-x {
          scroll-snap-type: x mandatory;
          scroll-padding-left: 1rem;
          scroll-padding-right: 1rem;
        }
        
        .snap-center {
          scroll-snap-align: center;
          scroll-snap-stop: always;
        }
        
        /* Garantir que o último item seja visível ao fim do carrossel */
        .carousel-container {
          padding-right: env(safe-area-inset-right, 40px);
        }
        
        /* Melhorar o desempenho */
        .snap-x, .snap-center {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        /* Estilo de transição mais suave */
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}

// Componente legacy para compatibilidade reversa
export function CommunityTutorialDrawer({ className }: CommunityTutorialButtonProps) {
  return (
    <CommunityDrawerProvider>
      <CommunityTutorialButton className={className} />
    </CommunityDrawerProvider>
  );
}