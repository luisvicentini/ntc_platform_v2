"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, X, CalendarIcon } from "lucide-react"
import { PhoneInput } from "@/components/phone-input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils/utils"
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { toast } from "sonner"
import type { Product } from "./product-carousel"

type ProductFormData = Omit<Product, "id" | "createdAt"> & {
  startDate: Date | undefined;
  endDate: Date | undefined;
  mediaFile: File | null;
};

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (product: Omit<Product, "id" | "createdAt">) => Promise<void>
}

export function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    phone: { phone: "", ddi: "55" },
    image: "",
    mediaType: "image",
    voucher: "",
    validUntil: "",
    link: "",
    isActive: true,
    startDate: undefined,
    endDate: undefined,
    mediaFile: null
  })
  const [uploading, setUploading] = useState(false)
  const [currentTab, setCurrentTab] = useState("details")
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    } else if (product) {
      try {
        const validUntil = product.validUntil ? new Date(product.validUntil) : undefined
        
        setFormData({
          name: product.name || "",
          description: product.description || "",
          phone: product.phone || { phone: "", ddi: "55" },
          image: product.image || "",
          mediaType: product.mediaType || "image",
          voucher: product.voucher || "",
          validUntil: product.validUntil || "",
          link: product.link || "",
          isActive: product.isActive !== false,
          startDate: undefined,
          endDate: validUntil,
          mediaFile: null
        })
      } catch (error) {
        console.error("Erro ao carregar dados do produto:", error)
      }
    }
  }, [isOpen, product])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      phone: { phone: "", ddi: "55" },
      image: "",
      mediaType: "image",
      voucher: "",
      validUntil: "",
      link: "",
      isActive: true,
      startDate: undefined,
      endDate: undefined,
      mediaFile: null
    })
    setMediaPreview(null)
    setCurrentTab("details")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Verificar tipo de arquivo
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    
    if (!isVideo && !isImage) {
      toast.error("Formato de arquivo não suportado. Use imagens ou vídeos.")
      return
    }
    
    // Criar preview
    const objectUrl = URL.createObjectURL(file)
    setMediaPreview(objectUrl)
    
    setFormData((prev) => ({
      ...prev,
      mediaFile: file,
      mediaType: isVideo ? "video" : "image"
    }))
  }

  const removeMedia = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
      mediaFile: null,
      mediaType: "image"
    }))
    
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
      setMediaPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      let mediaUrl = formData.image
      const { mediaFile, startDate, endDate, ...productData } = formData
      
      // Validar datas
      if (!endDate) {
        toast.error("A data de validade é obrigatória")
        setUploading(false)
        return
      }
      
      // Upload de mídia se houver arquivo novo
      if (mediaFile) {
        const fileName = `products/${Date.now()}-${mediaFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
        const storageRef = ref(storage, fileName)
        
        const uploadTask = uploadBytesResumable(storageRef, mediaFile)
        
        mediaUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              console.log(`Progresso do upload: ${progress.toFixed(2)}%`)
            },
            (error) => {
              console.error("Erro no upload:", error)
              reject(error)
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve(downloadURL)
              } catch (error) {
                reject(error)
              }
            }
          )
        })
      }
      
      // Preparar dados finais
      const finalProduct = {
        ...productData,
        image: mediaUrl,
        validUntil: endDate.toISOString()
      }
      
      await onSave(finalProduct)
      
      toast.success(product ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!")
      handleClose()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast.error("Erro ao salvar produto. Por favor, tente novamente.")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-100 text-zinc-500 border-zinc-200 max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="media">Mídia</TabsTrigger>
              <TabsTrigger value="dates">Datas e Voucher</TabsTrigger>
            </TabsList>
            
            {/* Aba de detalhes */}
            <TabsContent value="details">
              <div className="grid gap-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="col-span-3 border-zinc-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="col-span-3 border-zinc-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="link" className="text-right">
                    Link de Compra
                  </Label>
                  <Input
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    className="col-span-3 border-zinc-200"
                    placeholder="https://..."
                    required
                  />
                </div>

                <PhoneInput
                  value={formData.phone.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  defaultDDI={formData.phone.ddi}
                />
              </div>
            </TabsContent>
            
            {/* Aba de mídia */}
            <TabsContent value="media">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  {(mediaPreview || formData.image) ? (
                    <div className="relative">
                      {formData.mediaType === "video" ? (
                        <video
                          src={mediaPreview || formData.image}
                          className="w-full h-64 object-cover rounded"
                          autoPlay={true}
                          muted={true}
                          loop={true}
                        />
                      ) : (
                        <img
                          src={mediaPreview || formData.image}
                          alt="Imagem do produto"
                          className="w-full h-64 object-cover rounded"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeMedia}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-64 bg-zinc-100 border-2 border-dashed border-zinc-200 rounded">
                      <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
                        <Plus className="h-12 w-12 text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-400">Clique para adicionar imagem ou vídeo</p>
                        <p className="text-xs text-zinc-400 mt-1">JPG, PNG, GIF, MP4</p>
                        <input
                          id="media-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime,video/x-msvideo"
                          className="hidden"
                          onChange={handleMediaUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Aba de datas e voucher */}
            <TabsContent value="dates">
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voucher" className="text-right">
                    Código do Voucher
                  </Label>
                  <Input
                    id="voucher"
                    name="voucher"
                    value={formData.voucher}
                    onChange={handleChange}
                    className="col-span-3 border-zinc-200"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Data de Validade
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal border-zinc-200",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? (
                            format(formData.endDate, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-zinc-700 text-white"
              disabled={uploading}
            >
              {uploading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 