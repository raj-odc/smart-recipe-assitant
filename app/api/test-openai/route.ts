import { OpenAI } from "openai"

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI API key is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // For development, we can bypass the actual API call and return success
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Bypassing actual OpenAI API call")
      return new Response(
        JSON.stringify({
          success: true,
          message: "OpenAI API key verification bypassed in development mode",
          response: { content: "Development mode response" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Create an OpenAI API client with the dangerouslyAllowBrowser flag
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    })

    try {
      // Make a simple request to verify the API key
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      })

      // Safely check if the response has the expected structure
      const hasValidResponse =
        response &&
        response.choices &&
        Array.isArray(response.choices) &&
        response.choices.length > 0 &&
        response.choices[0].message &&
        typeof response.choices[0].message.content === "string"

      if (hasValidResponse) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "OpenAI API key is valid",
            response: {
              content: response.choices[0].message.content,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      } else {
        // Handle case where response is valid but doesn't have expected structure
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unexpected response format from OpenAI API",
            details: { responseStructure: JSON.stringify(response).substring(0, 100) + "..." },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    } catch (apiError: any) {
      // Handle OpenAI API specific errors
      console.error("OpenAI API call error:", apiError)

      let errorMessage = "Failed to connect to OpenAI API"
      let statusCode = 500

      if (apiError.status === 401) {
        errorMessage = "Invalid OpenAI API key"
        statusCode = 401
      } else if (apiError.status === 429) {
        errorMessage = "OpenAI API rate limit exceeded"
        statusCode = 429
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: {
            status: apiError.status,
            message: apiError.message,
          },
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    // Handle any other unexpected errors
    console.error("Unexpected error in test-openai route:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred during API key verification",
        details: {
          message: error.message || "Unknown error",
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
