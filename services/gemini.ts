
import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceMetadata } from "../types";

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeInvoicePage = async (
  base64Image: string, 
  retries = 3, 
  onRetry?: (attempt: number) => void
): Promise<InvoiceMetadata> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image,
              },
            },
            {
              text: "Extract data from this Logistics/Warehouse Invoice. I need the main Invoice/Packing List Number and the exact Company Name mentioned in 'SHIP TO' section.",
            }
          ],
        },
        config: {
          responseMimeType: "application/json",
          // Configuring a responseSchema is the recommended way to extract structured JSON.
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              invoiceNo: {
                type: Type.STRING,
                description: 'The unique identification number of the invoice or packing slip.',
              },
              shipTo: {
                type: Type.STRING,
                description: 'The full name of the company or entity in the delivery destination (Ship To) area.',
              },
            },
            propertyOrdering: ["invoiceNo", "shipTo"],
          },
          // Reduced budget for Flash model as it is highly efficient for structured extraction.
          thinkingConfig: { thinkingBudget: 1000 },
        },
      });

      // The simplest and most direct way to get the generated text content is by accessing the .text property.
      const resultText = response.text || "{}";
      return JSON.parse(resultText) as InvoiceMetadata;
    } catch (e: any) {
      const isRateLimit = e.message?.includes('429') || e.status === 429;
      
      if (isRateLimit && attempt < retries - 1) {
        // Implement robust handling for API errors with exponential backoff.
        const waitTime = Math.pow(2, attempt) * 2000;
        if (onRetry) onRetry(attempt + 1);
        await sleep(waitTime);
        continue;
      }
      
      console.error("Gemini Flash Analysis Error:", e);
      return { invoiceNo: null, shipTo: null };
    }
  }
  return { invoiceNo: null, shipTo: null };
};
