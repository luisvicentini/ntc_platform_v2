"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  fetchSignInMethodsForEmail
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { redirect } from "next/navigation"

export type UserType = "member" | "partner" | "business" | "master"

interface UserData {
  userType: UserType
  displayName?: string
  email?: string
  photoURL?: string
  phoneNumber?: string
  emailVerified?: boolean
  createdAt?: string
  updatedAt?: any
  authProvider?: string
}

interface CustomUser extends User {
  userName: any
  userEmail: any
  userType: UserType
  createdAt?: string
  updatedAt?: any
  authProvider?: string
}

interface AuthContextType {
  user: CustomUser | null
  loading: boolean
  signIn: (email: string, password: string, userType?: UserType) => Promise<void>
  signInWithGoogle: (userType?: UserType) => Promise<void>
  signInWithFacebook: (userType?: UserType) => Promise<void>
  signUp: (email: string, password: string, userType: UserType) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Iniciando monitoramento de autenticação...')
    let mounted = true

    const initializeAuth = async () => {
      setLoading(true)
      
      // Tenta recuperar o usuário do localStorage
      const storedUser = localStorage.getItem('authUser')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          console.log('Usuário recuperado do localStorage:', parsedUser)

          // Criar cookie de sessão
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: parsedUser }),
          })

          if (!response.ok) {
            throw new Error("Erro ao criar sessão")
          }

          setUser(parsedUser as CustomUser)
          setLoading(false)
        } catch (error) {
          console.error('Erro ao recuperar usuário do localStorage:', error)
          localStorage.removeItem('authUser')
        }
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Estado de autenticação alterado:', firebaseUser?.uid)
        if (firebaseUser && mounted) {
          try {
            // Buscar usuário pelo email
            const usersRef = collection(db, "users")
            const emailQuery = query(usersRef, where("email", "==", firebaseUser.email?.toLowerCase()))
            const querySnapshot = await getDocs(emailQuery)

            if (querySnapshot.empty) {
              console.log('Dados do usuário não encontrados no Firestore')
              setUser(null)
              setLoading(false)
              localStorage.removeItem('authUser')
              return
            }

            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data() as UserData

            // Combinar dados do Firebase Auth com dados do Firestore
            const customUser = {
              ...firebaseUser,
              ...userData,
              id: userDoc.id,
              uid: firebaseUser.uid,
              email: userData.email || firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              displayName: userData.displayName || firebaseUser.displayName,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber,
              isAnonymous: firebaseUser.isAnonymous,
              metadata: firebaseUser.metadata,
              providerData: firebaseUser.providerData
            } as CustomUser
            
            console.log('Atualizando estado do usuário:', customUser)
            if (mounted) {
              // Criar cookie de sessão
              const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ user: customUser }),
              })

              if (!response.ok) {
                throw new Error("Erro ao criar sessão")
              }

              setUser(customUser)
              // Salva o usuário no localStorage
              localStorage.setItem('authUser', JSON.stringify(customUser))
              setLoading(false)
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error)
            if (mounted) {
              setUser(null)
              setLoading(false)
              localStorage.removeItem('authUser')
            }
          }
        } else {
          console.log('Usuário deslogado')
          if (mounted) {
            setUser(null)
            setLoading(false)
            localStorage.removeItem('authUser')
          }
        }
      })

      return unsubscribe
    }

    const unsubscribe = initializeAuth()

    return () => {
      console.log('Limpando monitoramento de autenticação')
      mounted = false
      unsubscribe.then(unsub => unsub())
    }
  }, [])

  const signIn = async (email: string, password: string, userType?: UserType) => {
    try {
      // Verificar os métodos de login disponíveis
      const signInMethods = await fetchSignInMethodsForEmail(auth, email)
      
      // Se o usuário tem login social, não permitir login com email/senha
      if (signInMethods.includes('google.com')) {
        throw new Error("Este email está vinculado ao Google. Por favor, faça login com o Google.")
      }
      if (signInMethods.includes('facebook.com')) {
        throw new Error("Este email está vinculado ao Facebook. Por favor, faça login com o Facebook.")
      }

      console.log('Tentando autenticar com email:', email)
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)
      console.log('Usuário autenticado no Firebase:', firebaseUser.uid)
      
      // Buscar usuário pelo email
      const usersRef = collection(db, "users")
      const emailQuery = query(usersRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(emailQuery)

      if (querySnapshot.empty) {
        throw new Error("Usuário não encontrado no banco de dados")
      }

      // Pegar o primeiro documento encontrado
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data() as UserData
      
      // Atualizar o documento com o firebaseUid
      await updateDoc(doc(db, "users", userDoc.id), {
        firebaseUid: firebaseUser.uid,
        authProvider: 'password',
        updatedAt: serverTimestamp()
      })

      // Criar objeto do usuário com os dados existentes
      const customUser = {
        ...firebaseUser,
        ...userData,
        id: userDoc.id,
        userType: userData.userType,
        displayName: userData.displayName || firebaseUser.displayName || "",
        photoURL: userData.photoURL || firebaseUser.photoURL || "",
        email: userData.email || firebaseUser.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || "",
        authProvider: 'password'
      } as CustomUser

      // Criar cookie de sessão
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: customUser }),
      })

      if (!response.ok) {
        console.error("Erro na resposta da API de sessão:", await response.text())
        throw new Error("Erro ao criar sessão")
      }
      
      setUser(customUser)
      localStorage.setItem('authUser', JSON.stringify(customUser))
      
      // Redirecionar com base no tipo de usuário
      redirectBasedOnUserType(userData.userType)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signInWithGoogle = async (userType?: UserType) => {
    try {
      const provider = new GoogleAuthProvider()
      const { user: firebaseUser } = await signInWithPopup(auth, provider)
      
      // Buscar usuário pelo email
      const usersRef = collection(db, "users")
      const emailQuery = query(usersRef, where("email", "==", firebaseUser.email?.toLowerCase()))
      const querySnapshot = await getDocs(emailQuery)

      if (querySnapshot.empty) {
        throw new Error("Usuário não encontrado no banco de dados")
      }

      // Pegar o primeiro documento encontrado
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data() as UserData
      
      // Atualizar o documento com o firebaseUid
      await updateDoc(doc(db, "users", userDoc.id), {
        firebaseUid: firebaseUser.uid,
        authProvider: 'google.com',
        displayName: firebaseUser.displayName || userData.displayName || "",
        photoURL: firebaseUser.photoURL || userData.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber || "",
        updatedAt: serverTimestamp()
      })

      // Criar objeto do usuário com os dados existentes
      const customUser = {
        ...firebaseUser,
        ...userData,
        id: userDoc.id,
        userType: userData.userType,
        displayName: firebaseUser.displayName || userData.displayName || "",
        photoURL: firebaseUser.photoURL || userData.photoURL || "",
        email: userData.email || firebaseUser.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || "",
        authProvider: 'google.com'
      } as CustomUser

      // Criar cookie de sessão
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: customUser }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar sessão")
      }
      
      setUser(customUser)
      localStorage.setItem('authUser', JSON.stringify(customUser))
      
      // Ao final, redirecionar com base no tipo do usuário
      redirectBasedOnUserType(userData.userType)
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }
  }

  const signInWithFacebook = async (userType?: UserType) => {
    try {
      const provider = new FacebookAuthProvider()
      const { user: firebaseUser } = await signInWithPopup(auth, provider)
      
      // Buscar usuário pelo email
      const usersRef = collection(db, "users")
      const emailQuery = query(usersRef, where("email", "==", firebaseUser.email?.toLowerCase()))
      const querySnapshot = await getDocs(emailQuery)

      if (querySnapshot.empty) {
        throw new Error("Usuário não encontrado no banco de dados")
      }

      // Pegar o primeiro documento encontrado
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data() as UserData
      
      // Atualizar o documento com o firebaseUid
      await updateDoc(doc(db, "users", userDoc.id), {
        firebaseUid: firebaseUser.uid,
        authProvider: 'facebook.com',
        displayName: firebaseUser.displayName || userData.displayName || "",
        photoURL: firebaseUser.photoURL || userData.photoURL || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber || "",
        updatedAt: serverTimestamp()
      })

      // Criar objeto do usuário com os dados existentes
      const customUser = {
        ...firebaseUser,
        ...userData,
        id: userDoc.id,
        userType: userData.userType,
        displayName: firebaseUser.displayName || userData.displayName || "",
        photoURL: firebaseUser.photoURL || userData.photoURL || "",
        email: userData.email || firebaseUser.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || "",
        authProvider: 'facebook.com'
      } as CustomUser

      // Criar cookie de sessão
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: customUser }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar sessão")
      }
      
      setUser(customUser)
      localStorage.setItem('authUser', JSON.stringify(customUser))
      
      // Ao final, redirecionar com base no tipo do usuário
      redirectBasedOnUserType(userData.userType)
    } catch (error) {
      console.error("Error signing in with Facebook:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userType: UserType) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Salvar dados do usuário no Firestore
      const userData = {
        userType,
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: new Date().toISOString(),
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || "",
        authProvider: 'password'
      }
      
      // Buscar usuário pelo email
      const usersRef = collection(db, "users")
      const emailQuery = query(usersRef, where("email", "==", email.toLowerCase()))
      const querySnapshot = await getDocs(emailQuery)

      if (querySnapshot.empty) {
        throw new Error("Usuário não encontrado no banco de dados")
      }

      // Pegar o primeiro documento encontrado
      const userDoc = querySnapshot.docs[0]
      const existingData = userDoc.data()

      // Atualizar o documento existente
      await updateDoc(doc(db, "users", userDoc.id), {
        ...userData,
        firebaseUid: firebaseUser.uid,
        updatedAt: serverTimestamp()
      })
      
      // Criar objeto do usuário
      const customUser = {
        ...firebaseUser,
        ...existingData,
        ...userData,
        id: userDoc.id
      } as CustomUser

      // Criar cookie de sessão
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: customUser }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar sessão")
      }
      
      setUser(customUser)
      localStorage.setItem('authUser', JSON.stringify(customUser))
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      // Limpa o estado do usuário e localStorage
      setUser(null)
      localStorage.removeItem('authUser')

      // Remover cookie de sessão
      const response = await fetch("/api/auth/session/delete", {
        method: "POST",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao remover sessão")
      }

      // Pequeno delay para garantir que o Firebase processe o logout
      await new Promise(resolve => setTimeout(resolve, 500))
      // Redireciona para a página de login unificada
      window.location.href = '/login'
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const redirectBasedOnUserType = (userType: UserType) => {
    // Verificar se há dados de checkout pendentes
    const checkoutData = localStorage.getItem('checkoutData')
    
    if (checkoutData) {
      try {
        const parsedCheckoutData = JSON.parse(checkoutData)
        
        // Verificar se é um checkout da Lastlink
        const isLastlink = 
          parsedCheckoutData.checkoutType === 'lastlink' || 
          parsedCheckoutData.priceId?.startsWith('lastlink_')
        
        if (isLastlink && parsedCheckoutData.partnerLinkId) {
          // Definir URL de callback
          const callbackUrl = `${window.location.origin}/api/lastlink/callback`
          
          // Redirecionar para o endpoint da Lastlink com callback
          console.log('Redirecionando para o endpoint da Lastlink com callback...')
          window.location.href = `/api/lastlink/redirect?linkId=${parsedCheckoutData.partnerLinkId}&userId=${user?.uid}&callback=${encodeURIComponent(callbackUrl)}`
          return
        }
      } catch (error) {
        console.error('Erro ao processar dados de checkout:', error)
      }
    }
    
    // Se não houver dados de checkout ou não for Lastlink, seguir o fluxo normal
    switch (userType) {
      case 'member':
        window.location.href = '/member/profile'
        break
      case 'partner':
        window.location.href = '/partner/dashboard'
        break
      case 'business':
        window.location.href = '/business/dashboard'
        break
      case 'master':
        window.location.href = '/master/dashboard'
        break
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signInWithFacebook,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
