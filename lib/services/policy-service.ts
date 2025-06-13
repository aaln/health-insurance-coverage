/**
 * Policy Service - Unified interface for policy data operations
 * 
 * This service handles all operations related to insurance policy data,
 * including parsing PDF documents, loading policy templates, validating
 * policy data, and managing policy storage/retrieval.
 * 
 * Key features:
 * - PDF parsing and data extraction
 * - Policy data validation with Zod schemas
 * - Template policy management
 * - Policy data transformation and normalization
 * - Error handling with detailed feedback
 * - Async operations with progress tracking
 */

import { parseSBCFile } from "@/actions/parse";
import { policyTemplate1, policyTemplate2 } from "@/policy-templates";
import { ParsedPolicySchema, type ParsedPolicy } from "@/types/schemas";
import { z } from "zod";

// =============================================================================
// ERROR TYPES AND HANDLING
// =============================================================================

/**
 * Custom error types for policy operations
 */
export class PolicyServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "PolicyServiceError";
  }
}

/**
 * Error codes for different types of policy operation failures
 */
export const POLICY_ERROR_CODES = {
  INVALID_FILE: "INVALID_FILE",
  PARSING_FAILED: "PARSING_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  STORAGE_ERROR: "STORAGE_ERROR",
} as const;

/**
 * Create standardized policy error objects
 */
function createPolicyError(
  message: string,
  code: keyof typeof POLICY_ERROR_CODES,
  operation: string,
  originalError?: unknown
): PolicyServiceError {
  return new PolicyServiceError(message, POLICY_ERROR_CODES[code], operation, originalError);
}

// =============================================================================
// POLICY TEMPLATES MANAGEMENT
// =============================================================================

/**
 * Available policy templates for demo and testing purposes
 */
const POLICY_TEMPLATES = {
  oscar_secure: {
    id: "oscar_secure",
    name: "Oscar: Secure (Select) Plan",
    description: "High-deductible HMO plan with no copays after deductible",
    data: policyTemplate1,
  },
  kaiser_gold: {
    id: "kaiser_gold",
    name: "Kaiser Permanente Gold 80 HMO",
    description: "No-deductible HMO plan with fixed copays",
    data: policyTemplate2,
  },
} as const;

/**
 * Template metadata for UI display
 */
export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  data: ParsedPolicy;
}

/**
 * Get all available policy templates
 * 
 * @returns Array of policy template metadata
 * 
 * @example
 * ```typescript
 * const templates = getAvailableTemplates();
 * console.log(templates.map(t => t.name)); // ["Oscar: Secure Plan", "Kaiser Gold HMO"]
 * ```
 */
export function getAvailableTemplates(): PolicyTemplate[] {
  return Object.values(POLICY_TEMPLATES);
}

/**
 * Get a specific policy template by ID
 * 
 * @param templateId The template identifier
 * @returns Policy template data or null if not found
 * 
 * @example
 * ```typescript
 * const template = getTemplateById("oscar_secure");
 * if (template) {
 *   console.log(template.data.plan_summary.plan_name);
 * }
 * ```
 */
export function getTemplateById(templateId: string): PolicyTemplate | null {
  const template = POLICY_TEMPLATES[templateId as keyof typeof POLICY_TEMPLATES];
  return template || null;
}

/**
 * Load a policy template with validation
 * 
 * @param templateId The template identifier
 * @returns Promise resolving to validated policy data
 * @throws PolicyServiceError if template not found or invalid
 * 
 * @example
 * ```typescript
 * try {
 *   const policy = await loadTemplate("oscar_secure");
 *   console.log("Loaded template:", policy.plan_summary.plan_name);
 * } catch (error) {
 *   console.error("Failed to load template:", error.message);
 * }
 * ```
 */
export async function loadTemplate(templateId: string): Promise<ParsedPolicy> {
  const operation = "loadTemplate";
  
  try {
    console.log("Loading policy template:", templateId);
    
    const template = getTemplateById(templateId);
    if (!template) {
      throw createPolicyError(
        `Template '${templateId}' not found`,
        "TEMPLATE_NOT_FOUND",
        operation
      );
    }

    // Validate template data
    const validatedPolicy = ParsedPolicySchema.parse(template.data);
    
    console.log("Successfully loaded and validated template:", templateId);
    return validatedPolicy;

  } catch (error) {
    console.error(`${operation} failed for ${templateId}:`, error);
    
    if (error instanceof PolicyServiceError) {
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      throw createPolicyError(
        `Template data validation failed: ${error.errors.map(e => e.message).join(", ")}`,
        "VALIDATION_FAILED",
        operation,
        error
      );
    }
    
    throw createPolicyError(
      `Unexpected error loading template: ${error instanceof Error ? error.message : "Unknown error"}`,
      "STORAGE_ERROR",
      operation,
      error
    );
  }
}

// =============================================================================
// PDF PARSING SERVICE
// =============================================================================

/**
 * Progress callback for PDF parsing operations
 */
export interface ParseProgressCallback {
  (stage: string, progress: number): void;
}

/**
 * Options for PDF parsing operations
 */
export interface ParsePDFOptions {
  /** Callback for progress updates */
  onProgress?: ParseProgressCallback;
  /** Whether to validate the parsed result */
  validate?: boolean;
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number;
}

/**
 * Parse an SBC PDF file into structured policy data
 * 
 * This function handles the complete PDF parsing pipeline:
 * 1. File validation and upload
 * 2. Text extraction with Unstructured API
 * 3. Image generation for visual analysis
 * 4. AI-powered data structuring
 * 5. Data validation and normalization
 * 
 * @param file The PDF file to parse
 * @param options Parsing options and callbacks
 * @returns Promise resolving to parsed policy data
 * @throws PolicyServiceError for various parsing failures
 * 
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * 
 * try {
 *   const policy = await parsePDF(file, {
 *     onProgress: (stage, progress) => {
 *       console.log(`${stage}: ${progress}%`);
 *     },
 *     validate: true
 *   });
 *   console.log("Parsed policy:", policy.plan_summary.plan_name);
 * } catch (error) {
 *   console.error("Parsing failed:", error.message);
 * }
 * ```
 */
export async function parsePDF(
  file: File,
  options: ParsePDFOptions = {}
): Promise<ParsedPolicy> {
  const {
    onProgress,
    validate = true,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
  } = options;
  
  const operation = "parsePDF";
  
  try {
    console.log("Starting PDF parsing for file:", file.name);
    
    // File validation
    if (!file) {
      throw createPolicyError(
        "No file provided for parsing",
        "INVALID_FILE",
        operation
      );
    }
    
    if (file.type !== "application/pdf") {
      throw createPolicyError(
        "File must be a PDF document",
        "INVALID_FILE",
        operation
      );
    }
    
    if (file.size > maxFileSize) {
      throw createPolicyError(
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxFileSize / 1024 / 1024)}MB)`,
        "INVALID_FILE",
        operation
      );
    }

    // Progress tracking
    const updateProgress = (stage: string, progress: number) => {
      console.log(`PDF parsing progress - ${stage}: ${progress}%`);
      if (onProgress) {
        onProgress(stage, progress);
      }
    };

    // Stage 1: File upload
    updateProgress("Uploading file", 10);

    // Stage 2: Text extraction
    updateProgress("Extracting text", 30);

    // Stage 3: Image generation
    updateProgress("Generating page images", 50);

    // Stage 4: AI processing
    updateProgress("Analyzing with AI", 70);

    // Create FormData for the parsing action
    const formData = new FormData();
    formData.append("file", file);

    // Call the existing parsing action
    const parsedData = await parseSBCFile(formData);

    // Stage 5: Validation
    updateProgress("Validating results", 90);

    let validatedPolicy: ParsedPolicy;
    if (validate) {
      try {
        validatedPolicy = ParsedPolicySchema.parse(parsedData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw createPolicyError(
            `Parsed data validation failed: ${validationError.errors.map(e => e.message).join(", ")}`,
            "VALIDATION_FAILED",
            operation,
            validationError
          );
        }
        throw validationError;
      }
    } else {
      validatedPolicy = parsedData as ParsedPolicy;
    }

    // Stage 6: Complete
    updateProgress("Parsing complete", 100);

    console.log("Successfully parsed PDF:", file.name);
    console.log("Extracted plan:", validatedPolicy.plan_summary.plan_name);
    
    return validatedPolicy;

  } catch (error) {
    console.error(`${operation} failed for ${file?.name}:`, error);
    
    if (error instanceof PolicyServiceError) {
      throw error;
    }
    
    // Handle network/API errors
    if (error instanceof Error && error.message.includes("fetch")) {
      throw createPolicyError(
        "Network error during PDF processing. Please check your connection and try again.",
        "NETWORK_ERROR",
        operation,
        error
      );
    }
    
    throw createPolicyError(
      `PDF parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "PARSING_FAILED",
      operation,
      error
    );
  }
}

// =============================================================================
// POLICY DATA UTILITIES
// =============================================================================

/**
 * Validate policy data against the schema
 * 
 * @param data Policy data to validate
 * @returns Validation result with errors if any
 * 
 * @example
 * ```typescript
 * const result = validatePolicyData(someData);
 * if (result.valid) {
 *   console.log("Policy data is valid");
 * } else {
 *   console.error("Validation errors:", result.errors);
 * }
 * ```
 */
export function validatePolicyData(data: unknown): {
  valid: boolean;
  data?: ParsedPolicy;
  errors?: z.ZodError;
} {
  try {
    const validatedData = ParsedPolicySchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    throw error;
  }
}

/**
 * Extract key financial information from a policy
 * 
 * @param policy Parsed policy data
 * @returns Object with key financial details
 * 
 * @example
 * ```typescript
 * const financial = extractFinancialSummary(policy);
 * console.log(`Deductible: $${financial.deductible.individual}`);
 * console.log(`Out-of-pocket max: $${financial.outOfPocketMax.individual}`);
 * ```
 */
export function extractFinancialSummary(policy: ParsedPolicy) {
  return {
    deductible: {
      individual: policy.important_questions.overall_deductible.individual,
      family: policy.important_questions.overall_deductible.family,
    },
    outOfPocketMax: {
      individual: policy.important_questions.out_of_pocket_limit_for_plan.individual,
      family: policy.important_questions.out_of_pocket_limit_for_plan.family,
    },
    planType: policy.plan_summary.plan_type,
    issuer: policy.plan_summary.issuer_name,
    planName: policy.plan_summary.plan_name,
    requiresReferrals: policy.important_questions.need_referral_for_specialist_care.required,
  };
}

/**
 * Get a human-readable summary of a policy
 * 
 * @param policy Parsed policy data
 * @returns Formatted summary string
 * 
 * @example
 * ```typescript
 * const summary = getPolicySummary(policy);
 * console.log(summary);
 * // "Oscar Secure Plan (HMO) - $9,200 deductible, $9,200 out-of-pocket max"
 * ```
 */
export function getPolicySummary(policy: ParsedPolicy): string {
  const financial = extractFinancialSummary(policy);
  
  return `${financial.planName} (${financial.planType}) - $${financial.deductible.individual.toLocaleString()} deductible, $${financial.outOfPocketMax.individual.toLocaleString()} out-of-pocket max`;
}

/**
 * Check if a policy has zero deductible
 * 
 * @param policy Parsed policy data
 * @returns Whether the policy has no deductible
 */
export function hasZeroDeductible(policy: ParsedPolicy): boolean {
  return policy.important_questions.overall_deductible.individual === 0;
}

/**
 * Get network information from a policy
 * 
 * @param policy Parsed policy data
 * @returns Network configuration details
 */
export function getNetworkInfo(policy: ParsedPolicy) {
  return {
    hasNetworkSavings: policy.important_questions.network_provider_savings.lower_costs,
    website: policy.important_questions.network_provider_savings.website,
    phone: policy.important_questions.network_provider_savings.phone,
    requiresReferrals: policy.important_questions.need_referral_for_specialist_care.required,
  };
}