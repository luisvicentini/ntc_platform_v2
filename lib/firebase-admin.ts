import * as admin from 'firebase-admin'

interface FirebaseAdminConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

// Função para inicializar o Firebase Admin SDK
export function getFirebaseAdminApp() {
  // Verificar se já existe uma app inicializada
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  // Configuração do Firebase Admin a partir de variáveis de ambiente
  const config: FirebaseAdminConfig = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }

  // Verificar se as variáveis necessárias estão definidas
  const missingVars = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(`Variáveis de ambiente faltando para Firebase Admin: ${missingVars.join(', ')}`)
  }

  try {
    // Inicializar o app com as credenciais
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    })

    console.log("Firebase Admin SDK inicializado com sucesso")
    return app
  } catch (error: any) {
    console.error("Erro ao inicializar Firebase Admin SDK:", error)
    throw error
  }
}

// Inicializar e exportar o app Firebase Admin
const app = getFirebaseAdminApp()

// Exportar serviços do Firebase Admin
export const auth = admin.auth()
export const firestore = admin.firestore() 