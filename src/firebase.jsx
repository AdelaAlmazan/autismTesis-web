import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// ✅ Primero se inicializa la app
const firebaseConfig = {
  apiKey: "AIzaSyAf0-LTmWl7hZ050eml8_GZSom338H1ocg",
  authDomain: "emobosque.firebaseapp.com",
  projectId: "emobosque",
  storageBucket: "emobosque.firebasestorage.app",
  messagingSenderId: "26327119853",
  appId: "1:26327119853:web:597b605cf7f39e1b7219e4"
}

const app = initializeApp(firebaseConfig)

// ✅ Luego se exportan los servicios
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
