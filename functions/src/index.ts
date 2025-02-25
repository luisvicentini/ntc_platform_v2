import * as functions from "firebase"
import * as admin from "firebase-admin"

admin.initializeApp()

export const scheduleRatingNotification = functions.firestore
  .document('vouchers/{voucherId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data()
    const oldData = change.before.data()

    // Verifica se o status mudou para "used"
    if (oldData.status !== "used" && newData.status === "used") {
      const delay = 24 * 60 * 60 * 1000 // 24 horas em produção
      // const delay = 30 * 1000 // 30 segundos para teste

      // Agenda a notificação
      await admin.firestore().collection('notifications').add({
        type: "rating",
        memberId: newData.memberId,
        establishmentId: newData.establishmentId,
        establishmentName: newData.establishmentName,
        voucherId: context.params.voucherId,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + delay)
        ),
        status: "pending",
        scheduledFor: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + delay)
        )
      })
    }
  })

// Função para limpar notificações antigas (roda diariamente)
export const cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .get()

    const batch = admin.firestore().batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  }) 