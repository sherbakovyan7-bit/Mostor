import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyBUxrhCQizSskk1tNu9WIkN_Oc5ely3bYI',
  authDomain: 'mostor.firebaseapp.com',
  projectId: 'mostor',
  storageBucket: 'mostor.firebasestorage.app',
  messagingSenderId: '1044427517972',
  appId: '1:1044427517972:web:a071712b0fb179c76e7701',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
