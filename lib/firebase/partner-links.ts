import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore'
import { nanoid } from 'nanoid'

export async function createPartnerLink(partnerId: string, name: string, priceId: string) {
  const code = nanoid(8) // Gera um código único de 8 caracteres
  
  const linkData = {
    partnerId,
    code,
    name,
    priceId,
    clicks: 0,
    conversions: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const docRef = await addDoc(collection(db, 'partnerLinks'), linkData)
  return { id: docRef.id, ...linkData }
}

export async function getPartnerLinks(partnerId: string) {
  const linksRef = collection(db, 'partnerLinks')
  const q = query(linksRef, where('partnerId', '==', partnerId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function incrementLinkClicks(linkId: string) {
  const linkRef = doc(db, 'partnerLinks', linkId)
  await updateDoc(linkRef, {
    clicks: increment(1),
    updatedAt: new Date().toISOString()
  })
}

export async function incrementLinkConversions(linkId: string) {
  const linkRef = doc(db, 'partnerLinks', linkId)
  await updateDoc(linkRef, {
    conversions: increment(1),
    updatedAt: new Date().toISOString()
  })
}

export async function getPartnerLinkByCode(code: string) {
  const linksRef = collection(db, 'partnerLinks')
  const q = query(linksRef, where('code', '==', code))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  } as PartnerSalesLink
}

export async function updatePartnerLinkPriceId(linkId: string, priceId: string) {
  const linkRef = doc(db, 'partnerLinks', linkId)
  await updateDoc(linkRef, {
    priceId,
    updatedAt: new Date().toISOString()
  })
}

export async function updateAllPartnerLinksWithDefaultPrice(partnerId: string, defaultPriceId: string) {
  const linksRef = collection(db, 'partnerLinks')
  const q = query(
    linksRef, 
    where('partnerId', '==', partnerId),
    where('priceId', '==', null)
  )
  
  const snapshot = await getDocs(q)
  
  const updatePromises = snapshot.docs.map(doc => 
    updateDoc(doc.ref, {
      priceId: defaultPriceId,
      updatedAt: new Date().toISOString()
    })
  )
  
  await Promise.all(updatePromises)
  return snapshot.docs.length
} 