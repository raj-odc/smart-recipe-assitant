"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, Clock, DollarSign, Utensils, Users, ShoppingBag, Mail, Download } from "lucide-react"
import type { Recipe } from "@/components/recipe-assistant"

interface RecipeDetailsProps {
  recipe: Recipe
  onBack: () => void
}

export function RecipeDetails({ recipe, onBack }: RecipeDetailsProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([])

  const toggleIngredient = (ingredient: string) => {
    if (checkedIngredients.includes(ingredient)) {
      setCheckedIngredients(checkedIngredients.filter((item) => item !== ingredient))
    } else {
      setCheckedIngredients([...checkedIngredients, ingredient])
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white p-4">
        <div className="container flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">{recipe.name}</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container py-6 space-y-6">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <img src={recipe.image || "/placeholder.svg"} alt={recipe.name} className="object-cover w-full h-full" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            <p className="text-muted-foreground mt-1">{recipe.description}</p>

            <div className="flex flex-wrap gap-2 mt-3">
              {recipe.dietaryTags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mb-1 text-muted-foreground" />
              <span className="text-sm font-medium">Prep</span>
              <span className="text-sm">{recipe.prepTime} min</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <Utensils className="h-5 w-5 mb-1 text-muted-foreground" />
              <span className="text-sm font-medium">Cook</span>
              <span className="text-sm">{recipe.cookTime} min</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 mb-1 text-muted-foreground" />
              <span className="text-sm font-medium">Serves</span>
              <span className="text-sm">{recipe.servings}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <DollarSign className="h-5 w-5 mb-1 text-muted-foreground" />
              <span className="text-sm font-medium">Cost</span>
              <span className="text-sm">${recipe.estimatedCost}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={checkedIngredients.includes(ingredient.name)}
                    onCheckedChange={() => toggleIngredient(ingredient.name)}
                  />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className={`text-sm ${checkedIngredients.includes(ingredient.name) ? "line-through text-muted-foreground" : ""}`}
                  >
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-3">Instructions</h2>
            <ol className="space-y-3 list-decimal list-inside">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="text-sm">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-3">Nutrition Facts</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Calories</p>
                <p className="text-lg">{recipe.nutritionFacts.calories}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Protein</p>
                <p className="text-lg">{recipe.nutritionFacts.protein}g</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Carbs</p>
                <p className="text-lg">{recipe.nutritionFacts.carbs}g</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Fat</p>
                <p className="text-lg">{recipe.nutritionFacts.fat}g</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Recipe
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
