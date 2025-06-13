/**
 * Insurance Analyzer Actions - Server-side AI operations for insurance analysis
 * 
 * This file contains server actions that interface with the AI service layer
 * to provide insurance analysis functionality. These actions are called from
 * client components and custom hooks to perform AI operations.
 * 
 * REFACTOR NOTE: This file now primarily serves as a bridge between the client
 * and the new service layer. Most logic has been moved to the service layer
 * for better organization and testability.
 * 
 * @deprecated Consider using the InsuranceAIService directly in hooks instead
 */

"use server"

import { InsuranceAIService } from "@/lib/services"
import type { 
  ParsedPolicy,
  InsuranceSettings,
  CategoryWithSubcategories,
  GenerateCategoriesInput,
  GenerateSituationsInput,
} from "@/types/schemas"

/**
 * Generate insurance categories with AI analysis
 * 
 * This server action wraps the InsuranceAIService.generateCategories function
 * to provide a server-side interface for client components.
 * 
 * @param query User's search query
 * @param context Current insurance settings and spending
 * @param policy User's parsed policy data
 * @returns Promise resolving to categories and formatted query
 * 
 * @example
 * ```typescript
 * const result = await generateCategories(
 *   "primary care",
 *   { isInNetwork: true, deductibleSpent: 1000, outOfPocketSpent: 2000 },
 *   policy
 * );
 * ```
 */
export async function generateCategories(
  query: string,
  context: InsuranceSettings,
  policy: ParsedPolicy
): Promise<{ categories: CategoryWithSubcategories[], formatted_query: string }> {
  // Prepare input for the service layer
  const input: GenerateCategoriesInput = {
    query,
    context,
    policy,
  };
  

  try {
    console.log("Generating categories via service layer:", { query, context: context.isInNetwork ? "in-network" : "out-of-network" });
    
    // Call the service layer instead of implementing logic here
    const result = await InsuranceAIService.generateCategories(input);
    
    console.log(`Successfully generated ${result.categories.length} categories`);
    return result;
  } catch (error) {
    console.error("Error in generateCategories server action:", error);
    
    // Return empty result on error (service layer handles fallbacks)
    return { 
      categories: [], 
      formatted_query: query || "general coverage" 
    };
  }
}

/**
 * Generate healthcare situation suggestions
 * 
 * This server action wraps the InsuranceAIService.generateSituations function
 * to provide contextual healthcare scenarios and questions.
 * 
 * @param query Base query for situation generation
 * @param context Network preference and current category context
 * @param policy User's parsed policy data
 * @returns Promise resolving to array of situation suggestions
 * 
 * @example
 * ```typescript
 * const situations = await generateSituations(
 *   "mental health",
 *   { isInNetwork: true, currentCategory: "Therapy" },
 *   policy
 * );
 * ```
 */
export async function generateSituations(
  query: string,
  context: {
    isInNetwork: boolean
    currentCategory?: string
  },
  policy: ParsedPolicy
): Promise<string[]> {
  // Prepare input for the service layer
  const input: GenerateSituationsInput = {
    query,
    context,
    policy,
  };

  try {
    console.log("Generating situations via service layer:", { 
      query, 
      currentCategory: context.currentCategory,
      isInNetwork: context.isInNetwork 
    });
    
    // Call the service layer instead of implementing logic here
    const situations = await InsuranceAIService.generateSituations(input);
    
    console.log(`Successfully generated ${situations.length} situations`);
    return situations;
  } catch (error) {
    console.error("Error in generateSituations server action:", error);
    
    // Return empty array on error (service layer provides fallbacks)
    return [];
  }
}

/**
 * Analyze a specific healthcare situation for cost and coverage details
 * 
 * This server action wraps the InsuranceAIService.analyzeSituation function
 * to provide detailed cost estimates and coverage analysis.
 * 
 * @param situation Healthcare situation to analyze
 * @param context User's current insurance financial context
 * @returns Promise resolving to cost estimate and coverage details
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeSituation(
 *   "Emergency room visit for chest pain",
 *   {
 *     isInNetwork: true,
 *     deductibleSpent: 1000,
 *     outOfPocketSpent: 2000,
 *     deductibleLimit: 5000,
 *     outOfPocketLimit: 8000
 *   }
 * );
 * ```
 */
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
    console.log("Analyzing situation via service layer:", { 
      situation: situation.substring(0, 50) + "...", // Log first 50 chars
      isInNetwork: context.isInNetwork,
      financialProgress: `${context.deductibleSpent}/${context.deductibleLimit} deductible`
    });
    
    // Call the service layer instead of implementing logic here
    const result = await InsuranceAIService.analyzeSituation(situation, context);
    
    console.log("Successfully analyzed situation");
    return result;
  } catch (error) {
    console.error("Error in analyzeSituation server action:", error);
    
    // Return fallback analysis on error
    return {
      estimatedCost: 0,
      coverageDetails: "Unable to analyze situation at this time. Please contact your insurance provider for specific details.",
      recommendations: [
        "Contact your insurance provider for specific coverage details",
        "Review your Summary of Benefits and Coverage document",
        "Consider discussing alternatives with your healthcare provider",
      ],
    };
  }
}
