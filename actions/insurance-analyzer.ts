"use server"

import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { CategoryWithSubcategories } from "@/types/insurance"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"
import { ParsedPolicy } from "@/components/policy-context"
import { generateObjectWithAIRetry } from "@/lib/ai-retry"

export async function generateCategories(
  query: string,
  context: {
    isInNetwork: boolean
    deductibleSpent: number
    outOfPocketSpent: number
  },
  policy: ParsedPolicy
): Promise<CategoryWithSubcategories[]> {
  try {
    console.log("query", query)
    console.log("context", context)
    console.log("policy", policy)
    
    const result = await generateObjectWithAIRetry({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      system: `You are a health insurance expert. Generate relevant insurance categories based on treatments, medications, or procedures for the user's query.
      Query: ${query}

      Be Creative. Always return at least 4-10 categories.

      For Example:
      - Query: "Primary Care Visits"
      - Categories: "Primary Care Visits", "Annual Physicals", "Wellness Visits", "Preventive Care", "Routine Checkups"

      Don't return categories that are generic and aren't subcategories to the query.

      Diabetes Medications should return insulin, etc.

      Score guidelines:
      - A: Excellent coverage (80-100% covered)
      - B: Good coverage (60-80% covered)
      - C: Fair coverage (40-60% covered)
      - D: Poor coverage (20-40% covered)
      - F: Very poor or no coverage (0-20% covered)
      
      Consider the context: ${context.isInNetwork ? "In-Network" : "Out-of-Network"}, 
      Deductible spent: $${context.deductibleSpent}, Out-of-pocket spent: $${context.outOfPocketSpent}
      
      Policy: ${JSON.stringify(policy)}`,
      messages: [
        {
          role: "user",
          content: `Generate insurance categories relevant to: "${query}". If the query is empty, return general health insurance categories.`,
        },
      ],
      schema: z.object({
        categories: z.array(z.object({
          name: z.string(),
          score: z.enum(["A", "B", "C", "D", "F", 'N/A']),
          description: z.string(),
        })),
      }),
    })

    return result.categories;
  } catch (error) {
    console.error("Error generating categories:", error)
    // Return default categories on error
    return []
  }
}
export async function generateSituations(
  query: string,
  context: {
    isInNetwork: boolean
    currentCategory?: string
  },
  policy: ParsedPolicy
): Promise<string[]> {
  try {
    const result = await generateObjectWithAIRetry({
      model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
      system: `You are a health insurance expert. Generate common healthcare situations or questions that users might have.
      Return a JSON array of 5 relevant situation strings.

      ${context.currentCategory ? `Focus on situations related to ${context.currentCategory}.` : ""}
      
      Policy: ${JSON.stringify(policy)}`,
      messages: [
        {
          role: "user",
          content: `Generate common situations or questions related to: "${query}"`,
        },
      ],
      schema: z.object({
        situations: z.array(z.string()),
      }),
    })

    return result.situations;
  } catch (error) {
    console.error("Error generating situations:", error)
    // Return default situations
    return [
      "What if I need an MRI?",
      "Emergency room visit costs",
      "Monthly prescription expenses",
      "Specialist consultation fees",
      "Preventive care coverage",
    ]
  }
}

export async function analyzeSituation(
  situation: string,
  context: {
    isInNetwork: boolean
    deductibleSpent: number
    outOfPocketSpent: number
    deductibleLimit: number
    outOfPocketLimit: number
  },
): Promise<{
  estimatedCost: number
  coverageDetails: string
  recommendations: string[]
}> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a health insurance expert. Analyze the given healthcare situation and provide cost estimates and coverage details.
      Return a JSON object with:
      {
        "estimatedCost": number (estimated out-of-pocket cost),
        "coverageDetails": string (explanation of coverage),
        "recommendations": string[] (array of 2-3 recommendations)
      }
      
      Context:
      - Network: ${context.isInNetwork ? "In-Network" : "Out-of-Network"}
      - Deductible: $${context.deductibleSpent} spent of $${context.deductibleLimit}
      - Out-of-pocket: $${context.outOfPocketSpent} spent of $${context.outOfPocketLimit}`,
      prompt: `Analyze this healthcare situation: "${situation}"`,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Error analyzing situation:", error)
    return {
      estimatedCost: 0,
      coverageDetails: "Unable to analyze situation at this time.",
      recommendations: ["Contact your insurance provider for specific details"],
    }
  }
}
