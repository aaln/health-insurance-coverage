/**
 * Services Index - Centralized exports for all service modules
 * 
 * This file provides a single entry point for importing service modules,
 * making it easier to manage dependencies and discover available services.
 * 
 * Usage:
 * ```tsx
 * import { InsuranceAIService, PolicyService } from "@/lib/services";
 * ```
 */

// Export all functions from insurance AI service
export * as InsuranceAIService from "./insurance-ai-service";

// Export all functions from policy service  
export * as PolicyService from "./policy-service";

// Re-export key types and errors for convenience
export {
  InsuranceAIError,
  AI_ERROR_CODES,
} from "./insurance-ai-service";

export {
  PolicyServiceError,
  POLICY_ERROR_CODES,
} from "./policy-service";

export type {
  PolicyTemplate,
  ParseProgressCallback,
  ParsePDFOptions,
} from "./policy-service";

/**
 * Service usage documentation for code tourists:
 * 
 * 🤖 InsuranceAIService
 * - generateCategories(): AI-powered category analysis
 * - generateSituations(): Contextual healthcare suggestions
 * - analyzeSituation(): Detailed cost and coverage analysis
 * - clearAllCaches(): Cache management utilities
 * 
 * 📄 PolicyService
 * - parsePDF(): Convert SBC PDFs to structured data
 * - loadTemplate(): Load predefined policy templates
 * - validatePolicyData(): Validate policy data structure
 * - extractFinancialSummary(): Get key financial details
 * - getAvailableTemplates(): List available demo policies
 * 
 * 💡 Usage Tips:
 * - Always handle service errors with try/catch blocks
 * - Use the provided error codes for specific error handling
 * - Consider implementing progress callbacks for long operations
 * - Leverage caching for repeated AI operations
 */