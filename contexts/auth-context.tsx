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
  User
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

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
}

interface CustomUser extends User {
  userType: UserType
  createdAt?: string
  updatedAt?: any
}

interface AuthContextType {
  user: CustomUser | null
  loading: boolean
  signIn: (email: string, password: string, userType: UserType) => Promise<void>
  signInWithGoogle: (userType: UserType) => Promise<void>
  signInWithFacebook: (userType: UserType) => Promise<void>
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
            // Buscar dados adicionais do usuário no Firestore
            console.log('Buscando dados do usuário no Firestore...')
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
            const userData = userDoc.data() as UserData | undefined
            console.log('Dados do usuário:', userData)

            if (!userData) {
              console.log('Dados do usuário não encontrados no Firestore')
              setUser(null)
              setLoading(false)
              localStorage.removeItem('authUser')
              return
            }

            // Combinar dados do Firebase Auth com dados do Firestore
            const customUser = {
              ...firebaseUser,
              ...userData,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber,
              isAnonymous: firebaseUser.isAnonymous,
              metadata: firebaseUser.metadata,
              providerData: firebaseUser.providerData
            } as CustomUser
            
            console.log('Atualizando estado do usuário:', customUser)
            if (mounted) {
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

  const saveUserData = async (userId: string, data: Partial<UserData>) => {
    const userRef = doc(db, "users", userId)
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    // Atualizar o estado do usuário com os novos dados
    if (user) {
      const updatedUser = {
        ...user,
        ...data,
      } as CustomUser

      setUser(updatedUser)
      localStorage.setItem('authUser', JSON.stringify(updatedUser))
    }
  }

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)
      
      // Salvar dados do usuário no Firestore
      const userData = {
        userType,
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: new Date().toISOString(),
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || "",
      }
      
      console.log('Salvando dados do usuário no Firestore:', userData)
      await saveUserData(firebaseUser.uid, userData)
      
      // Buscar dados atualizados do Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      const updatedUserData = userDoc.data() as UserData | undefined
      
      if (!updatedUserData) {
        console.error('Dados do usuário não encontrados após salvar')
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      // Atualizar o estado do usuário com os dados do Firestore
      const customUser = {
        ...firebaseUser,
        ...updatedUserData,
        userType,
        displayName: firebaseUser.displayName || updatedUserData.displayName || "",
        photoURL: firebaseUser.photoURL || updatedUserData.photoURL || "",
        email: firebaseUser.email || updatedUserData.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || updatedUserData.phoneNumber || "",
      } as CustomUser
      
      setUser(customUser)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signInWithGoogle = async (userType: UserType) => {
    try {
      const provider = new GoogleAuthProvider()
      const { user: firebaseUser } = await signInWithPopup(auth, provider)
      
      // Salvar dados do usuário no Firestore
      const userData = {
        userType,
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: new Date().toISOString(),
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || "",
      }
      
      console.log('Salvando dados do usuário no Firestore:', userData)
      await saveUserData(firebaseUser.uid, userData)
      
      // Buscar dados atualizados do Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      const updatedUserData = userDoc.data() as UserData | undefined
      
      if (!updatedUserData) {
        console.error('Dados do usuário não encontrados após salvar')
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      // Atualizar o estado do usuário com os dados do Firestore
      const customUser = {
        ...firebaseUser,
        ...updatedUserData,
        userType,
        displayName: firebaseUser.displayName || updatedUserData.displayName || "",
        photoURL: firebaseUser.photoURL || updatedUserData.photoURL || "",
        email: firebaseUser.email || updatedUserData.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || updatedUserData.phoneNumber || "",
      } as CustomUser
      
      console.log('Atualizando estado do usuário:', customUser)
      setUser(customUser)
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }
  }

  const signInWithFacebook = async (userType: UserType) => {
    try {
      const provider = new FacebookAuthProvider()
      const { user: firebaseUser } = await signInWithPopup(auth, provider)
      
      // Salvar dados do usuário no Firestore
      const userData = {
        userType,
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: new Date().toISOString(),
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || "",
      }
      
      console.log('Salvando dados do usuário no Firestore:', userData)
      await saveUserData(firebaseUser.uid, userData)
      
      // Buscar dados atualizados do Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      const updatedUserData = userDoc.data() as UserData | undefined
      
      if (!updatedUserData) {
        console.error('Dados do usuário não encontrados após salvar')
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      // Atualizar o estado do usuário com os dados do Firestore
      const customUser = {
        ...firebaseUser,
        ...updatedUserData,
        userType,
        displayName: firebaseUser.displayName || updatedUserData.displayName || "",
        photoURL: firebaseUser.photoURL || updatedUserData.photoURL || "",
        email: firebaseUser.email || updatedUserData.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || updatedUserData.phoneNumber || "",
      } as CustomUser
      
      setUser(customUser)
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
      }
      
      console.log('Salvando dados do usuário no Firestore:', userData)
      await saveUserData(firebaseUser.uid, userData)
      
      // Buscar dados atualizados do Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      const updatedUserData = userDoc.data() as UserData | undefined
      
      if (!updatedUserData) {
        console.error('Dados do usuário não encontrados após salvar')
        throw new Error('Erro ao salvar dados do usuário')
      }
      
      // Atualizar o estado do usuário com os dados do Firestore
      const customUser = {
        ...firebaseUser,
        ...updatedUserData,
        userType,
        displayName: firebaseUser.displayName || updatedUserData.displayName || "",
        photoURL: firebaseUser.photoURL || updatedUserData.photoURL || "",
        email: firebaseUser.email || updatedUserData.email || "",
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber || updatedUserData.phoneNumber || "",
      } as CustomUser
      
      setUser(customUser)
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
      // Redireciona para a página inicial
      window.location.href = '/'
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
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
