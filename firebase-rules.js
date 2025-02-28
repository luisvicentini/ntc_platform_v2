rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir escrita na coleção subscriptions
    match /subscriptions/{document=**} {
      allow read, write: if true; // Temporariamente permitir tudo para testes
    }
  }
} 