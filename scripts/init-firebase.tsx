"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addRecipe } from "@/lib/recipe-service"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Recipe } from "@/components/recipe-assistant"

// Sample recipes data
const sampleRecipes: Omit<Recipe, "id">[] = [
  {
    name: "Mediterranean Quinoa Bowl",
    description: "A protein-packed bowl with fresh vegetables and tangy dressing.",
    image: "/vibrant-quinoa-bowl.png",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: "easy",
    dietaryTags: ["Vegetarian", "High-Protein", "Gluten-Free"],
    ingredients: [
      { name: "Quinoa", amount: "1", unit: "cup" },
      { name: "Cherry Tomatoes", amount: "1", unit: "cup" },
      { name: "Cucumber", amount: "1", unit: "medium" },
      { name: "Red Onion", amount: "1/4", unit: "cup" },
      { name: "Feta Cheese", amount: "1/2", unit: "cup" },
      { name: "Kalamata Olives", amount: "1/4", unit: "cup" },
      { name: "Olive Oil", amount: "2", unit: "tbsp" },
      { name: "Lemon Juice", amount: "1", unit: "tbsp" },
      { name: "Garlic", amount: "1", unit: "clove" },
      { name: "Salt", amount: "1/4", unit: "tsp" },
      { name: "Black Pepper", amount: "1/4", unit: "tsp" },
    ],
    instructions: [
      "Rinse quinoa under cold water and drain well.",
      "In a medium saucepan, combine quinoa with 2 cups of water. Bring to a boil, then reduce heat to low, cover, and simmer for 15 minutes until water is absorbed.",
      "While quinoa is cooking, chop tomatoes, cucumber, and red onion.",
      "In a small bowl, whisk together olive oil, lemon juice, minced garlic, salt, and pepper to make the dressing.",
      "Once quinoa is cooked, let it cool slightly, then transfer to a large bowl.",
      "Add chopped vegetables, olives, and feta cheese to the quinoa.",
      "Pour the dressing over the salad and toss gently to combine.",
      "Serve immediately or refrigerate for up to 3 days.",
    ],
    nutritionFacts: {
      calories: 420,
      protein: 15,
      carbs: 45,
      fat: 22,
    },
    estimatedCost: 12,
  },
  {
    name: "Sheet Pan Chicken & Vegetables",
    description: "An easy weeknight dinner with minimal cleanup.",
    image: "/colorful-sheet-pan-dinner.png",
    prepTime: 10,
    cookTime: 35,
    servings: 4,
    difficulty: "easy",
    dietaryTags: ["High-Protein", "Gluten-Free", "Dairy-Free"],
    ingredients: [
      { name: "Chicken Thighs", amount: "4", unit: "pieces" },
      { name: "Broccoli", amount: "1", unit: "head" },
      { name: "Bell Peppers", amount: "2", unit: "medium" },
      { name: "Red Onion", amount: "1", unit: "medium" },
      { name: "Olive Oil", amount: "3", unit: "tbsp" },
      { name: "Garlic Powder", amount: "1", unit: "tsp" },
      { name: "Paprika", amount: "1", unit: "tsp" },
      { name: "Salt", amount: "1", unit: "tsp" },
      { name: "Black Pepper", amount: "1/2", unit: "tsp" },
    ],
    instructions: [
      "Preheat oven to 425°F (220°C) and line a large baking sheet with parchment paper.",
      "Cut broccoli into florets, slice bell peppers and red onion.",
      "In a small bowl, mix olive oil, garlic powder, paprika, salt, and pepper.",
      "Place chicken thighs and vegetables on the baking sheet, keeping them separate.",
      "Drizzle the oil mixture over everything, tossing to coat evenly.",
      "Arrange in a single layer and bake for 30-35 minutes, until chicken is cooked through and vegetables are tender.",
      "Let rest for 5 minutes before serving.",
    ],
    nutritionFacts: {
      calories: 380,
      protein: 28,
      carbs: 18,
      fat: 24,
    },
    estimatedCost: 15,
  },
  {
    name: "Creamy Mushroom Pasta",
    description: "A comforting pasta dish with a rich mushroom sauce.",
    image: "/creamy-mushroom-parmesan.png",
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: "medium",
    dietaryTags: ["Vegetarian"],
    ingredients: [
      { name: "Fettuccine Pasta", amount: "8", unit: "oz" },
      { name: "Mushrooms", amount: "8", unit: "oz" },
      { name: "Garlic", amount: "3", unit: "cloves" },
      { name: "Shallot", amount: "1", unit: "medium" },
      { name: "Heavy Cream", amount: "1", unit: "cup" },
      { name: "Parmesan Cheese", amount: "1/2", unit: "cup" },
      { name: "Butter", amount: "2", unit: "tbsp" },
      { name: "Olive Oil", amount: "1", unit: "tbsp" },
      { name: "Thyme", amount: "1", unit: "tsp" },
      { name: "Salt", amount: "1/2", unit: "tsp" },
      { name: "Black Pepper", amount: "1/4", unit: "tsp" },
    ],
    instructions: [
      "Bring a large pot of salted water to a boil and cook pasta according to package directions.",
      "While pasta is cooking, slice mushrooms, mince garlic, and finely chop shallot.",
      "In a large skillet, heat olive oil and butter over medium heat.",
      "Add shallots and cook until translucent, about 2 minutes.",
      "Add garlic and cook for 30 seconds until fragrant.",
      "Add mushrooms and thyme, cooking until mushrooms are golden brown, about 5-7 minutes.",
      "Pour in heavy cream and bring to a simmer. Cook until slightly thickened, about 3-4 minutes.",
      "Stir in grated Parmesan cheese until melted and smooth.",
      "Drain pasta, reserving 1/4 cup of pasta water.",
      "Add pasta to the sauce, tossing to coat. If needed, add reserved pasta water to thin the sauce.",
      "Season with salt and pepper to taste. Serve with additional Parmesan cheese if desired.",
    ],
    nutritionFacts: {
      calories: 520,
      protein: 14,
      carbs: 48,
      fat: 32,
    },
    estimatedCost: 10,
  },
]

// Default freemium settings
const defaultFreemiumSettings = {
  sessionTime: 30,
  sessionFrequency: 7,
  adDuration: 15,
  requireEmail: true,
  showAd: true,
  pdfExport: false,
  emailPlan: false,
  photoUpload: false,
}

export default function InitFirebase() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const initializeDatabase = async () => {
    setLoading(true)
    setMessage("Initializing database...")

    try {
      // Add sample recipes
      for (const recipe of sampleRecipes) {
        await addRecipe(recipe)
      }

      // Add default freemium settings
      await setDoc(doc(db, "settings", "freemium"), defaultFreemiumSettings)

      setMessage("Database initialized successfully!")
    } catch (error: any) {
      setMessage(`Error initializing database: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Initialize Firebase Database</h1>
        <p className="mb-4 text-muted-foreground">
          This will populate your Firebase database with sample recipes and default settings.
        </p>

        <Button onClick={initializeDatabase} disabled={loading} className="w-full">
          {loading ? "Initializing..." : "Initialize Database"}
        </Button>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
