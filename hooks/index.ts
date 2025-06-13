/**
 * Custom Hooks Index
 * 
 * Centralized exports for all custom hooks in the Health Insurance Coverage Analyzer.
 * These hooks follow the established patterns for state management, error handling,
 * and integration with the service layer.
 */

// Core application hooks
export { useCategoryAnalysis } from "./use-category-analysis";
export { useHealthcareInformation } from "./use-healthcare-information";
export { useInsuranceSettings } from "./use-insurance-settings";
export { useSituationSuggestions } from "./use-situation-suggestions";

// Utility hooks
export { useIsMobile } from "./use-mobile";

/**
 * Hook Usage Guidelines:
 * 
 * 1. useCategoryAnalysis - AI-powered insurance category analysis
 *    - Use for generating coverage categories from user queries
 *    - Provides caching, error handling, and loading states
 *    - Example: const { categories, generateCategories, isLoading } = useCategoryAnalysis();
 * 
 * 2. useInsuranceSettings - Centralized insurance settings management
 *    - Manages deductible spending, out-of-pocket costs, network preferences
 *    - Persists data to localStorage with automatic sync
 *    - Example: const { settings, updateSettings } = useInsuranceSettings();
 * 
 * 3. useSituationSuggestions - Healthcare situation recommendations
 *    - Generates AI-powered suggestions for healthcare scenarios
 *    - Context-aware based on current policy and user preferences
 *    - Example: const { suggestions, generateSuggestions } = useSituationSuggestions();
 * 
 * 4. useHealthcareInformation - Personal healthcare data management
 *    - Manages household member healthcare information
 *    - Includes conditions, medications, allergies, expected events
 *    - Persists to localStorage and integrates with AI chat context
 *    - Example: const { healthcareInfo, updateHealthcareInfo, addMember } = useHealthcareInformation();
 * 
 * 5. useIsMobile - Responsive design utility
 *    - Detects mobile viewport for responsive UI adaptations
 *    - Example: const isMobile = useIsMobile();
 * 
 * Best Practices:
 * - All hooks follow single responsibility principle
 * - Error states are handled within hooks
 * - Loading states are provided for async operations
 * - Data validation uses Zod schemas from types/schemas.ts
 * - Hooks integrate with the service layer for business logic
 */