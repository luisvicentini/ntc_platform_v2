"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { db, storage } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, orderBy, limit, startAfter } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import type { Product } from "@/components/products/product-carousel"

type ProductContextType = {
  products: Product[]
  loading: boolean
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<string>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProductById: (id: string) => Promise<Product | null>
  loadMore: () => Promise<void>
  refreshProducts: () => Promise<void>
  hasMore: boolean
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const { user } = useAuth()
  const PAGE_SIZE = 10

  useEffect(() => {
    if (user) {
      console.log("ProductContext: Usuário autenticado, carregando produtos iniciais...", {
        userId: user.uid,
        userEmail: user.email,
        role: user.role || 'não definido'
      })
      loadInitialProducts()
    } else {
      console.log("ProductContext: Usuário não autenticado, produtos não serão carregados")
    }
  }, [user])

  const loadInitialProducts = async () => {
    setLoading(true)
    try {
      console.log("ProductContext: Iniciando carregamento de produtos iniciais...")
      let productsQuery
      
      if (user?.role === "master") {
        console.log("ProductContext: Usuário é master, carregando todos os produtos")
        // Administradores veem todos os produtos
        productsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        )
      } else {
        console.log("ProductContext: Usuário é parceiro, carregando produtos do parceiro", user?.uid)
        // Parceiros veem apenas seus próprios produtos
        productsQuery = query(
          collection(db, "products"),
          where("partnerId", "==", user?.uid),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        )
      }

      const querySnapshot = await getDocs(productsQuery)
      console.log(`ProductContext: Query executada, retornou ${querySnapshot.size} documentos`)
      
      if (querySnapshot.empty) {
        console.log("ProductContext: Nenhum produto encontrado")
        setProducts([])
        setHasMore(false)
      } else {
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]
        
        console.log(`ProductContext: Processados ${productsData.length} produtos`)
        
        setProducts(productsData)
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])
        setHasMore(querySnapshot.docs.length >= PAGE_SIZE)
      }
    } catch (error) {
      console.error("ProductContext: Erro ao carregar produtos:", error)
      toast.error("Erro ao carregar produtos")
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!lastVisible || !hasMore) return

    setLoading(true)
    try {
      let productsQuery
      
      if (user?.role === "master") {
        productsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        )
      } else {
        productsQuery = query(
          collection(db, "products"),
          where("partnerId", "==", user?.uid),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        )
      }

      const querySnapshot = await getDocs(productsQuery)
      
      if (querySnapshot.empty) {
        setHasMore(false)
      } else {
        const newProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]
        
        setProducts(prev => [...prev, ...newProducts])
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])
        setHasMore(querySnapshot.docs.length >= PAGE_SIZE)
      }
    } catch (error) {
      console.error("Erro ao carregar mais produtos:", error)
      toast.error("Erro ao carregar mais produtos")
    } finally {
      setLoading(false)
    }
  }

  const refreshProducts = async () => {
    await loadInitialProducts()
  }

  const addProduct = async (product: Omit<Product, "id" | "createdAt">): Promise<string> => {
    try {
      const newId = uuidv4()
      const now = new Date().toISOString()
      
      const newProduct = {
        ...product,
        id: newId,
        createdAt: now,
        partnerId: user?.uid,
        isActive: true
      }
      
      const productRef = doc(db, "products", newId)
      await setDoc(productRef, newProduct)
      
      setProducts(prev => [newProduct as Product, ...prev])
      
      return newId
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      throw new Error("Erro ao adicionar produto")
    }
  }

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      const productRef = doc(db, "products", id)
      await updateDoc(productRef, product)
      
      setProducts(prev => 
        prev.map(p => p.id === id ? { ...p, ...product } : p)
      )
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      throw new Error("Erro ao atualizar produto")
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const productRef = doc(db, "products", id)
      await deleteDoc(productRef)
      
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      throw new Error("Erro ao excluir produto")
    }
  }

  const getProductById = async (id: string): Promise<Product | null> => {
    try {
      const productRef = doc(db, "products", id)
      const productSnap = await getDoc(productRef)
      
      if (productSnap.exists()) {
        return {
          id: productSnap.id,
          ...productSnap.data()
        } as Product
      }
      
      return null
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      return null
    }
  }

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        loadMore,
        refreshProducts,
        hasMore
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export function useProduct() {
  const context = useContext(ProductContext)
  
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider")
  }
  
  return context
} 