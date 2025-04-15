"use client"

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign } from "lucide-react"
import type { Recipe } from "@/components/recipe-assistant"

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="aspect-video relative">
        <img src={recipe.image || "/placeholder.svg"} alt={recipe.name} className="object-cover w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <div className="flex flex-wrap gap-1">
            {recipe.dietaryTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-base">{recipe.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{recipe.description}</CardDescription>
      </CardHeader>
      <CardFooter className="p-3 pt-0 flex justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {recipe.prepTime + recipe.cookTime} min
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3 mr-1" />
          {recipe.estimatedCost}
        </div>
      </CardFooter>
    </Card>
  )
}
