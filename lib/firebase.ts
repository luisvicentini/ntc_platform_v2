import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  console.error('Storage bucket não configurado nas variáveis de ambiente')
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const storage = getStorage(app)

// Se estiver em desenvolvimento e usando emulador
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST
  if (emulatorHost) {
    const [host, port] = emulatorHost.split(":")
    connectStorageEmulator(storage, host, Number(port))
  }
}

const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db, storage }
