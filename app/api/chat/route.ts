import { OpenAI } from "openai"
import { StreamingTextResponse, OpenAIStream } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // For development, we can provide a mock response
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using mock response for chat")

      // Extract the last user message to personalize the response
      const lastUserMessage = messages.findLast((msg) => msg.role === "user")?.content || ""

      // Create a mock response that includes "Here are some recipe suggestions"
      const mockResponse = {
        id: "mock-response",
        object: "chat.completion.chunk",
        created: Date.now(),
        model: "gpt-4o-mock",
        choices: [
          {
            index: 0,
            delta: {
              content: `I understand you're interested in ${lastUserMessage}. Here are some recipe suggestions based on your preferences. I recommend trying a vegetarian pasta dish, a quick chicken stir-fry, or a hearty bean soup. Would you like more details on any of these?`,
            },
            finish_reason: null,
          },
        ],
      }

      // Create a readable stream from the mock response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockResponse)}\n\n`))
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    // Verify API key is available and valid
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === "") {
      console.error("OpenAI API key is missing")
      return new Response(JSON.stringify({ error: "OpenAI API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create an OpenAI API client with the API key and dangerouslyAllowBrowser flag
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Add this flag to allow browser usage
    })

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

    try {
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
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Handle specific OpenAI API errors
      if (openaiError.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid OpenAI API key" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      } else if (openaiError.status === 429) {
        return new Response(JSON.stringify({ error: "OpenAI API rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        })
      } else if (openaiError.status === 500) {
        return new Response(JSON.stringify({ error: "OpenAI API server error. Please try again later." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      } else {
        return new Response(
          JSON.stringify({
            error: `OpenAI API error: ${openaiError.message || "Unknown error"}`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }
  } catch (error: any) {
    console.error("Chat API error:", error)

    return new Response(
      JSON.stringify({
        error: `Server error: ${error.message || "Unknown error"}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
