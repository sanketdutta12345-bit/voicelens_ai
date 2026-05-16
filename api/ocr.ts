import { GoogleGenAI } from "@google/genai";
import express from "express";

// We create a fresh express app for this specific endpoint
// Vercel will handle the routing to this file
const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.post("/api/ocr", async (req: any, res: any) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: image,
          },
        },
        {
          text: "Extract all text from this image accurately. Return only the extracted text, maintaining the original order and formatting as much as possible. If no text is found, return an empty string.",
        },
      ],
    });

    const text = response.text || "";
    res.json({ text });
  } catch (error: any) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

// For local testing/AIS if needed, but primarily for Vercel
export default app;
