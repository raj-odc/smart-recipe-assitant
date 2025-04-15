"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Camera, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getUserPreferences,
  saveUserPreferences,
  type UserPreferences as UserPreferencesType,
} from "@/lib/user-preferences-service"
import { useToast } from "@/hooks/use-toast"

interface UserPreferencesProps {
  onClose: () => void
}

export function UserPreferences({ onClose }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferencesType>({
    dietaryTags: [],
    pantryItems: [],
    kitchenTools: [],
    cookingTime: 30,
    budget: 25,
    useWeeklySpecials: false,
  })
  const [newPantryItem, setNewPantryItem] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Keto",
    "Paleo",
    "Low-Carb",
    "High-Protein",
    "Nut-Free",
    "Pescatarian",
  ]

  const kitchenTools = [
    "Oven",
    "Stovetop",
    "Microwave",
    "Blender",
    "Food Processor",
    "Slow Cooker",
    "Pressure Cooker",
    "Air Fryer",
    "Grill",
  ]

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        setLoading(true)
        const { success, preferences: userPreferences, error } = await getUserPreferences(user.uid)

        if (success && userPreferences) {
          setPreferences(userPreferences)
        } else if (error) {
          toast({
            title: "Error Loading Preferences",
            description: error,
            variant: "destructive",
          })
        }

        setLoading(false)
      }
    }

    loadPreferences()
  }, [user, toast])

  const handleAddPantryItem = () => {
    if (newPantryItem.trim() && !preferences.pantryItems.includes(newPantryItem.trim())) {
      setPreferences({
        ...preferences,
        pantryItems: [...preferences.pantryItems, newPantryItem.trim()],
      })
      setNewPantryItem("")
    }
  }

  const handleRemovePantryItem = (item: string) => {
    setPreferences({
      ...preferences,
      pantryItems: preferences.pantryItems.filter((i) => i !== item),
    })
  }

  const toggleDietaryTag = (tag: string) => {
    if (preferences.dietaryTags.includes(tag)) {
      setPreferences({
        ...preferences,
        dietaryTags: preferences.dietaryTags.filter((t) => t !== tag),
      })
    } else {
      setPreferences({
        ...preferences,
        dietaryTags: [...preferences.dietaryTags, tag],
      })
    }
  }

  const toggleKitchenTool = (tool: string) => {
    if (preferences.kitchenTools.includes(tool)) {
      setPreferences({
        ...preferences,
        kitchenTools: preferences.kitchenTools.filter((t) => t !== tool),
      })
    } else {
      setPreferences({
        ...preferences,
        kitchenTools: [...preferences.kitchenTools, tool],
      })
    }
  }

  const handleSavePreferences = async () => {
    if (user) {
      setSaving(true)
      const { success, error } = await saveUserPreferences(user.uid, preferences)

      if (success) {
        toast({
          title: "Preferences Saved",
          description: "Your preferences have been saved successfully.",
        })
        onClose()
      } else {
        toast({
          title: "Error Saving Preferences",
          description: error,
          variant: "destructive",
        })
      }

      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="mt-2 text-sm text-muted-foreground">Loading preferences...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">My Preferences</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Dietary Preferences</h3>
            <div className="grid grid-cols-2 gap-2">
              {dietaryOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`diet-${option}`}
                    checked={preferences.dietaryTags.includes(option)}
                    onCheckedChange={() => toggleDietaryTag(option)}
                  />
                  <label
                    htmlFor={`diet-${option}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Pantry Items</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add ingredient..."
                value={newPantryItem}
                onChange={(e) => setNewPantryItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddPantryItem()
                  }
                }}
              />
              <Button variant="outline" size="icon" onClick={handleAddPantryItem}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {preferences.pantryItems.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1">
                  {item}
                  <button
                    onClick={() => handleRemovePantryItem(item)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {preferences.pantryItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No pantry items added yet.</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Kitchen Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {kitchenTools.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tool-${tool}`}
                    checked={preferences.kitchenTools.includes(tool)}
                    onCheckedChange={() => toggleKitchenTool(tool)}
                  />
                  <label
                    htmlFor={`tool-${tool}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tool}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Maximum Cooking Time</h3>
              <span className="text-sm">{preferences.cookingTime} minutes</span>
            </div>
            <Slider
              value={[preferences.cookingTime]}
              onValueChange={(value) => setPreferences({ ...preferences, cookingTime: value[0] })}
              max={120}
              step={5}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Budget per Meal</h3>
              <span className="text-sm">${preferences.budget}</span>
            </div>
            <Slider
              value={[preferences.budget]}
              onValueChange={(value) => setPreferences({ ...preferences, budget: value[0] })}
              max={50}
              step={1}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Weekly Specials</h3>
              <Switch
                id="weekly-specials"
                checked={preferences.useWeeklySpecials}
                onCheckedChange={(checked) => setPreferences({ ...preferences, useWeeklySpecials: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Include weekly specials from local grocery stores in your recipe suggestions.
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button className="w-full" onClick={handleSavePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  )
}
