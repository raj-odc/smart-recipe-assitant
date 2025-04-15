import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

// Register a new user
export const registerUser = async (email: string, password: string) => {
  try {
    // Validate password length
    if (password.length < 6) {
      return { success: false, error: "Password should be at least 6 characters" }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPremium: false,
      lastSession: null,
      sessionCount: 0,
    })

    return { success: true, user }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    let errorMessage = "Failed to create account"

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email is already in use"
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address"
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak (minimum 6 characters)"
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Please check your connection"
    }

    console.error("Registration error:", error.code, error.message)
    return { success: false, error: errorMessage }
  }
}

// Sign in an existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    let errorMessage = "Failed to sign in"

    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMessage = "Invalid email or password"
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address"
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "This account has been disabled"
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Try again later"
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Please check your connection"
    }

    console.error("Login error:", error.code, error.message)
    return { success: false, error: errorMessage }
  }
}

// Sign out the current user
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: any) {
    console.error("Sign out error:", error.code, error.message)
    return { success: false, error: "Failed to sign out" }
  }
}

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    let errorMessage = "Failed to send password reset email"

    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email"
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address"
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Please check your connection"
    }

    console.error("Password reset error:", error.code, error.message)
    return { success: false, error: errorMessage }
  }
}

// Get current user data from Firestore
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return { success: true, userData: userDoc.data() }
    } else {
      return { success: false, error: "User data not found" }
    }
  } catch (error: any) {
    console.error("Get user data error:", error.code, error.message)
    return { success: false, error: "Failed to fetch user data" }
  }
}

// Check if user can start a new session (for freemium users)
export const canStartNewSession = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      return { canStart: false, error: "User not found" }
    }

    const userData = userDoc.data()

    // If user is premium, always allow
    if (userData.isPremium) {
      return { canStart: true }
    }

    // Check last session time for free users
    if (userData.lastSession) {
      const lastSessionDate = userData.lastSession.toDate()
      const currentDate = new Date()
      const diffTime = Math.abs(currentDate.getTime() - lastSessionDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 7) {
        return {
          canStart: false,
          error: "Free users are limited to 1 session per week",
          nextSessionDate: new Date(lastSessionDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      }
    }

    return { canStart: true }
  } catch (error: any) {
    console.error("Session check error:", error.code, error.message)
    return { canStart: false, error: "Failed to check session availability" }
  }
}

// Record a new session
export const recordSession = async (userId: string) => {
  try {
    const userData = await getUserData(userId)
    const sessionCount = userData.success ? userData.userData?.sessionCount || 0 : 0

    await setDoc(
      doc(db, "users", userId),
      {
        lastSession: serverTimestamp(),
        sessionCount: sessionCount + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true }
  } catch (error: any) {
    console.error("Record session error:", error.code, error.message)
    return { success: false, error: "Failed to record session" }
  }
}
