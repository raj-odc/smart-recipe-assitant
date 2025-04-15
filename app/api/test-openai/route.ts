import { OpenAI } from "openai"

export async function GET() {
  try {
    // Create an OpenAI API client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Make a simple request to verify the API key
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, are you working?" }],
      max_tokens: 10,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "OpenAI API key is valid",
        response: response.choices[0].message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("OpenAI API test error:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to connect to OpenAI API",
        details: error,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
