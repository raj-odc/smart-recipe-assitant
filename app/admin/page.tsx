"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChefHat, Upload, PlusCircle, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAllRecipes, deleteRecipe } from "@/lib/recipe-service"
import type { Recipe } from "@/components/recipe-assistant"

export default function AdminPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    avgSessionTime: 0,
    recipesGenerated: 0,
  })
  const [loading, setLoading] = useState(true)
  const [freemiumSettings, setFreemiumSettings] = useState({
    sessionTime: 30,
    sessionFrequency: 7,
    adDuration: 15,
    requireEmail: true,
    showAd: true,
    pdfExport: false,
    emailPlan: false,
    photoUpload: false,
  })
  const { toast } = useToast()

  // Load data on initial render
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Load recipes
      const { success: recipesSuccess, recipes: recipeData } = await getAllRecipes()
      if (recipesSuccess && recipeData) {
        setRecipes(recipeData)
      }

      // Load users
      try {
        const usersRef = collection(db, "users")
        const usersQuery = query(usersRef, orderBy("lastSession", "desc"), limit(5))
        const usersSnapshot = await getDocs(usersQuery)

        const userData: any[] = []
        usersSnapshot.forEach((doc) => {
          userData.push({ id: doc.id, ...doc.data() })
        })

        setUsers(userData)

        // Calculate stats
        const totalUsers = (await getDocs(collection(db, "users"))).size
        const premiumUsers = (await getDocs(query(collection(db, "users"), where("isPremium", "==", true)))).size

        // Get average session time (mock data for now)
        const avgSessionTime = 4.2

        // Get total recipes
        const recipesGenerated = (await getDocs(collection(db, "recipes"))).size

        setStats({
          totalUsers,
          premiumUsers,
          avgSessionTime,
          recipesGenerated,
        })
      } catch (error) {
        console.error("Error loading users:", error)
      }

      // Load freemium settings
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "freemium"))
        if (settingsDoc.exists()) {
          setFreemiumSettings(settingsDoc.data() as any)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const handleSaveSettings = async () => {
    try {
      await updateDoc(doc(db, "settings", "freemium"), freemiumSettings)

      toast({
        title: "Settings Saved",
        description: "Freemium settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error Saving Settings",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    const { success, error } = await deleteRecipe(recipeId)

    if (success) {
      setRecipes(recipes.filter((recipe) => recipe.id !== recipeId))

      toast({
        title: "Recipe Deleted",
        description: "The recipe has been deleted successfully.",
      })
    } else {
      toast({
        title: "Error Deleting Recipe",
        description: error,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-emerald-500" />
            <h1 className="text-xl font-bold">Recipe Assistant Admin</h1>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue="freemium">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="freemium">Freemium Settings</TabsTrigger>
            <TabsTrigger value="recipes">Recipe Database</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="freemium">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Freemium Access Settings</CardTitle>
                  <CardDescription>Configure access limitations for free users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="session-time">Session Time Limit</Label>
                      <span className="text-sm">{freemiumSettings.sessionTime} seconds</span>
                    </div>
                    <Slider
                      id="session-time"
                      value={[freemiumSettings.sessionTime]}
                      onValueChange={(value) => setFreemiumSettings({ ...freemiumSettings, sessionTime: value[0] })}
                      max={120}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum time a free user can use the assistant per session
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="session-frequency">Session Frequency</Label>
                      <span className="text-sm">{freemiumSettings.sessionFrequency} days</span>
                    </div>
                    <Slider
                      id="session-frequency"
                      value={[freemiumSettings.sessionFrequency]}
                      onValueChange={(value) =>
                        setFreemiumSettings({ ...freemiumSettings, sessionFrequency: value[0] })
                      }
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Number of days between allowed free sessions</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ad-duration">Advertisement Duration</Label>
                      <span className="text-sm">{freemiumSettings.adDuration} seconds</span>
                    </div>
                    <Slider
                      id="ad-duration"
                      value={[freemiumSettings.adDuration]}
                      onValueChange={(value) => setFreemiumSettings({ ...freemiumSettings, adDuration: value[0] })}
                      max={60}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">Duration of pre-session advertisement</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require-email"
                      checked={freemiumSettings.requireEmail}
                      onCheckedChange={(checked) => setFreemiumSettings({ ...freemiumSettings, requireEmail: checked })}
                    />
                    <Label htmlFor="require-email">Require Email Capture</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-ad"
                      checked={freemiumSettings.showAd}
                      onCheckedChange={(checked) => setFreemiumSettings({ ...freemiumSettings, showAd: checked })}
                    />
                    <Label htmlFor="show-ad">Show Pre-Session Advertisement</Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Premium Features</CardTitle>
                  <CardDescription>Configure which features are available to free vs. premium users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pdf-export">PDF Export</Label>
                        <Switch
                          id="pdf-export"
                          checked={freemiumSettings.pdfExport}
                          onCheckedChange={(checked) =>
                            setFreemiumSettings({ ...freemiumSettings, pdfExport: checked })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Allow free users to export meal plans as PDF</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-plan">Email Plan</Label>
                        <Switch
                          id="email-plan"
                          checked={freemiumSettings.emailPlan}
                          onCheckedChange={(checked) =>
                            setFreemiumSettings({ ...freemiumSettings, emailPlan: checked })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Allow free users to email meal plans</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="photo-upload">Photo Upload</Label>
                        <Switch
                          id="photo-upload"
                          checked={freemiumSettings.photoUpload}
                          onCheckedChange={(checked) =>
                            setFreemiumSettings({ ...freemiumSettings, photoUpload: checked })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Allow free users to upload pantry photos</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Feature Settings</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recipes">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recipe Database</CardTitle>
                      <CardDescription>Manage recipes available to the assistant</CardDescription>
                    </div>
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Recipe
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search recipes..." className="pl-10" />
                    </div>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipe Name</TableHead>
                        <TableHead>Dietary Tags</TableHead>
                        <TableHead>Cook Time</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipes.map((recipe) => (
                        <TableRow key={recipe.id}>
                          <TableCell className="font-medium">{recipe.name}</TableCell>
                          <TableCell>{recipe.dietaryTags.join(", ")}</TableCell>
                          <TableCell>{recipe.prepTime + recipe.cookTime} min</TableCell>
                          <TableCell>${recipe.estimatedCost}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteRecipe(recipe.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid gap-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.premiumUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% conversion
                      rate
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgSessionTime} min</div>
                    <p className="text-xs text-muted-foreground">Premium: 8.7 min</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Recipes Generated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.recipesGenerated}</div>
                    <p className="text-xs text-muted-foreground">+24% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                  <CardDescription>Latest user interactions with the recipe assistant</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Recipes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.isPremium
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }
                            >
                              {user.isPremium ? "Premium" : "Free"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastSession ? new Date(user.lastSession.seconds * 1000).toLocaleString() : "Never"}
                          </TableCell>
                          <TableCell>{user.sessionCount || 0}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No user data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
