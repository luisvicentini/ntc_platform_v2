"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { useAuth } from "@/contexts/auth-context"
import { X, Upload, Image as ImageIcon, Video, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"

interface CreateStoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateStoryModal({ isOpen, onClose, onSuccess }: CreateStoryModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null)
  const [durationDays, setDurationDays] = useState<number>(1)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingMedia, setProcessingMedia] = useState(false)
  const [compressingMedia, setCompressingMedia] = useState(false)
  const [isProduction, setIsProduction] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<{
    message: string;
    details?: string;
    isFirebaseStorage?: boolean;
  } | null>(null)
  
  const { establishments } = useEstablishment()
  const { user } = useAuth()
  
  // Verificar se estamos em ambiente de produção ou localhost
  useEffect(() => {
    const hostname = window.location.hostname;
    const isProductionEnv = !(hostname === 'localhost' || hostname === '127.0.0.1');
    
    setIsProduction(isProductionEnv);
    
    // Se estiver em produção, exibir aviso sobre limites
    if (isProductionEnv) {
      toast.info(
        "Em produção, o tamanho máximo de upload é menor. Compressão automática será aplicada.", 
        { duration: 5000 }
      );
    }
  }, []);
  
  // Função para verificar se um arquivo de vídeo é válido
  const isValidVideoFile = async (file: File): Promise<{valid: boolean, message?: string}> => {
    // Verificar tamanho (máximo 100MB)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      return { valid: false, message: `O vídeo é muito grande. O tamanho máximo é 100MB.` };
    }

    // Verificar tipos de arquivo suportados
    const supportedTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-m4v',
      'video/avi',
      'video/x-msvideo',  // AVI
      'video/x-matroska',  // MKV
      'video/3gpp'  // 3GP
    ];
    if (!supportedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: `Formato de vídeo não suportado. Use MP4, WebM, MOV, AVI ou MKV.` 
      };
    }

    try {
      // Criar uma URL temporária para o arquivo
      const videoURL = URL.createObjectURL(file);
      
      // Verificar se o vídeo pode ser carregado
      return new Promise((resolve) => {
        const video = document.createElement('video');
        
        // Event listeners para verificar se o vídeo é reproduzível
        video.onloadedmetadata = () => {
          // Verificar duração (máximo 120 segundos - 2 minutos)
          if (video.duration > 120) {
            URL.revokeObjectURL(videoURL);
            resolve({ 
              valid: false, 
              message: `O vídeo é muito longo. A duração máxima é 2 minutos.` 
            });
            return;
          }
          
          URL.revokeObjectURL(videoURL);
          resolve({ valid: true });
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(videoURL);
          resolve({ 
            valid: false, 
            message: `Não foi possível processar o vídeo. Tente outro arquivo.` 
          });
        };
        
        // Definir a fonte e iniciar o carregamento
        video.src = videoURL;
        video.load();
      });
    } catch (error) {
      console.error("Erro ao verificar vídeo:", error);
      return { 
        valid: false, 
        message: `Erro ao processar o vídeo. Por favor, tente outro arquivo.` 
      };
    }
  };
  
  // Função para comprimir imagem
  const compressImage = async (file: File, maxSizeMB: number = 1): Promise<File> => {
    return new Promise((resolve, reject) => {
      setCompressingMedia(true);
      
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          // Calcular novas dimensões mantendo a proporção
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200; // Tamanho máximo para qualquer dimensão - reduzido para 1200px 
          
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          
          // Criar canvas para compressão
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Desenhar imagem redimensionada
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setCompressingMedia(false);
            reject(new Error('Não foi possível criar contexto de canvas'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para blob com qualidade ajustada
          let quality = 0.8; // Começar com qualidade média em vez de alta
          const processBlob = (blob: Blob | null) => {
            // Se não tiver blob, tratar como erro
            if (!blob) {
              setCompressingMedia(false);
              reject(new Error('Erro ao processar a imagem'));
              return;
            }
            
            // Se ainda estiver acima do tamanho máximo e qualidade > 0.2, comprimir mais
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.2) {
              quality -= 0.1;
              canvas.toBlob(
                processBlob, 
                file.type, 
                quality
              );
            } else {
              // Criar arquivo a partir do blob
              const newFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              setCompressingMedia(false);
              resolve(newFile);
            }
          };
          
          canvas.toBlob(
            processBlob,
            file.type, 
            quality
          );
        };
        
        img.src = readerEvent.target?.result as string;
      };
      
      reader.onerror = () => {
        setCompressingMedia(false);
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Função para selecionar mídia
  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Verificações de tamanho com base no ambiente
      if (isProduction) {
        // Em produção, aplicar limites mais rigorosos
        if (file.size > 15 * 1024 * 1024) { // 15MB
          toast.error("Em produção, o tamanho máximo é 15MB. Selecione um arquivo menor.");
          return;
        }
      }
      
      // Determinar o tipo de mídia
      const isVideo = file.type.startsWith('video/');
      
      // Validações específicas
      if (isVideo) {
        // Validar vídeo
        setProcessingMedia(true);
        const validation = await isValidVideoFile(file);
        setProcessingMedia(false);
        
        if (!validation.valid) {
          toast.error(validation.message || "Vídeo inválido");
          return;
        }
        
        // Verificar se o vídeo é muito grande
        const videoSizeLimit = isProduction ? 15 * 1024 * 1024 : 30 * 1024 * 1024; // 15MB em produção, 30MB em localhost
        if (file.size > videoSizeLimit) {
          toast.error(`O vídeo é muito grande. Por favor, use um vídeo com menos de ${isProduction ? '15MB' : '30MB'}.`);
          return;
        }
      } else {
        // Validar imagem
        const supportedImageTypes = [
          'image/jpeg', 
          'image/jpg', 
          'image/png', 
          'image/gif', 
          'image/webp', 
          'image/bmp',
          'image/svg+xml'
        ];
        
        if (!supportedImageTypes.some(type => file.type === type)) {
          toast.error("Formato de imagem não suportado. Use JPG, PNG, GIF, WEBP, BMP ou SVG.");
          return;
        }
        
        // Se a imagem for maior que o limite, comprimir
        const imageSizeLimit = isProduction ? 2 * 1024 * 1024 : 4 * 1024 * 1024; // 2MB em produção, 4MB em localhost
        if (file.size > imageSizeLimit) {
          try {
            toast.info(`Comprimindo imagem para upload (limite: ${isProduction ? '2MB' : '4MB'})...`);
            const compressedFile = await compressImage(file, isProduction ? 1 : 2); // Comprimir mais em produção
            
            // Se passou por todas as validações, definir o arquivo comprimido
            setSelectedMedia(compressedFile);
            setMediaType("image");
            
            // Criar URL para preview
            const fileURL = URL.createObjectURL(compressedFile);
            setMediaPreview(fileURL);
            return;
          } catch (error) {
            console.error("Erro ao comprimir imagem:", error);
            toast.error("Erro ao comprimir imagem. Tente com uma imagem menor.");
            return;
          }
        }
      }
      
      // Se passou por todas as validações, definir o arquivo selecionado
      setSelectedMedia(file);
      setMediaType(isVideo ? "video" : "image");
      
      // Criar URL para preview
      const fileURL = URL.createObjectURL(file);
      setMediaPreview(fileURL);
    }
  };
  
  // Função para remover mídia selecionada
  const handleRemoveMedia = () => {
    setSelectedMedia(null)
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Função para abrir seletor de arquivo
  const handleClickSelectMedia = () => {
    fileInputRef.current?.click()
  }
  
  // Função para publicar o story
  const handlePublish = async () => {
    if (!selectedMedia || !user) {
      toast.error('Selecione uma imagem ou vídeo para continuar');
      return;
    }
    
    // Verificar o tamanho do arquivo antes de prosseguir
    const MAX_UPLOAD_SIZE = isProduction ? 3 * 1024 * 1024 : 4 * 1024 * 1024; // 3MB em produção, 4MB em localhost
    
    // Para arquivos maiores que o limite, tentar comprimir
    try {
      let mediaToUpload = selectedMedia;
      
      // Comprimir todas as imagens, independente do tamanho original
      if (mediaType === "image") {
        toast.info("Comprimindo imagem para upload...");
        setCompressingMedia(true);
        mediaToUpload = await compressImage(selectedMedia, isProduction ? 1 : 1.5); // Comprimir mais em produção
        setCompressingMedia(false);
        
        // Verificar se mesmo após compressão ainda está muito grande
        if (mediaToUpload.size > (isProduction ? 1.5 : 2) * 1024 * 1024) {
          // Tentar comprimir ainda mais
          toast.info("Aplicando compressão adicional...");
          setCompressingMedia(true);
          mediaToUpload = await compressImage(mediaToUpload, isProduction ? 0.8 : 1); // Comprimir mais agressivamente em produção
          setCompressingMedia(false);
        }
      } else if (mediaToUpload.size > (isProduction ? 15 : 20) * 1024 * 1024) {
        // Se for um vídeo muito grande, mostrar erro
        toast.error(`O vídeo é muito grande. Use um vídeo com menos de ${isProduction ? '15MB' : '20MB'}.`);
        return;
      }
      
      setSelectedMedia(mediaToUpload);
      setIsUploading(true);
      setUploadProgress(0);
      
      // Enviar progresso simulado para feedback ao usuário
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 80 ? 80 : newProgress;
        });
      }, 300);
      
      try {
        // 1. Upload direto para o Firebase Storage
        // Criar uma referência única no Storage
        const timestamp = Date.now();
        const randomId = uuidv4().substring(0, 8);
        const fileExtension = mediaToUpload.name.split('.').pop() || (mediaType === 'image' ? 'jpg' : 'mp4');
        const storagePath = `stories/${user.uid}/${timestamp}-${randomId}.${fileExtension}`;
        const storageRef = ref(storage, storagePath);
        
        console.log(`Fazendo upload direto para o Storage: ${storagePath}`);
        
        // Fazer upload do arquivo
        await uploadBytes(storageRef, mediaToUpload);
        setUploadProgress(90);
        
        // Obter a URL do arquivo
        const downloadURL = await getDownloadURL(storageRef);
        setUploadProgress(95);
        
        console.log(`Arquivo carregado com sucesso. URL: ${downloadURL}`);
        
        // 2. Enviar apenas a URL para a API
        // Obter token do usuário atual, se disponível
        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Se o Firebase Auth estiver disponível, adicionar token de autenticação
        try {
          if (user.getIdToken) {
            const token = await user.getIdToken(true);
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (e) {
          console.warn('Não foi possível obter token de autenticação:', e);
        }
        
        // Obter token da sessão do local storage, se existir
        const sessionToken = localStorage.getItem('session_token');
        if (sessionToken) {
          headers['x-session-token'] = sessionToken;
        }
        
        // Adicionar ID do usuário atual para ajudar na autenticação
        if (user.uid) {
          headers['x-session-user-id'] = user.uid;
          
          // Adicionar dados básicos do usuário em um cabeçalho, para caso a sessão não esteja disponível
          const userData = {
            displayName: user.displayName || user.userName,
            photoURL: user.photoURL,
            isContentProducer: user.isContentProducer === true,
            email: user.email || user.userEmail
          };
          
          headers['x-user-data'] = JSON.stringify(userData);
        }
        
        // Preparar payload para API (apenas com URL)
        const payload = {
          mediaUrl: downloadURL,
          mediaType: mediaType,
          establishmentId: selectedEstablishmentId || null,
          durationDays: durationDays
        };
        
        console.log('Enviando story com dados do usuário:', {
          uid: user.uid,
          displayName: user.displayName || user.userName,
          isContentProducer: user.isContentProducer
        });
        
        // Enviar para a API de create-from-url
        const response = await fetch('/api/stories/create-from-url', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        clearInterval(progressInterval);
        
        // Se o status não for ok, tentar analisar a resposta
        if (!response.ok) {
          let errorMessage = "Erro ao publicar o story";
          let errorDetails = "";
          
          try {
            // Tentar obter como JSON primeiro
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            errorDetails = errorData.details || "";
          } catch (e) {
            // Se falhar, tentar obter como texto
            try {
              const textResponse = await response.clone().text();
              errorDetails = `Resposta do servidor: ${textResponse.substring(0, 100)}...`;
            } catch (textError) {
              errorDetails = "Não foi possível ler a resposta do servidor";
            }
          }
          
          setError({
            message: errorMessage,
            details: errorDetails,
            isFirebaseStorage: errorMessage.includes("Firebase Storage") || errorMessage.includes("upload da mídia")
          });
          
          setIsUploading(false);
          return;
        }
        
        // Se chegou aqui, a resposta foi bem-sucedida
        setUploadProgress(100);
        toast.success('Story publicado com sucesso!');
        
        // Chamar o callback de sucesso, se fornecido
        if (onSuccess) {
          onSuccess();
        }
        
        setTimeout(() => {
          setIsUploading(false);
          onClose();
        }, 500);
      } catch (uploadError) {
        clearInterval(progressInterval);
        console.error('Erro ao fazer upload ou salvar story:', uploadError);
        
        // Verificar se é um erro específico de Firebase Storage
        const isStorageError = uploadError.code && 
                            (uploadError.code.startsWith('storage/') || 
                             uploadError.code.includes('permission-denied') ||
                             uploadError.code.includes('unauthorized'));
        
        if (isStorageError) {
          setError({
            message: "Erro de permissão no Firebase Storage",
            details: "Não foi possível fazer upload do arquivo. Verifique as regras de segurança do seu bucket.",
            isFirebaseStorage: true
          });
        } else {
          setError({
            message: "Erro ao publicar o story",
            details: uploadError.message || "Ocorreu um erro durante o upload ou ao salvar o story",
            isFirebaseStorage: false
          });
        }
        
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Erro ao processar ou enviar story:', error);
      const errorMsg = error instanceof Error ? error.message : 'Ocorreu um erro ao processar ou publicar o story';
      
      // Verificar se a mensagem de erro está relacionada ao tamanho do conteúdo
      if (errorMsg.includes("too large") || errorMsg.includes("tamanho") || 
          errorMsg.includes("413") || errorMsg.includes("limit")) {
        toast.error("Arquivo muito grande para upload. Tente reduzir o tamanho ou resolução.", {
          duration: 8000,
        });
      } else {
        toast.error(errorMsg);
      }
      
      setIsUploading(false);
      setCompressingMedia(false);
    }
  }
  
  // Função auxiliar para converter arquivo para base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-sm:h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar novo story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Imagem</TabsTrigger>
              <TabsTrigger value="video">Vídeo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="image" className="pt-4">
              {/* Campo de upload de imagem */}
              <div className="space-y-2">
                <Label>Imagem do story</Label>
                
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleMediaSelect}
                />
                
                {!mediaPreview || mediaType !== "image" ? (
                  <div 
                    onClick={handleClickSelectMedia}
                    className="border-2 border-dashed border-zinc-300 rounded-lg p-4 flex flex-col items-center justify-center h-[200px] cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <ImageIcon className="h-10 w-10 text-zinc-400 mb-2" />
                    <p className="text-zinc-500">Clique para selecionar uma imagem</p>
                    <p className="text-zinc-400 text-sm text-center">Tamanho máximo recomendado: 4MB.</p>
                  </div>
                ) : (
                  <div className="relative h-[300px] rounded-lg overflow-hidden">
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="video" className="pt-4">
              {/* Campo de upload de vídeo */}
              <div className="space-y-2">
                <Label>Vídeo do story</Label>
                
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleMediaSelect}
                />
                
                {!mediaPreview || mediaType !== "video" ? (
                  <div 
                    onClick={handleClickSelectMedia}
                    className="border-2 border-dashed border-zinc-300 rounded-lg p-4 flex flex-col items-center justify-center h-[200px] cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <Video className="h-10 w-10 text-zinc-400 mb-2" />
                    <p className="text-zinc-500">Clique para selecionar um vídeo</p>
                    <p className="text-zinc-400 text-sm">Tamanho máximo: 30MB</p>
                    <p className="text-zinc-400 text-xs mt-1">(Para vídeos grandes, o upload pode demorar)</p>
                  </div>
                ) : (
                  <div className="relative h-[300px] rounded-lg overflow-hidden">
                    <video 
                      src={mediaPreview} 
                      controls
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Duração do story */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Label>Duração em dias do story</Label>
            </div>
            
            <div className="flex flex-no-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDurationDays(day)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors no-wrap ${
                    durationDays === day 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {day}{day === 1 ? 'D' : 'D'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Seleção de estabelecimento */}
          <div className="space-y-2">
            <Label>Adicionar um cupom ao story (opcional)</Label>
            <Select onValueChange={(value) => setSelectedEstablishmentId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cupom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum cupom</SelectItem>
                {establishments.map((est) => (
                  <SelectItem key={est.id} value={est.id}>
                    {est.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-800">
            <p className="font-medium">{error.message}</p>
            <p className="text-sm mt-1">{error.details}</p>
            
            {error.isFirebaseStorage && (
              <div className="mt-3 text-xs bg-red-100 p-2 rounded">
                <p className="font-semibold">Erro de permissão no Firebase Storage</p>
                <p className="mt-1">
                  Isso geralmente acontece quando as regras de segurança do Firebase Storage 
                  não permitem uploads. Entre em contato com o administrador do sistema.
                </p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="flex flex-col gap-1">
          <Button variant="outline" onClick={onClose} disabled={isUploading || compressingMedia || processingMedia}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={!selectedMedia || isUploading || compressingMedia || processingMedia}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando {uploadProgress.toFixed(0)}%
              </>
            ) : compressingMedia ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comprimindo imagem...
              </>
            ) : processingMedia ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando mídia...
              </>
            ) : (
              'Publicar Story'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 