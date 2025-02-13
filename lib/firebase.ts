import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

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
let app: any;
let storage: ReturnType<typeof getStorage>;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  storage = getStorage(app);
  
  // Verificar se o storage foi inicializado corretamente
  if (!storage.app) {
    throw new Error('Storage não foi inicializado corretamente');
  }
  
  // Verificar se o bucket está configurado
  if (!storage.app.options.storageBucket) {
    throw new Error('Storage bucket não está configurado');
  }
  
  console.log('Firebase Storage inicializado com sucesso. Bucket:', storage.app.options.storageBucket);
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  // Reinicializar o app se houver erro
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
}

const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db, storage }
