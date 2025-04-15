import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export interface UserPreferences {
  dietaryTags: string[]
  pantryItems: string[]
  kitchenTools: string[]
  cookingTime: number
  budget: number
  useWeeklySpecials: boolean
}

// Get user preferences
export const getUserPreferences = async (userId: string) => {
  try {
    const preferencesDoc = await getDoc(doc(db, "userPreferences", userId))

    if (preferencesDoc.exists()) {
      return { success: true, preferences: preferencesDoc.data() as UserPreferences }
    } else {
      // Return default preferences if none exist
      const defaultPreferences: UserPreferences = {
        dietaryTags: [],
        pantryItems: [],
        kitchenTools: [],
        cookingTime: 30,
        budget: 25,
        useWeeklySpecials: false,
      }

      return { success: true, preferences: defaultPreferences }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Save user preferences
export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
  try {
    await setDoc(
      doc(db, "userPreferences", userId),
      {
        ...preferences,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Add pantry item
export const addPantryItem = async (userId: string, item: string) => {
  try {
    const { preferences } = await getUserPreferences(userId)

    if (!preferences.pantryItems.includes(item)) {
      preferences.pantryItems.push(item)
      await saveUserPreferences(userId, preferences)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Remove pantry item
export const removePantryItem = async (userId: string, item: string) => {
  try {
    const { preferences } = await getUserPreferences(userId)

    preferences.pantryItems = preferences.pantryItems.filter((i) => i !== item)
    await saveUserPreferences(userId, preferences)

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
