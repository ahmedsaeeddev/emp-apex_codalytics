import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, type Timestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)
export const db = getFirestore(app)

export type Employee = {
  uid: string // Firebase Auth User ID
  fullName: string
  email: string
  contactNumber?: string
  position: string
  role: "admin" | "employee"
  createdAt: Timestamp // Firestore Timestamp
}

export type Task = {
  id?: string // Firestore document ID
  taskName: string
  description?: string
  category?: string
  assignedToUid: string // UID of the assigned employee
  status: "not_started" | "50_done" | "70_done" | "completed" | "pending"
  statusChangeCount?: number // New field to track status changes
  createdAt: Timestamp // Firestore Timestamp
  expiresAt: Timestamp // Firestore Timestamp
  employee?: { fullName: string; position: string } // Joined data for display
}
