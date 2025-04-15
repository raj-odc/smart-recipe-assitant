"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { Send, ChefHat, Camera, Mail, Download, Loader2, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { signOut } from "@/lib/auth-service"
import { getFeaturedRecipes, getRecipesByDietaryTags } from "@/lib/recipe-service"

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile()
  const { user, userData } = useAuth()

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content:
          "👋 Hi there! I'm your Smart Recipe Assistant. I can help you plan meals based on your dietary preferences, pantry items, and budget. What kind of recipes are you looking for today?",
      },
    ],
  })

  // Load featured recipes on initial load
  useEffect(() => {
    const loadFeaturedRecipes = async () => {
      setLoading(true)
      const { success, recipes: featuredRecipes, error } = await getFeaturedRecipes(3)

      if (success && featuredRecipes) {
        setRecipes(featuredRecipes)
      } else if (error) {
        console.error("Error loading featured recipes:", error)
      }

      setLoading(false)
    }

    loadFeaturedRecipes()
  }, [])

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
          setLoading(false)
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
                              ) : (
                                recipes.map((recipe) => (
                                  <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onClick={() => handleRecipeClick(recipe)}
                                  />
                                ))
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
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about recipes, meal plans, or dietary needs..."
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
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
                    {userData && !userData.isPremium && (
                      <div className="text-xs text-muted-foreground">Free session: 30 seconds remaining</div>
                    )}
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
