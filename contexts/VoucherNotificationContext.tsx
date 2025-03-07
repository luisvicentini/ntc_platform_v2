"use client"

import { createContext, useContext, useEffect } from "react"
import { collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"
import { format, isAfter, isBefore, addDays, differenceInDays } from "date-fns"
import { ptBR } from 'date-fns/locale/pt-BR'

export const VoucherNotificationContext = createContext({})

export function VoucherNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  // Verifica vouchers a cada 1 hora
  useEffect(() => {
    if (!user?.uid) return

    const checkVouchers = async () => {
      const now = new Date()
      const vouchersRef = collection(db, "vouchers")
      
      // Busca vouchers pendentes do usuário
      const pendingQuery = query(
        vouchersRef,
        where("memberId", "==", user.uid),
        where("status", "==", "pending")
      )

      const pendingSnapshot = await getDocs(pendingQuery)

      for (const voucherDoc of pendingSnapshot.docs) {
        const voucher = voucherDoc.data()
        const expiresAt = voucher.expiresAt.toDate()
        const createdAt = voucher.createdAt.toDate()
        const oneDayAfterCreation = addDays(createdAt, 1)
        const oneDayBeforeExpiration = addDays(expiresAt, -1)

        // Buscar dados do estabelecimento
        const establishmentRef = doc(db, "establishments", voucher.establishmentId)
        const establishmentSnap = await getDoc(establishmentRef)
        
        if (!establishmentSnap.exists()) {
          console.error("Estabelecimento não encontrado:", voucher.establishmentId)
          continue
        }

        const establishment = establishmentSnap.data()
        const establishmentName = establishment.name

        // Notificação 1 dia após gerar o voucher
        if (isAfter(now, oneDayAfterCreation) && 
            !voucher.firstReminderSent) {
          await Promise.all([
            addDoc(collection(db, "notifications"), {
              type: "voucher_reminder",
              memberId: user.uid,
              establishmentId: voucher.establishmentId,
              establishmentName,
              voucherId: voucherDoc.id,
              message: `Seu voucher de ${voucher.discount}% de desconto em ${establishmentName} expira em ${format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}`,
              createdAt: Timestamp.now(),
              status: "pending"
            }),
            updateDoc(voucherDoc.ref, { firstReminderSent: true })
          ])
        }

        // Notificação 1 dia antes de expirar
        if (isAfter(now, oneDayBeforeExpiration) && 
            !voucher.expiringReminderSent) {
          await Promise.all([
            addDoc(collection(db, "notifications"), {
              type: "voucher_expiring",
              memberId: user.uid,
              establishmentId: voucher.establishmentId,
              establishmentName,
              voucherId: voucherDoc.id,
              message: `Seu voucher de ${voucher.discount}% de desconto em ${establishmentName} expira amanhã!`,
              createdAt: Timestamp.now(),
              status: "pending"
            }),
            updateDoc(voucherDoc.ref, { expiringReminderSent: true })
          ])
        }

        // Notificação quando expira
        if (isAfter(now, expiresAt) && 
            !voucher.expiredNotificationSent) {
          await Promise.all([
            addDoc(collection(db, "notifications"), {
              type: "voucher_expired",
              memberId: user.uid,
              establishmentId: voucher.establishmentId,
              establishmentName,
              voucherId: voucherDoc.id,
              message: `Seu voucher de ${voucher.discount}% de desconto em ${establishmentName} expirou.`,
              createdAt: Timestamp.now(),
              status: "pending"
            }),
            updateDoc(voucherDoc.ref, {
              status: "expired",
              expiredNotificationSent: true
            })
          ])
        }
      }

      // NOVA LÓGICA: busca vouchers já utilizados (com check-in)
      const usedQuery = query(
        vouchersRef,
        where("memberId", "==", user.uid),
        where("status", "==", "used") // Assumindo que vouchers com check-in têm status "used"
      )

      const usedSnapshot = await getDocs(usedQuery)

      for (const voucherDoc of usedSnapshot.docs) {
        const voucher = voucherDoc.data()
        
        // Verificar se usedAt existe (data do check-in)
        if (!voucher.usedAt) continue;
        
        const usedAt = voucher.usedAt.toDate()
        const oneDayAfterUsage = addDays(usedAt, 1)
        
        // Buscar dados do estabelecimento
        const establishmentRef = doc(db, "establishments", voucher.establishmentId)
        const establishmentSnap = await getDoc(establishmentRef)
        
        if (!establishmentSnap.exists()) {
          console.error("Estabelecimento não encontrado:", voucher.establishmentId)
          continue
        }

        const establishment = establishmentSnap.data()
        const establishmentName = establishment.name

        // Notificação 1 dia após o check-in (para avaliação)
        if (isAfter(now, oneDayAfterUsage) && 
            !voucher.ratingNotificationSent) {
          await Promise.all([
            addDoc(collection(db, "notifications"), {
              type: "rating",
              memberId: user.uid,
              establishmentId: voucher.establishmentId,
              establishmentName,
              voucherId: voucherDoc.id,
              message: `Como foi sua experiência em ${establishmentName}? Avalie agora!`,
              createdAt: Timestamp.now(),
              status: "pending"
            }),
            updateDoc(voucherDoc.ref, { ratingNotificationSent: true })
          ])
        }
      }
    }

    // Executa imediatamente e depois a cada hora
    checkVouchers()
    const interval = setInterval(checkVouchers, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user?.uid])

  return (
    <VoucherNotificationContext.Provider value={{}}>
      {children}
    </VoucherNotificationContext.Provider>
  )
}

export const useVoucherNotification = () => useContext(VoucherNotificationContext) 