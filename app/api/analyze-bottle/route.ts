import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    // Remove data URL prefix to get base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "")

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            object: {
              type: "string",
            },
            size: {
              type: "number",
            },
          },
        },
      },
    })

    const prompt = `if its a plastic bottle mineral water, i want you to measure this plastic bottle mineral water size in ml, if it something else, then stop and there is a message "Jangan masukkan {object}, hanya botol mineral plastik". If its plastic bottle mineral water, just respon with "Botol Plastik Air Mineral" {size}`

    const result = await model.generateContent([
      {
        text: prompt,
      },
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ])

    const response = await result.response
    const text = response.text()
    const parsedResult = JSON.parse(text)

    return NextResponse.json(parsedResult)
  } catch (error) {
    console.error("Error analyzing bottle:", error)
    return NextResponse.json({ error: "Failed to analyze bottle" }, { status: 500 })
  }
}
