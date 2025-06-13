/**
 * Legacy type definitions - DEPRECATED
 * 
 * These types are being migrated to the new consolidated schema system.
 * Please import from './schemas' instead for new code.
 * 
 * @deprecated Use types from './schemas.ts' instead
 */

// Re-export types from the new schema system for backward compatibility
export type {
  InsuranceSettings,
  HealthCategory,
  CategoryWithSubcategories,
  ChatMessage,
  OutOfPocketCost,
  PlanSummary,
  ImportantQuestions,
  ServiceYouMayNeed,
  ExcludedAndOtherCoveredServices,
  ParsedPolicy,
  PriceCheck,
  PriceCheckResult,
  MedicalServiceType,
} from './schemas';

// Re-export schemas for validation
export {
  InsuranceSettingsSchema,
  HealthCategorySchema,
  CategoryWithSubcategoriesSchema,
  ChatMessageSchema,
  OutOfPocketCostSchema,
  PlanSummarySchema,
  ImportantQuestionsSchema,
  ServiceYouMayNeedSchema,
  ExcludedAndOtherCoveredServicesSchema,
  ParsedPolicySchema,
  PriceCheckSchema,
  PriceCheckResultSchema,
  MedicalServiceTypeSchema,
  MEDICAL_SERVICE_TYPES,
} from './schemas';
  