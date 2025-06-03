"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Plus, Search, RefreshCcw, Loader2, PenSquare, Trash, Copy, Eye, ToggleLeft, ToggleRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProductModal } from "@/components/products/product-modal"
import { ProductProvider, useProduct } from "@/contexts/ProductContext"
import { toast } from "sonner"
import { Avatar } from "@/components/ui/avatar"
import ReactPlayer from "react-player"

function ProductsPageContent() {
  const { products, loading, refreshProducts, loadMore, hasMore, addProduct, updateProduct, deleteProduct } = useProduct()
  const [search, setSearch] = useState("")
  const [loadingMore, setLoadingMore] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [filterTab, setFilterTab] = useState("all")

  const filteredProducts = products.filter(product => {
    // Filtrar por busca
    const matchesSearch = search === "" || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase()) ||
      product.voucher.toLowerCase().includes(search.toLowerCase());
    
    // Filtrar por status
    if (filterTab === "active") {
      return matchesSearch && product.isActive !== false;
    } else if (filterTab === "inactive") {
      return matchesSearch && product.isActive === false;
    }
    
    return matchesSearch;
  });

  const handleRefresh = async () => {
    await refreshProducts();
    toast.success("Lista de produtos atualizada!");
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore) return;
    
    setLoadingMore(true);
    try {
      await loadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSaveProduct = async (product: any) => {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, product);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await addProduct(product);
        toast.success("Produto cadastrado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await deleteProduct(id);
        toast.success("Produto excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error("Erro ao excluir produto.");
      }
    }
  };

  const handleToggleStatus = async (product: any) => {
    try {
      await updateProduct(product.id, {
        isActive: !product.isActive
      });
      toast.success(
        product.isActive 
          ? "Produto desativado com sucesso!" 
          : "Produto ativado com sucesso!"
      );
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      toast.error("Erro ao alterar status do produto.");
    }
  };

  const handleCopyProduct = async (product: any) => {
    try {
      const { id, createdAt, ...productData } = product;
      const newProductData = {
        ...productData,
        name: `${productData.name} (Cópia)`,
      };
      
      await addProduct(newProductData);
      toast.success("Produto copiado com sucesso!");
    } catch (error) {
      console.error("Erro ao copiar produto:", error);
      toast.error("Erro ao copiar produto.");
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-zinc-700">Produtos</h1>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-zinc-200"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="w-full md:w-auto border-zinc-200"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="all" value={filterTab} onValueChange={setFilterTab} className="mb-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && products.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-10 h-10 text-zinc-400 animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="text-zinc-500 mb-4">Nenhum produto encontrado.</p>
            {search && (
              <Button variant="outline" onClick={() => setSearch("")}>
                Limpar busca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Produto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 overflow-hidden rounded">
                          {product.mediaType === "video" ? (
                            <ReactPlayer
                              url={product.image}
                              width="40px"
                              height="40px"
                              playing={false}
                              muted={true}
                              loop={false}
                              controls={false}
                              className="object-cover"
                            />
                          ) : (
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-700">{product.name}</div>
                          <div className="text-xs text-zinc-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm text-zinc-600">{product.voucher}</div>
                    </TableCell>
                    <TableCell>
                      {formatDate(product.validUntil)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive !== false ? "default" : "secondary"}>
                        {product.isActive !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(product)}
                          title={product.isActive !== false ? "Desativar" : "Ativar"}
                        >
                          {product.isActive !== false ? (
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-zinc-500" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedProduct(product);
                              setIsModalOpen(true);
                            }}>
                              <PenSquare className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyProduct(product)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>
                              <Trash className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="border-zinc-200"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mais"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProductProvider>
      <ProductsPageContent />
    </ProductProvider>
  );
} 