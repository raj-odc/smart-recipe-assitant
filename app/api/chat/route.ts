import { OpenAI } from "openai"
import { StreamingTextResponse, OpenAIStream } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  // System message to guide the AI's behavior
  const systemMessage = `
    You are a Smart Recipe Assistant embedded in a Shopify store. Your goal is to help users plan meals based on their dietary preferences, pantry items, and budget.
    
    When suggesting recipes:
    1. Consider dietary restrictions and preferences
    2. Use ingredients the user already has when possible
    3. Suggest budget-friendly options
    4. Keep cooking time reasonable
    
    If the user asks for recipe suggestions, respond with a message that includes the phrase "Here are some recipe suggestions" so the UI can display recipe cards.
    
    Keep responses friendly, concise, and focused on helping the user find the perfect recipes.
  `

  // Request the OpenAI API for the response
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [{ role: "system", content: systemMessage }, ...messages],
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)

  // Respond with the stream
  return new StreamingTextResponse(stream)
}
