"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { ChefHat, Mail, Lock, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { registerUser, signIn, canStartNewSession, recordSession } from "@/lib/auth-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showAd, setShowAd] = useState(false)
  const [adCompleted, setAdCompleted] = useState(false)
  const [adTimer, setAdTimer] = useState(15)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [authTab, setAuthTab] = useState<"login" | "register">("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localAuthError, setLocalAuthError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, userData, loading, authError, setAuthError } = useAuth()

  // Debug logging
  useEffect(() => {
    console.log("AuthGate state:", {
      user: user ? `${user.email} (${user.uid})` : "null",
      loading,
      isAuthenticated,
      showAd,
    })
  }, [user, loading, isAuthenticated, showAd])

  // Clear error when switching tabs
  useEffect(() => {
    setLocalAuthError(null)
    setAuthError(null)
  }, [authTab, setAuthError])

  // Check authentication status when user changes
  useEffect(() => {
    if (!loading && user) {
      console.log("User is authenticated, checking session eligibility")
      checkSessionEligibility()
    }
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check if user can start a new session
  const checkSessionEligibility = async () => {
    if (!user) return

    try {
      console.log("Checking if user can start a session")
      const { canStart, error, nextSessionDate } = await canStartNewSession(user.uid)

      if (canStart) {
        console.log("User can start a session, showing ad")
        setShowAd(true)
      } else if (error) {
        console.log("User cannot start a session:", error)
        toast({
          title: "Session Limit Reached",
          description: error,
          variant: "destructive",
        })

        if (nextSessionDate) {
          const formattedDate = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }).format(nextSessionDate)

          toast({
            title: "Next Available Session",
            description: `You can start a new session on ${formattedDate}`,
          })
        }
      }
    } catch (error) {
      console.error("Error checking session eligibility:", error)
      toast({
        title: "Error",
        description: "Failed to check session eligibility",
        variant: "destructive",
      })
    }
  }

  // Ad timer countdown
  useEffect(() => {
    if (showAd && !adCompleted) {
      console.log("Starting ad countdown")
      const timer = setInterval(() => {
        setAdTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setAdCompleted(true)
            console.log("Ad completed")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showAd, adCompleted])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalAuthError(null)
    setAuthError(null)
    setIsSubmitting(true)

    if (!email || !password) {
      setLocalAuthError("Please provide your email and password")
      setIsSubmitting(false)
      return
    }

    try {
      console.log("Attempting to sign in with email:", email)
      const { success, error } = await signIn(email, password)

      if (success) {
        console.log("Sign in successful")
        toast({
          title: "Login Successful",
          description: "Welcome back to the Recipe Assistant!",
        })
        // Auth state listener will handle the rest
      } else {
        console.error("Sign in failed:", error)
        setLocalAuthError(error)
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      setLocalAuthError(error.message || "An unexpected error occurred")
    }

    setIsSubmitting(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalAuthError(null)
    setAuthError(null)
    setIsSubmitting(true)

    if (!email || !password) {
      setLocalAuthError("Please provide your email and password")
      setIsSubmitting(false)
      return
    }

    if (!acceptTerms) {
      setLocalAuthError("Please accept the terms to continue")
      setIsSubmitting(false)
      return
    }

    try {
      console.log("Attempting to register with email:", email)
      const { success, error } = await registerUser(email, password)

      if (success) {
        console.log("Registration successful")
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Welcome to the Recipe Assistant!",
        })
        // Auth state listener will handle the rest
      } else {
        console.error("Registration failed:", error)
        setLocalAuthError(error)
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setLocalAuthError(error.message || "An unexpected error occurred")
    }

    setIsSubmitting(false)
  }

  const handleAdComplete = async () => {
    if (user) {
      try {
        console.log("Recording session for user")
        await recordSession(user.uid)
        setIsAuthenticated(true)
        console.log("User is now authenticated and can access the app")

        // DEVELOPMENT MODE: Comment out the session timeout for free users
        /* 
        // Set session timeout (30 seconds for free users)
        if (userData && !userData.isPremium) {
          setTimeout(() => {
            toast({
              title: "Session Expired",
              description: "Your free session has expired. Please come back next week for another session.",
              variant: "destructive",
            })
            setIsAuthenticated(false)
            console.log("Free session expired")
          }, 30 * 1000)
        }
        */
      } catch (error) {
        console.error("Error recording session:", error)
        toast({
          title: "Error",
          description: "Failed to start your session",
          variant: "destructive",
        })
      }
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
            <CardTitle className="text-center mt-4">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // If authenticated, show the app
  if (isAuthenticated) {
    return <>{children}</>
  }

  // If user is logged in but hasn't seen the ad yet
  if (user && showAd) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Quick Sponsor Message</CardTitle>
            <CardDescription className="text-center">
              Your recipe assistant will be ready in {adTimer} seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-full aspect-video bg-slate-100 rounded-md flex items-center justify-center mb-4">
              <img src="/vibrant-meal-prep.png" alt="Sponsor advertisement" className="rounded-md" />
            </div>
            {adCompleted && (
              <Button onClick={handleAdComplete} className="w-full">
                Continue to Recipe Assistant
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not authenticated, show login/register form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <ChefHat size={40} className="text-emerald-500" />
          </div>
          <CardTitle className="text-center">Smart Recipe Assistant</CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account to access our AI-powered recipe assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(localAuthError || authError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localAuthError || authError}</AlertDescription>
            </Alert>
          )}

          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="email-login">Email</Label>
                    <div className="flex">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-login"
                          placeholder="your@email.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="password-login">Password</Label>
                    <div className="flex">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password-login"
                          placeholder="••••••••"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="email-register">Email</Label>
                    <div className="flex">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-register"
                          placeholder="your@email.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="password-register">Password</Label>
                    <div className="flex">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password-register"
                          placeholder="••••••••"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Password must be at least 6 characters</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to receive recipe recommendations and offers
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-xs text-muted-foreground">
          <p>Free users are limited to 30-second sessions, once per week.</p>
          <p className="mt-1">Upgrade for unlimited access and premium features.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
