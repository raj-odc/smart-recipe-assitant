import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  limit,
  orderBy,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Recipe } from "@/components/recipe-assistant"

// Get all recipes
export const getAllRecipes = async () => {
  try {
    const recipesSnapshot = await getDocs(collection(db, "recipes"))
    const recipes: Recipe[] = []

    recipesSnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() } as Recipe)
    })

    return { success: true, recipes }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get recipes by dietary tags
export const getRecipesByDietaryTags = async (tags: string[]) => {
  try {
    const recipesRef = collection(db, "recipes")
    const q = query(recipesRef, where("dietaryTags", "array-contains-any", tags))
    const recipesSnapshot = await getDocs(q)

    const recipes: Recipe[] = []
    recipesSnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() } as Recipe)
    })

    return { success: true, recipes }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get recipe by ID
export const getRecipeById = async (recipeId: string) => {
  try {
    const recipeDoc = await getDoc(doc(db, "recipes", recipeId))

    if (recipeDoc.exists()) {
      return { success: true, recipe: { id: recipeDoc.id, ...recipeDoc.data() } as Recipe }
    } else {
      return { success: false, error: "Recipe not found" }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Add a new recipe
export const addRecipe = async (recipe: Omit<Recipe, "id">) => {
  try {
    const newRecipeRef = doc(collection(db, "recipes"))
    await setDoc(newRecipeRef, {
      ...recipe,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { success: true, recipeId: newRecipeRef.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update a recipe
export const updateRecipe = async (recipeId: string, recipeData: Partial<Recipe>) => {
  try {
    await updateDoc(doc(db, "recipes", recipeId), {
      ...recipeData,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete a recipe
export const deleteRecipe = async (recipeId: string) => {
  try {
    await deleteDoc(doc(db, "recipes", recipeId))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get featured recipes
export const getFeaturedRecipes = async (count = 3) => {
  try {
    const recipesRef = collection(db, "recipes")
    const q = query(recipesRef, orderBy("createdAt", "desc"), limit(count))
    const recipesSnapshot = await getDocs(q)

    const recipes: Recipe[] = []
    recipesSnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() } as Recipe)
    })

    return { success: true, recipes }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
