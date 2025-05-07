"use client"

import { useState, useEffect, useRef, TouchEvent } from "react"
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Card } from "@/components/ui/card"
import ReactPlayer from "react-player"
import { useAuth } from "@/contexts/auth-context"

// Componente de barra de progresso animada para produtos
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  return (
    <div className="flex space-x-1 w-full">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-1 rounded-full flex-1 ${
            index < current 
              ? "bg-white" 
              : index === current 
                ? "bg-white/70" 
                : "bg-white/20"
          }`}
        >
          {index === current && (
            <div 
              className="h-full bg-white animate-progress-bar" 
              style={{ 
                transformOrigin: 'left',
                animation: 'progress 5s linear'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  mediaType: "image" | "video";
  voucher: string;
  validUntil: string | Date;
  link: string;
  isActive?: boolean;
  createdAt?: string | Date;
  phone?: { ddi: string; phone: string };
};

interface ProductCarouselProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  hasActiveSubscription?: boolean;
}

export function ProductCarousel({ products, onProductClick, hasActiveSubscription = false }: ProductCarouselProps) {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [playing, setPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Const para verificar se o usuário tem assinatura ativa
  const userHasActiveSubscription = hasActiveSubscription;

  // Resetar o timer quando os produtos mudam
  useEffect(() => {
    setCurrentIndex(0);
    resetAutoplay();

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [products]);

  const resetAutoplay = () => {
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
    }

    if (products.length > 1) {
      autoPlayRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 5000); // 5 segundos
    }
  };

  // Atualizar o autoplay quando o índice muda
  useEffect(() => {
    resetAutoplay();
  }, [currentIndex]);

  // Funções para navegação
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  // Handlers para navegação por toque (swipe)
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Função para mascarar código do cupom
  const maskVoucherCode = (code: string) => {
    if (!user) return '*'.repeat(code.length); // Se não estiver logado
    if (userHasActiveSubscription) return code; // Se tiver assinatura ativa
    return '*'.repeat(code.length); // Se estiver logado mas sem assinatura ativa
  };

  // Função para rolar o carrossel desktop
  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.6;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Renderizar produto único (para mobile)
  const renderCurrentProduct = () => {
    if (products.length === 0) return null;
    
    const product = products[currentIndex];
    
    return (
      <div 
        className="relative w-full" 
        onClick={() => onProductClick(product)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="overflow-hidden bg-zinc-50 border-zinc-100 w-full">
          <div className="relative aspect-video">
            {product.mediaType === "video" ? (
              <ReactPlayer
                url={product.image}
                width="100%"
                height="100%"
                playing={playing}
                muted={true}
                loop={true}
                playsinline
                controls={false}
                config={{
                  file: {
                    attributes: {
                      controlsList: "nodownload",
                      disablePictureInPicture: true,
                    },
                  },
                }}
                style={{ objectFit: "cover" }}
                onError={(e) => console.error("Erro ao reproduzir vídeo:", e)}
              />
            ) : (
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            )}

            {/* Barra de progresso no topo */}
            <div className="absolute top-0 left-0 right-0 p-2 z-10">
              <ProgressBar current={currentIndex} total={products.length} />
            </div>
            
            {/* Informações sobrepostas na imagem para mobile */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16 text-white">
              <h3 className="font-medium text-md truncate">{product.name}</h3>
              <div className="flex items-center gap-2 text-sm opacity-80 mt-1">
                <Ticket className="w-4 h-4" /> CUPOM: {maskVoucherCode(product.voucher).toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Removendo a div de informações fora da imagem para mobile */}
          {!isMobile && (
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-zinc-500">{product.name}</h3>
              <p className="text-sm text-zinc-400 line-clamp-2">{product.description}</p>
              <p className="text-xs text-emerald-500 font-medium">
                Cupom: {maskVoucherCode(product.voucher)}
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // Renderizar carrossel para desktop/tablet
  const renderDesktopCarousel = () => {
    if (products.length === 0) return null;

    return (
      <div className="relative -mx-4 px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold text-zinc-500">Ofertas Especiais</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="default" 
              className="rounded-full" 
              onClick={() => scrollCarousel('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              className="rounded-full" 
              onClick={() => scrollCarousel('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto pb-3 gap-4 scrollbar-hide carousel-container"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="carousel-item"
              style={{
                width: "280px",
                flexShrink: 0,
              }}
              onClick={() => onProductClick(product)}
            >
              <Card className="overflow-hidden cursor-pointer bg-zinc-50 border-zinc-100 h-full hover:shadow-md transition-shadow">
                <div className="relative aspect-video">
                  {product.mediaType === "video" ? (
                    <ReactPlayer
                      url={product.image}
                      width="100%"
                      height="100%"
                      playing={true}
                      muted={true}
                      loop={true}
                      playsinline
                      controls={false}
                      config={{
                        file: {
                          attributes: {
                            controlsList: "nodownload",
                            disablePictureInPicture: true,
                          },
                        },
                      }}
                      style={{ objectFit: "cover" }}
                      onError={(e) => console.error("Erro ao reproduzir vídeo:", e)}
                    />
                  ) : (
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-zinc-500">{product.name}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 text-sm opacity-80 mt-1 font-medium text-zinc-500">
                    <Ticket className="w-4 h-4" /> CUPOM: {maskVoucherCode(product.voucher).toUpperCase()}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar baseado no tamanho da tela
  return isMobile ? renderCurrentProduct() : renderDesktopCarousel();
}

// Adicionar animação da barra de progresso
export function getProgressKeyframes() {
  return `
    @keyframes progress {
      0% { transform: scaleX(0); }
      100% { transform: scaleX(1); }
    }
  `;
} 