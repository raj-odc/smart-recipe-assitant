import { AuthGate } from "@/components/auth-gate"
import { RecipeAssistant } from "@/components/recipe-assistant"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <AuthGate>
        <RecipeAssistant />
      </AuthGate>
    </main>
  )
}
