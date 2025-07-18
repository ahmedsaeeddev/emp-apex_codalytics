import { auth, db, type Employee } from "./firebase"
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

export async function signIn(email: string, password: string) {
  try {
    console.log("🔐 Starting login process for:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    if (!firebaseUser) {
      throw new Error("Firebase user not found after sign-in.")
    }

    console.log("✅ Firebase Auth successful for:", firebaseUser.email)

    // Fetch additional employee details from Firestore
    const employeeDocRef = doc(db, "employees", firebaseUser.uid)
    const employeeDocSnap = await getDoc(employeeDocRef)

    if (!employeeDocSnap.exists()) {
      console.error("❌ Employee data not found in Firestore for UID:", firebaseUser.uid)
      // If employee data is missing in Firestore, sign out the user from Firebase Auth
      await firebaseSignOut(auth)
      throw new Error("User profile not found. Please contact support.")
    }

    const employeeData = employeeDocSnap.data() as Employee
    console.log("✅ Employee data fetched from Firestore:", employeeData.email, "Role:", employeeData.role)

    // Store user data in localStorage
    localStorage.setItem("currentUser", JSON.stringify(employeeData))

    return { employee: employeeData, error: null }
  } catch (error: any) {
    console.error("💥 Login error:", error)
    let errorMessage = "Login failed. Please check your credentials."
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential" // Added this specific error code
    ) {
      errorMessage = "Invalid email or password."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email format."
    }
    return {
      employee: null,
      error: errorMessage,
    }
  }
}

export async function getCurrentUser(): Promise<Employee | null> {
  if (typeof window === "undefined") {
    return null
  }

  const storedUser = localStorage.getItem("currentUser")
  if (storedUser) {
    return JSON.parse(storedUser) as Employee
  }

  // Optional: Re-fetch user data if not in localStorage but Firebase Auth session exists
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const employeeDocRef = doc(db, "employees", user.uid)
        const employeeDocSnap = await getDoc(employeeDocRef)
        if (employeeDocSnap.exists()) {
          const employeeData = employeeDocSnap.data() as Employee
          localStorage.setItem("currentUser", JSON.stringify(employeeData))
          resolve(employeeData)
        } else {
          console.warn("Firebase Auth user found, but no corresponding Firestore employee document.")
          await firebaseSignOut(auth) // Sign out if Firestore data is missing
          resolve(null)
        }
      } else {
        resolve(null)
      }
      unsubscribe() // Unsubscribe after first call
    })
  })
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    localStorage.removeItem("currentUser")
    console.log("✅ Signed out successfully")
  } catch (error) {
    console.error("💥 Error signing out:", error)
  }
}
