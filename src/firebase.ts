import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore,
  doc, 
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore to configure specific connection settings
// Long polling is forced to improve reliability in unstable network environments
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Only attempt to reach server if navigator thinks we are online
    if (navigator.onLine) {
      await getDocFromServer(doc(db, '_internal_', 'connection-test'));
      console.log('Firebase connection verified');
    }
  } catch (error) {
    console.log('Firebase initialized (working in offline-first mode)');
  }
}

testConnection();
