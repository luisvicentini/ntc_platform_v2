"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Info, Link as LinkIcon, RefreshCw, AlertCircle } from "lucide-react"
import { getDefaultLink, setDefaultLink } from "@/lib/firebase/partner-links"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/utils"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

interface DefaultPaymentLinkModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PartnerLink {
  id: string
  name?: string
  price?: number
  lastlinkUrl?: string
  isDefault?: boolean
  [key: string]: any
}

export function DefaultPaymentLinkModal({ isOpen, onClose }: DefaultPaymentLinkModalProps) {
  const [loading, setLoading] = useState(false)
  const [existingLinks, setExistingLinks] = useState<PartnerLink[]>([])
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [defaultLink, setDefaultLinkState] = useState<PartnerLink | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Iniciando carregamento dos links do Firestore")
      
      // Carregar link padrão atual
      try {
        console.log("Buscando link padrão atual...")
        const currentDefault = await getDefaultLink()
        console.log("Link padrão recebido:", currentDefault)
        setDefaultLinkState(currentDefault)
        
        // Se tem link padrão, seleciona ele
        if (currentDefault) {
          setSelectedLinkId(currentDefault.id)
        }
      } catch (error) {
        console.error("Erro ao carregar link padrão:", error)
        // Continue mesmo com erro aqui para tentar carregar outros links
      }
      
      // Buscar links existentes da Lastlink diretamente do Firestore
      try {
        console.log("Buscando links da Lastlink diretamente do Firestore...")
        
        // Buscar todos os links disponíveis
        const linksRef = collection(db, 'partnerLinks')
        const linksQuery = query(linksRef)
        const querySnapshot = await getDocs(linksQuery)
        
        // Mapear os resultados
        let allLinks: PartnerLink[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Filtrar para encontrar apenas links da Lastlink
        const lastlinkLinks = allLinks.filter(link => {
          return (
            link.checkoutType === 'lastlink' || 
            (link.priceId && link.priceId.startsWith('lastlink_')) ||
            link.paymentMethod === 'lastlink' ||
            link.lastlinkUrl
          )
        })
        
        console.log("Links Lastlink encontrados:", lastlinkLinks.length)
        setExistingLinks(lastlinkLinks)
      } catch (error: any) {
        console.error("Erro ao carregar links do Firestore:", error)
        setError(`Erro ao buscar links: ${error.message || "Erro desconhecido"}`)
        setExistingLinks([]) // Limpar links em caso de erro
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelectLink = async () => {
    if (!selectedLinkId) {
      toast.error("Selecione um link para definir como padrão")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      await setDefaultLink(selectedLinkId)
      
      toast.success("Link de pagamento padrão definido com sucesso")
      
      await loadData() // Recarregar dados
    } catch (error: any) {
      console.error("Erro ao definir link padrão:", error)
      setError(error.message || "Erro ao definir link padrão")
      toast.error("Erro ao definir link padrão")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Link de Pagamento Padrão</DialogTitle>
          <DialogDescription>
            Selecione um link de pagamento para ser usado quando membros precisam adquirir uma assinatura.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-700">Erro</h4>
                  <p className="text-sm text-red-600">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    onClick={loadData}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          )}
        
          {defaultLink && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-purple-700">Link Padrão Atual</h4>
                  <p className="text-sm text-purple-600 mb-2">{defaultLink.name || 'Link sem nome'}</p>
                  <div className="text-xs space-y-1 text-purple-600">
                    <p>Preço: {formatCurrency(defaultLink.price || 0)}</p>
                    {defaultLink.lastlinkUrl && (
                      <a 
                        href={defaultLink.lastlinkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-700 flex items-center gap-1 hover:underline mt-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span>Abrir link</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="linkSelect">Selecione um link de pagamento</Label>
            <Select
              value={selectedLinkId || ''}
              onValueChange={setSelectedLinkId}
              disabled={loading || existingLinks.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um link..."} />
              </SelectTrigger>
              <SelectContent>
                {existingLinks.length === 0 && (
                  <SelectItem value="none" disabled>
                    {loading ? "Carregando..." : "Nenhum link da Lastlink disponível"}
                  </SelectItem>
                )}
                
                {existingLinks.map(link => (
                  <SelectItem key={link.id} value={link.id}>
                    {link.name || 'Link sem nome'} - {formatCurrency(link.price || 0)}
                    {link.isDefault && " (Padrão)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {!loading && existingLinks.length === 0 && !error && (
              <div className="text-sm text-amber-600 flex items-center gap-2 p-3 bg-amber-50 rounded-md">
                <Info className="h-4 w-4" />
                <span>Nenhum link da Lastlink disponível. Crie links na seção de links de parceiros.</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Carregando..." : "Atualizar"}
            </Button>
            
            <Button
              onClick={handleSelectLink}
              disabled={!selectedLinkId || loading}
            >
              {loading ? "Processando..." : "Definir como Padrão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 