"use client"

import { useState, useRef, useCallback } from "react"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<{
    message: string;
    details?: string;
    isFirebaseStorage?: boolean;
  } | null>(null)
  
  const { establishments } = useEstablishment()
  const { user } = useAuth()
  
  // Função para verificar se um arquivo de vídeo é válido
  const isValidVideoFile = async (file: File): Promise<{valid: boolean, message?: string}> => {
    // Verificar tamanho (máximo 100MB)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      return { valid: false, message: `O vídeo é muito grande. O tamanho máximo é 100MB.` };
    }

    // Verificar tipos de arquivo suportados
    const supportedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
    if (!supportedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: `Formato de vídeo não suportado. Use MP4, WebM ou MOV.` 
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
          // Verificar duração (máximo 60 segundos)
          if (video.duration > 60) {
            URL.revokeObjectURL(videoURL);
            resolve({ 
              valid: false, 
              message: `O vídeo é muito longo. A duração máxima é 60 segundos.` 
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
  
  // Função para selecionar mídia
  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
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
      } else {
        // Validar imagem
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          toast.error("Formato de arquivo não suportado. Use imagens ou vídeos.");
          return;
        }
        
        // Verificar tamanho da imagem (máximo 10MB)
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error("A imagem é muito grande. O tamanho máximo é 10MB.");
          return;
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
      toast.error('Selecione uma imagem ou vídeo para continuar')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Enviar progresso simulado para feedback ao usuário
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Converter arquivo para base64
      const base64Media = await convertFileToBase64(selectedMedia);
      
      // Preparar payload para a API
      const payload = {
        mediaBase64: base64Media,
        mediaType: mediaType,
        establishmentId: selectedEstablishmentId || null,
        durationDays: durationDays
      };
      
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
      }
      
      // Enviar para a API
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      clearInterval(progressInterval);
      
      // Clonar a resposta antes de lê-la para poder usá-la múltiplas vezes
      const responseClone = response.clone();
      
      // Verificar se a resposta é um JSON mesmo se o status não for ok
      let errorData = null;
      let responseData = null;
      
      try {
        if (!response.ok) {
          errorData = await responseClone.json();
        } else {
          responseData = await response.json();
        }
      } catch (e) {
        console.error("Erro ao processar resposta JSON:", e);
      }
      
      if (!response.ok) {
        // Classificar o erro e mostrar feedback adequado
        let errorMessage = "Erro ao publicar o story";
        let errorDetails = "Tente novamente mais tarde";
        let isFirebaseStorage = false;
        
        if (errorData?.error) {
          errorMessage = errorData.error;
          errorDetails = errorData.details || "Não foi possível concluir a operação";
          
          // Detectar se é erro de Firebase Storage
          if (
            errorMessage.includes("Firebase Storage") || 
            errorMessage.includes("upload da mídia") ||
            (errorData.code && (
              errorData.code.includes("storage/") || 
              errorData.code.includes("permission-denied")
            ))
          ) {
            isFirebaseStorage = true;
          }
        }
        
        setError({
          message: errorMessage,
          details: errorDetails,
          isFirebaseStorage
        });
        setIsUploading(false);
        return;
      }
      
      // Se chegou aqui, a resposta foi bem-sucedida e responseData já contém os dados JSON
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
    } catch (error) {
      console.error('Erro ao publicar story:', error);
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro ao publicar o story');
      setIsUploading(false);
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
      <DialogContent className="sm:max-w-[500px]">
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
                    className="border-2 border-dashed border-zinc-300 rounded-lg p-4 flex flex-col items-center justify-center h-[300px] cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <ImageIcon className="h-10 w-10 text-zinc-400 mb-2" />
                    <p className="text-zinc-500">Clique para selecionar uma imagem</p>
                    <p className="text-zinc-400 text-sm">Tamanho máximo: 30MB</p>
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
                    className="border-2 border-dashed border-zinc-300 rounded-lg p-4 flex flex-col items-center justify-center h-[300px] cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <Video className="h-10 w-10 text-zinc-400 mb-2" />
                    <p className="text-zinc-500">Clique para selecionar um vídeo</p>
                    <p className="text-zinc-400 text-sm">Tamanho máximo: 30MB</p>
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
              <Label>Disponível por</Label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDurationDays(day)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    durationDays === day 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {day} {day === 1 ? 'dia' : 'dias'}
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={!selectedMedia || isUploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando {uploadProgress.toFixed(0)}%
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