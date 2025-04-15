import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBettnGkmfwqvyNxldRCw4mRDxEKJ_-mrc",
  authDomain: "healthcare-demo-571f6.firebaseapp.com",
  projectId: "healthcare-demo-571f6",
  storageBucket: "healthcare-demo-571f6.firebasestorage.app",
  messagingSenderId: "160458548725",
  appId: "1:160458548725:web:cb6f549f74458705772cbc",
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }
