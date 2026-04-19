import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Guard against HMR re-initialisation — Firebase SDK allows only one init per app.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Production: persist to IndexedDB so the app works offline (mountain areas, no signal).
// Development: memory cache avoids IndexedDB lock contention in multi-frame dev servers.
let db
try {
  db = initializeFirestore(app, {
    localCache: import.meta.env.PROD
      ? persistentLocalCache({ tabManager: persistentSingleTabManager() })
      : memoryLocalCache(),
  })
} catch {
  db = getFirestore(app)
}

// Connect to local emulator when VITE_FIRESTORE_EMULATOR=true (bun run dev:emulated)
if (import.meta.env.VITE_FIRESTORE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080)
}

export { db }
