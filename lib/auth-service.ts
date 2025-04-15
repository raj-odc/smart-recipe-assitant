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
    console.log("Registering user with email:", email)

    // Validate password length
    if (password.length < 6) {
      console.log("Password too short")
      return { success: false, error: "Password should be at least 6 characters" }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    console.log("User registered successfully:", user.uid)

    // Create a user document in Firestore
    console.log("Creating user document in Firestore")
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPremium: false,
      lastSession: null,
      sessionCount: 0,
    })
    console.log("User document created successfully")

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
    console.log("Signing in user with email:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.uid)
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
    console.log("Signing out user")
    await firebaseSignOut(auth)
    console.log("User signed out successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Sign out error:", error.code, error.message)
    return { success: false, error: "Failed to sign out" }
  }
}

// Reset password
export const resetPassword = async (email: string) => {
  try {
    console.log("Sending password reset email to:", email)
    await sendPasswordResetEmail(auth, email)
    console.log("Password reset email sent successfully")
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
    console.log("Getting user data for:", userId)
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      console.log("User data retrieved successfully")
      return { success: true, userData: userDoc.data() }
    } else {
      console.log("User document does not exist")
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
    console.log("Checking if user can start a new session:", userId)
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      console.log("User document does not exist")
      return { canStart: false, error: "User not found" }
    }

    // DEVELOPMENT MODE: Always allow sessions regardless of time limits
    // Remove this line in production
    return { canStart: true }

    /* Comment out the session limit check for development
    const userData = userDoc.data()

    // If user is premium, always allow
    if (userData.isPremium) {
      console.log("User is premium, allowing session")
      return { canStart: true }
    }

    // Check last session time for free users
    if (userData.lastSession) {
      const lastSessionDate = userData.lastSession.toDate()
      const currentDate = new Date()
      const diffTime = Math.abs(currentDate.getTime() - lastSessionDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      console.log("Days since last session:", diffDays)

      if (diffDays < 7) {
        console.log("User has used their free session this week")
        return {
          canStart: false,
          error: "Free users are limited to 1 session per week",
          nextSessionDate: new Date(lastSessionDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      }
    }
    */

    console.log("User can start a new session")
    return { canStart: true }
  } catch (error: any) {
    console.error("Session check error:", error.code, error.message)
    return { canStart: false, error: "Failed to check session availability" }
  }
}

// Record a new session
export const recordSession = async (userId: string) => {
  try {
    console.log("Recording new session for user:", userId)

    // Get current user data
    const userData = await getUserData(userId)
    const sessionCount = userData.success ? userData.userData?.sessionCount || 0 : 0

    console.log("Current session count:", sessionCount)

    // Update user document
    await setDoc(
      doc(db, "users", userId),
      {
        lastSession: serverTimestamp(),
        sessionCount: sessionCount + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    console.log("Session recorded successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Record session error:", error.code, error.message)
    return { success: false, error: "Failed to record session" }
  }
}
