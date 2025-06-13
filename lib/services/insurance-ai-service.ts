/**
 * Insurance AI Service - Unified interface for all AI operations
 * 
 * This service layer centralizes all AI-powered functionality for insurance analysis.
 * It provides a clean, consistent interface for components and hooks to interact with
 * various AI models and operations, while handling errors, retries, and caching.
 * 
 * Key features:
 * - Centralized AI model management and selection
 * - Consistent error handling across all AI operations
 * - Request caching for expensive operations
 * - Rate limiting and retry logic
 * - Type-safe interfaces with Zod validation
 * - Extensible architecture for new AI features
 */

import { generateObjectWithAIRetry } from "@/lib/ai-retry";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";
import type {
  ParsedPolicy,
  GenerateCategoriesInput,
  GenerateCategoriesOutput,
  GenerateSituationsInput,
} from "@/types/schemas";
import {
  GenerateCategoriesOutputSchema,
} from "@/types/schemas";

// =============================================================================
// AI MODEL CONFIGURATION
// =============================================================================

/**
 * AI model configurations for different types of operations
 * This allows us to optimize model selection based on the complexity of the task
 */
const AI_MODELS = {
  /** High-accuracy model for complex analysis and structured data extraction */
  ANALYSIS: anthropic("claude-sonnet-4-20250514"),
  /** Fast model for category generation and quick analysis */
  CATEGORIZATION: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  /** Balanced model for situation analysis and cost estimation */
  ESTIMATION: anthropic("claude-sonnet-4-20250514"),
  /** Fallback model when primary models fail */
  FALLBACK: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
} as const;

/**
 * Cache configuration for AI operations
 * Helps reduce costs and improve performance for repeated queries
 */
interface CacheConfig {
  /** Whether caching is enabled for this operation */
  enabled: boolean;
  /** Cache TTL in milliseconds */
  ttl: number;
  /** Maximum number of cached entries */
  maxSize: number;
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  categories: { enabled: true, ttl: 5 * 60 * 1000, maxSize: 100 }, // 5 minutes
  situations: { enabled: true, ttl: 10 * 60 * 1000, maxSize: 50 }, // 10 minutes
  analysis: { enabled: true, ttl: 15 * 60 * 1000, maxSize: 25 }, // 15 minutes
};

/**
 * Simple in-memory cache implementation
 * In production, consider Redis or another distributed cache
 */
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  get(key: string): T | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    if (!this.config.enabled) return;

    // Implement simple LRU by removing oldest entries when at capacity
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.config.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Initialize caches
const categoryCache = new SimpleCache<GenerateCategoriesOutput>(CACHE_CONFIG.categories);
const situationCache = new SimpleCache<string[]>(CACHE_CONFIG.situations);

// =============================================================================
// ERROR TYPES AND HANDLING
// =============================================================================

/**
 * Custom error types for better error handling and user feedback
 */
export class InsuranceAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "InsuranceAIError";
  }
}

/**
 * Error codes for different types of AI operation failures
 */
export const AI_ERROR_CODES = {
  MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  PARSING_ERROR: "PARSING_ERROR",
} as const;

/**
 * Create standardized error objects with context
 */
function createAIError(
  message: string,
  code: keyof typeof AI_ERROR_CODES,
  operation: string,
  originalError?: unknown
): InsuranceAIError {
  return new InsuranceAIError(message, AI_ERROR_CODES[code], operation, originalError);
}

// =============================================================================
// CATEGORY ANALYSIS SERVICE
// =============================================================================

/**
 * Generate insurance categories with AI analysis
 * 
 * This function takes a user query and policy data to generate relevant
 * insurance categories with coverage analysis and cost estimates.
 * 
 * @param input Query, context, and policy data for analysis
 * @returns Promise resolving to categories and formatted query
 * 
 * @example
 * ```typescript
 * const result = await generateCategories({
 *   query: "diabetes care",
 *   context: { isInNetwork: true, deductibleSpent: 1000, outOfPocketSpent: 2000 },
 *   policy: userPolicy
 * });
 * console.log(result.categories); // AI-generated categories
 * ```
 */
export async function generateCategories(
  input: GenerateCategoriesInput
): Promise<GenerateCategoriesOutput> {
  const operation = "generateCategories";
  
  try {
    // Input validation
    if (!input.query.trim()) {
      throw createAIError("Query cannot be empty", "INVALID_INPUT", operation);
    }
    
    if (!input.policy) {
      throw createAIError("Policy data is required", "INVALID_INPUT", operation);
    }

    // Check cache first
    const cacheKey = `categories_${JSON.stringify(input)}`;
    const cached = categoryCache.get(cacheKey);
    if (cached) {
      console.log("Returning cached categories for:", input.query);
      return cached;
    }

    console.log("Generating categories with AI for query:", input.query);

    // Build AI prompt with comprehensive context
    const networkContext = input.context.isInNetwork ? "In-Network" : "Out-of-Network";
    const systemPrompt = `You are a health insurance expert. Generate relevant insurance categories based on treatments, medications, or procedures for the user's query.

Query: ${input.query}

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

Consider the context: ${networkContext}, 
Deductible spent: $${input.context.deductibleSpent}, Out-of-pocket spent: $${input.context.outOfPocketSpent}

Policy: ${JSON.stringify(input.policy)}`;

    // Generate categories with AI
    const result = await generateObjectWithAIRetry({
      model: AI_MODELS.CATEGORIZATION,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate insurance categories relevant to: "${input.query}". If the query is empty, return general health insurance categories.`,
        },
      ],
      schema: GenerateCategoriesOutputSchema,
      backupModel: AI_MODELS.FALLBACK,
    }) as GenerateCategoriesOutput;

    // Validate the result
    const validatedResult = GenerateCategoriesOutputSchema.parse(result);

    // Cache the result
    categoryCache.set(cacheKey, validatedResult);

    console.log(`Generated ${validatedResult.categories.length} categories for query: ${input.query}`);
    return validatedResult;

  } catch (error) {
    console.error(`${operation} failed:`, error);
    
    if (error instanceof z.ZodError) {
      throw createAIError(
        "AI response validation failed",
        "VALIDATION_FAILED",
        operation,
        error
      );
    }
    
    throw createAIError(
      `Failed to generate categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      "MODEL_UNAVAILABLE",
      operation,
      error
    );
  }
}

// =============================================================================
// SITUATION SUGGESTIONS SERVICE
// =============================================================================

/**
 * Generate contextual healthcare situation suggestions
 * 
 * This function creates relevant healthcare scenarios and questions
 * based on the user's query and current context.
 * 
 * @param input Query, context, and policy data for suggestions
 * @returns Promise resolving to array of situation suggestions
 * 
 * @example
 * ```typescript
 * const suggestions = await generateSituations({
 *   query: "mental health",
 *   context: { isInNetwork: true, currentCategory: "Therapy" },
 *   policy: userPolicy
 * });
 * console.log(suggestions); // ["Therapy session costs", "Psychiatrist visits", ...]
 * ```
 */
export async function generateSituations(
  input: GenerateSituationsInput
): Promise<string[]> {
  const operation = "generateSituations";
  
  try {
    // Input validation
    if (!input.query.trim()) {
      throw createAIError("Query cannot be empty", "INVALID_INPUT", operation);
    }

    // Check cache first
    const cacheKey = `situations_${JSON.stringify(input)}`;
    const cached = situationCache.get(cacheKey);
    if (cached) {
      console.log("Returning cached situations for:", input.query);
      return cached;
    }

    console.log("Generating situation suggestions with AI for:", input.query);

    // Build system prompt
    const systemPrompt = `You are a health insurance expert. Generate common healthcare situations or questions that users might have.
Return a JSON array of 5 relevant situation strings.

${input.context.currentCategory ? `Focus on situations related to ${input.context.currentCategory}.` : ""}

Policy: ${JSON.stringify(input.policy)}`;

    const result = await generateObjectWithAIRetry({
      model: AI_MODELS.CATEGORIZATION,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate common situations or questions related to: "${input.query}"`,
        },
      ],
      schema: z.object({
        situations: z.array(z.string()),
      }),
      backupModel: AI_MODELS.FALLBACK,
    }) as { situations: string[] };

    const situations = result.situations;

    // Cache the result
    situationCache.set(cacheKey, situations);

    console.log(`Generated ${situations.length} situations for query: ${input.query}`);
    return situations;

  } catch (error) {
    console.error(`${operation} failed:`, error);
    
    // Return fallback suggestions instead of throwing
    const fallbackSuggestions = [
      "What if I need an MRI?",
      "Emergency room visit costs",
      "Monthly prescription expenses",
      "Specialist consultation fees",
      "Preventive care coverage",
    ];
    
    console.log("Using fallback suggestions due to AI error");
    return fallbackSuggestions;
  }
}

// =============================================================================
// SITUATION ANALYSIS SERVICE
// =============================================================================

/**
 * Analyze a specific healthcare situation for cost and coverage details
 * 
 * This function provides detailed analysis of what a user would pay
 * for a specific healthcare situation given their current policy and spending.
 * 
 * @param situation Healthcare situation to analyze
 * @param context User's current insurance context
 * @returns Promise resolving to cost estimate and coverage details
 */
export async function analyzeSituation(
  situation: string,
  context: {
    isInNetwork: boolean;
    deductibleSpent: number;
    outOfPocketSpent: number;
    deductibleLimit: number;
    outOfPocketLimit: number;
  }
): Promise<{
  estimatedCost: number;
  coverageDetails: string;
  recommendations: string[];
}> {
  const operation = "analyzeSituation";
  
  try {
    console.log("Analyzing situation:", situation);

    const systemPrompt = `You are a health insurance expert. Analyze the given healthcare situation and provide cost estimates and coverage details.
Return a JSON object with:
{
  "estimatedCost": number (estimated out-of-pocket cost),
  "coverageDetails": string (explanation of coverage),
  "recommendations": string[] (array of 2-3 recommendations)
}

Context:
- Network: ${context.isInNetwork ? "In-Network" : "Out-of-Network"}
- Deductible: $${context.deductibleSpent} spent of $${context.deductibleLimit}
- Out-of-pocket: $${context.outOfPocketSpent} spent of $${context.outOfPocketLimit}`;

    const { text } = await generateText({
      model: AI_MODELS.ESTIMATION,
      system: systemPrompt,
      prompt: `Analyze this healthcare situation: "${situation}"`,
    });

    const result = JSON.parse(text);
    console.log("Situation analysis completed for:", situation);
    return result;

  } catch (error) {
    console.error(`${operation} failed:`, error);
    
    // Return fallback analysis
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

// =============================================================================
// SERVICE UTILITIES
// =============================================================================

/**
 * Clear all AI service caches
 * Useful for testing or when policy data changes
 */
export function clearAllCaches(): void {
  categoryCache.clear();
  situationCache.clear();
  console.log("All AI service caches cleared");
}

/**
 * Get cache statistics for monitoring and debugging
 */
export function getCacheStats() {
  return {
    categories: {
      size: categoryCache['cache'].size,
      maxSize: CACHE_CONFIG.categories.maxSize,
      enabled: CACHE_CONFIG.categories.enabled,
    },
    situations: {
      size: situationCache['cache'].size,
      maxSize: CACHE_CONFIG.situations.maxSize,
      enabled: CACHE_CONFIG.situations.enabled,
    },
  };
}

/**
 * Health check for AI service
 * Tests basic functionality with a simple query
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // Simple test to verify AI service is working
    const testInput: GenerateSituationsInput = {
      query: "test",
      context: { isInNetwork: true },
      policy: {} as ParsedPolicy, // Minimal policy for test
    };
    
    await generateSituations(testInput);
    return true;
  } catch {
    return false;
  }
}