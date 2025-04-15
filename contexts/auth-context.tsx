"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserData } from "@/lib/auth-service"

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
  authError: string | null
  setAuthError: (error: string | null) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  authError: null,
  setAuthError: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? `User: ${currentUser.email}` : "No user")
      setUser(currentUser)

      if (currentUser) {
        try {
          const { success, userData, error } = await getUserData(currentUser.uid)
          if (success) {
            console.log("User data loaded:", userData)
            setUserData(userData)
          } else {
            console.error("Failed to load user data:", error)
            setAuthError(`Failed to load user data: ${error}`)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setAuthError(`Error fetching user data: ${error}`)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading, authError, setAuthError }}>{children}</AuthContext.Provider>
  )
}
