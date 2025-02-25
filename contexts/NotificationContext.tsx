"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"

interface Notification {
  id: string
  type: string
  memberId: string
  establishmentId: string
  establishmentName: string
  voucherId: string
  status: string
  createdAt: any
}

interface NotificationContextType {
  notifications: Notification[]
  removeNotification: (notificationId: string) => Promise<void>
}

export const NotificationContext = createContext({} as NotificationContextType)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.uid) return

    const notificationsRef = collection(db, "notifications")
    const q = query(
      notificationsRef,
      where("memberId", "==", user.uid),
      where("status", "==", "pending")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[]
      setNotifications(notificationsData)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const removeNotification = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        status: "completed"
      })
    } catch (error) {
      console.error("Erro ao remover notificação:", error)
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)

