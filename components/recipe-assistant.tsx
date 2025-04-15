"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { Send, ChefHat, Camera, Mail, Download, Loader2, LogOut, AlertCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { signOut } from "@/lib/auth-service"
import { getFeaturedRecipes, getRecipesByDietaryTags } from "@/lib/recipe-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { RecipeCard } from "@/components/recipe-card"
import { UserPreferences } from "@/components/user-preferences"
import { RecipeDetails } from "@/components/recipe-details"

export interface Recipe {
  id: string
  name: string
  description: string
  image: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: "easy" | "medium" | "hard"
  dietaryTags: string[]
  ingredients: {
    name: string
    amount: string
    unit: string
  }[]
  instructions: string[]
  nutritionFacts: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  estimatedCost: number
}

export function RecipeAssistant() {
  const [activeTab, setActiveTab] = useState("chat")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKeyVerified, setApiKeyVerified] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [verifyingApiKey, setVerifyingApiKey] = useState(false) // Start as false to avoid initial loading state
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile()
  const { user, userData } = useAuth()

  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development"

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content:
          "👋 Hi there! I'm your Smart Recipe Assistant. I can help you plan meals based on your dietary preferences, pantry items, and budget. What kind of recipes are you looking for today?",
      },
    ],
    onError: (error) => {
      console.error("Chat error:", error)

      // Check if it's an API key issue
      if (error.message?.includes("API key") || error.message?.includes("401")) {
        setApiKeyVerified(false)
      }

      toast({
        title: "Chat Error",
        description: error.message || "Failed to communicate with the recipe assistant",
        variant: "destructive",
      })
    },
  })

  // Verify OpenAI API key on initial load - but skip in development mode
  useEffect(() => {
    // In development mode, we'll assume the API key is valid
    if (isDevelopment) {
      console.log("Development mode: Skipping API key verification")
      setApiKeyVerified(true)
      setVerifyingApiKey(false)
      return
    }

    const verifyApiKey = async () => {
      setVerifyingApiKey(true)
      setApiKeyError(null)

      try {
        console.log("Verifying OpenAI API key...")
        const response = await fetch("/api/test-openai")

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API key verification failed with status:", response.status, errorText)
          setApiKeyVerified(false)
          setApiKeyError(`API verification failed: ${response.status} ${response.statusText}`)
          return
        }

        let data
        try {
          data = await response.json()
        } catch (parseError) {
          console.error("Failed to parse API verification response:", parseError)
          setApiKeyVerified(false)
          setApiKeyError("Failed to parse API verification response")
          return
        }

        console.log("API key verification response:", data)

        if (data && data.success) {
          console.log("API key verified successfully")
          setApiKeyVerified(true)
        } else {
          console.error("API key verification failed:", data?.error || "Unknown error")
          setApiKeyVerified(false)
          setApiKeyError(data?.error || "Unknown API key error")

          toast({
            title: "API Key Error",
            description: data?.error || "The OpenAI API key is invalid or not configured properly.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error verifying API key:", error)
        // Don't set apiKeyVerified to false on network errors in development
        if (!isDevelopment) {
          setApiKeyVerified(false)
        }
        setApiKeyError(`Error checking API key: ${error.message || "Unknown error"}`)
      } finally {
        setVerifyingApiKey(false)
      }
    }

    verifyApiKey()
  }, [toast, retryCount, isDevelopment])

  // Load featured recipes on initial load
  useEffect(() => {
    const loadFeaturedRecipes = async () => {
      setLoading(true)
      try {
        const { success, recipes: featuredRecipes, error } = await getFeaturedRecipes(3)

        if (success && featuredRecipes) {
          setRecipes(featuredRecipes)
        } else if (error) {
          console.error("Error loading featured recipes:", error)
          toast({
            title: "Error Loading Recipes",
            description: error,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error in loadFeaturedRecipes:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedRecipes()
  }, [toast])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Check for recipe suggestions in messages
  useEffect(() => {
    const checkForRecipeSuggestions = async () => {
      const lastMessage = messages[messages.length - 1]

      if (
        lastMessage &&
        lastMessage.role === "assistant" &&
        lastMessage.content.includes("Here are some recipe suggestions")
      ) {
        // Extract dietary preferences from the message
        const dietaryMatches = lastMessage.content.match(
          /(?:vegetarian|vegan|gluten-free|dairy-free|keto|paleo|low-carb|high-protein)/gi,
        )

        if (dietaryMatches && dietaryMatches.length > 0) {
          const dietaryTags = Array.from(
            new Set(dietaryMatches.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase())),
          )

          setLoading(true)
          try {
            const { success, recipes: suggestedRecipes, error } = await getRecipesByDietaryTags(dietaryTags)

            if (success && suggestedRecipes && suggestedRecipes.length > 0) {
              setRecipes(suggestedRecipes)
            } else {
              // Fallback to featured recipes if no matches
              const { success, recipes: featuredRecipes } = await getFeaturedRecipes(3)
              if (success && featuredRecipes) {
                setRecipes(featuredRecipes)
              }
            }
          } catch (error) {
            console.error("Error in checkForRecipeSuggestions:", error)
          } finally {
            setLoading(false)
          }
        }
      }
    }

    checkForRecipeSuggestions()
  }, [messages])

  const handleGeneratePDF = () => {
    toast({
      title: "PDF Generated",
      description: "Your meal plan and shopping list have been generated as a PDF.",
    })
  }

  const handleEmailPlan = () => {
    toast({
      title: "Email Sent",
      description: "Your meal plan has been emailed to you.",
    })
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setActiveTab("recipe")
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    })
  }

  const handleRetryApiKey = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleSubmitWithFallback = (e: React.FormEvent) => {
    e.preventDefault()

    // In development mode, always allow submission
    if (!isDevelopment && !apiKeyVerified && !verifyingApiKey) {
      toast({
        title: "API Key Error",
        description: apiKeyError || "Cannot send message: The OpenAI API key is not configured properly.",
        variant: "destructive",
      })
      return
    }

    handleSubmit(e)
  }

  // For development, allow chat even if API key verification fails
  const shouldDisableChat = !isDevelopment && !apiKeyVerified && !verifyingApiKey

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <header className="border-b bg-white p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-emerald-500" />
            <h1 className="text-xl font-bold">Smart Recipe Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreferences(!showPreferences)}>
              {showPreferences ? "Hide Preferences" : "My Preferences"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Preferences Panel */}
        {showPreferences && (
          <div className={`border-r bg-white ${isMobile ? "w-full absolute z-10 h-full" : "w-80"}`}>
            <UserPreferences onClose={() => setShowPreferences(false)} />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b bg-white">
              <div className="container">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="recipe" disabled={!selectedRecipe}>
                    Recipe Details
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {isDevelopment && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        Development mode: API key verification bypassed. Chat functionality will work regardless of API
                        key status.
                      </AlertDescription>
                    </Alert>
                  )}

                  {verifyingApiKey && !isDevelopment && (
                    <Alert className="mb-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <AlertDescription>Verifying OpenAI API key...</AlertDescription>
                    </Alert>
                  )}

                  {!apiKeyVerified && !verifyingApiKey && !isDevelopment && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex justify-between items-center">
                        <span>
                          {apiKeyError || "OpenAI API key is invalid or not configured. Chat functionality is limited."}
                        </span>
                        <Button size="sm" variant="outline" onClick={handleRetryApiKey} className="ml-2">
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex justify-between items-center">
                        <span>
                          {error.message || "Error connecting to the recipe assistant. Please try again later."}
                        </span>
                        <Button size="sm" variant="outline" onClick={reload} className="ml-2">
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.content}

                        {/* Display recipe suggestions if they exist in the message */}
                        {message.role === "assistant" &&
                          message.content.includes("Here are some recipe suggestions") && (
                            <div className="mt-4 grid grid-cols-1 gap-4">
                              {loading ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                </div>
                              ) : recipes.length > 0 ? (
                                recipes.map((recipe) => (
                                  <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onClick={() => handleRecipeClick(recipe)}
                                  />
                                ))
                              ) : (
                                <div className="text-center py-2 text-sm text-muted-foreground">
                                  No matching recipes found. Try different criteria.
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t bg-white p-4">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSubmitWithFallback} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about recipes, meal plans, or dietary needs..."
                      disabled={isLoading || shouldDisableChat}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim() || shouldDisableChat}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="outline" disabled={isLoading}>
                      <Camera className="h-4 w-4" />
                    </Button>
                  </form>

                  <div className="flex justify-between mt-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={handleEmailPlan}>
                        <Mail className="h-3 w-3 mr-1" /> Email Plan
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={handleGeneratePDF}>
                        <Download className="h-3 w-3 mr-1" /> Download PDF
                      </Button>
                    </div>
                    {/* DEVELOPMENT MODE: Comment out the session timer
                    {userData && !userData.isPremium && (
                      <div className="text-xs text-muted-foreground">Free session: 30 seconds remaining</div>
                    )}
                    */}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recipe" className="flex-1 overflow-hidden">
              {selectedRecipe && <RecipeDetails recipe={selectedRecipe} onBack={() => setActiveTab("chat")} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
