import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// API routes go here FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
});

// OCR Endpoint
app.post("/api/ocr", async (req, res) => {
  try {
    const { image } = req.body; // Expecting base64 string without data:image/... prefix

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
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

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port 3000 and host 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  start();
}
