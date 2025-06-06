"use server"

import { ParsedPolicy } from "@/components/policy-context"
import { generateObjectWithAIRetry } from "@/lib/ai-retry"
import type { CategoryWithSubcategories } from "@/types/insurance"
import { groq } from "@ai-sdk/groq"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { z } from "zod"

export async function generateCategories(
  query: string,
  context: {
    isInNetwork: boolean
    deductibleSpent: number
    outOfPocketSpent: number
  },
  policy: ParsedPolicy
): Promise<{ categories: CategoryWithSubcategories[], formatted_query: string }> {
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
      
      DO NOT RETURN CATEGORIES THAT ARE GENERIC OR REDUNDANT, OR ARE NOT SUBCATEGORIES TO THE QUERY.

      Diabetes Medications should return insulin, etc.
      ADHD Medications should return adderall, ritalin, etc.
      Depression Medications should return prozac, zoloft, etc.
      Anxiety Medications should return xanax, valium, etc.
      Sleep Medications should return ambien, lunesta, etc.
      Pain Medications should return ibuprofen, naproxen, etc.
      Heartburn Medications should return prilosec, nexium, etc.
      
      Score guidelines:
      - A: Excellent coverage (80-100% covered). Insurance covers most or all costs, with minimal out-of-pocket expenses. No significant caps, limits, or exclusions. Coverage continues even for high-cost or ongoing care.
      - B: Good coverage (60-80% covered). Insurance covers a substantial portion, but you may have moderate copays, coinsurance, or some limits (e.g., visit caps, annual maximums). Coverage may stop or decrease after a certain threshold, but most typical needs are well covered.
      - C: Fair coverage (40-60% covered). Insurance pays for part of the cost, but you are responsible for significant out-of-pocket expenses. There may be notable restrictions, such as high deductibles, low annual maximums, or coverage only up to a certain dollar amount or number of visits. After reaching these limits, you may pay full price.
      - D: Poor coverage (20-40% covered). Insurance provides minimal help. Most costs are paid by you, or coverage is only for very basic needs. There may be strict caps, high copays, or many exclusions. Insurance may only pay up to a small limit, after which you are responsible for all costs.
      - F: Very poor or no coverage (0-20% covered). Insurance covers almost nothing, or only in rare circumstances. Most or all expenses are your responsibility, and there may be outright exclusions or denials for this category.
      
      When assigning a score, consider not just the percentage covered, but also whether there are annual/lifetime maximums, visit or dollar caps, high deductibles, coinsurance, or situations where insurance stops paying after a certain point. Be specific in the description about any such limitations, partial coverage, or when the patient would be responsible for the full cost.
      
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
        formatted_query: z.string(),
        categories: z.array(z.object({
          name: z.string().describe("The name of the category. Avoid including the words 'in-network' or 'out-of-network' in the name."),
          score: z.enum(["A", "B", "C", "D", "F", 'N/A']),
          description: z.string(),
          out_of_pocket_costs: z.array(z.object({
            situation: z.string(),
            cost: z.number().describe("approximate cost the insured will have to pay in the situation that belongs to the category"),
            cost_frequency: z.string().describe("how often the cost occurs, per visit, per procedure, per refill, etc."),
            extra_details: z.string().describe("extra details about the cost such as up to 5 times, up to x $, etc. Only add extra details, better to leave it blank than to add generic details.").optional(),
          }))
        })),
      }),
    }) as { categories: CategoryWithSubcategories[], formatted_query: string }
    return result;
  } catch (error) {
    console.error("Error generating categories:", error)
    // Return default categories on error
    return { categories: [], formatted_query: "" }
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
    }) as { situations: string[] }

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
