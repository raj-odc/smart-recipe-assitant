"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { signOut } from "@/lib/auth-service"

export default function DebugPage() {
  const { user, userData, loading } = useAuth()
  const [authState, setAuthState] = useState<any>(null)

  useEffect(() => {
    // Get current auth state
    const currentUser = auth.currentUser
    setAuthState({
      currentUser: currentUser
        ? {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            isAnonymous: currentUser.isAnonymous,
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
          }
        : null,
      contextUser: user
        ? {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            isAnonymous: user.isAnonymous,
          }
        : null,
      userData,
      loading,
    })
  }, [user, userData, loading])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>View current authentication state and user data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Auth State</h3>
              <pre className="bg-slate-100 p-4 rounded-md overflow-auto mt-2">{JSON.stringify(authState, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSignOut} variant="destructive">
            Sign Out
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline" className="ml-2">
            Go to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
