/**
 * Consolidated Zod schemas for the Health Insurance Coverage Analyzer
 * 
 * This file contains all validation schemas used throughout the application.
 * By centralizing schemas here, we ensure consistency and make it easier
 * to maintain validation logic across components, API routes, and AI operations.
 * 
 * Schema naming convention:
 * - Use descriptive names that match the data they validate
 * - Add "Schema" suffix to distinguish from TypeScript types
 * - Group related schemas together with comments
 */

import { z } from "zod";

// =============================================================================
// CORE INSURANCE DATA SCHEMAS
// =============================================================================

/**
 * User's current insurance settings and spending status
 * Used to calculate personalized coverage estimates
 */
export const InsuranceSettingsSchema = z.object({
  /** Amount already spent toward deductible this plan year */
  deductibleSpent: z.number().min(0, "Deductible spent cannot be negative"),
  /** Amount already spent toward out-of-pocket maximum this plan year */
  outOfPocketSpent: z.number().min(0, "Out-of-pocket spent cannot be negative"),
  /** Whether user typically uses in-network providers */
  isInNetwork: z.boolean(),
});

/**
 * Out-of-pocket cost information for specific healthcare situations
 * Used in category analysis to show realistic cost estimates
 */
export const OutOfPocketCostSchema = z.object({
  /** Description of the healthcare situation (e.g., "Emergency room visit") */
  situation: z.string().min(1, "Situation description is required"),
  /** Estimated cost user will pay (after insurance) */
  cost: z.number().min(0, "Cost cannot be negative"),
  /** How often this cost applies (e.g., "per visit", "per month") */
  cost_frequency: z.string().min(1, "Cost frequency is required"),
  /** Additional details about limitations, caps, etc. */
  extra_details: z.string().optional(),
});

/**
 * Healthcare category with AI-generated coverage analysis
 * Core data structure for displaying insurance coverage information
 */
export const HealthCategorySchema = z.object({
  /** Unique identifier for the category */
  id: z.number(),
  /** Human-readable category name */
  name: z.string().min(1, "Category name is required"),
  /** AI-assigned coverage grade (A=excellent, F=poor/no coverage) */
  score: z.enum(["A", "B", "C", "D", "F", "N/A"], {
    errorMap: () => ({ message: "Score must be A, B, C, D, F, or N/A" }),
  }),
  /** AI-generated explanation of coverage for this category */
  description: z.string().min(1, "Description is required"),
  /** Array of cost scenarios for this category */
  out_of_pocket_costs: z.array(OutOfPocketCostSchema),
});

/**
 * Healthcare category that can contain nested subcategories
 * Used for hierarchical browsing of insurance coverage
 * 
 * Note: To avoid circular reference issues, subcategories are stored as simple strings
 * rather than full nested objects. The UI can create new category requests based on these strings.
 */
export const CategoryWithSubcategoriesSchema = HealthCategorySchema.extend({
  /** Optional subcategory names for drill-down navigation */
  subcategories: z.array(z.string()).optional(),
});

// =============================================================================
// POLICY DOCUMENT SCHEMAS
// =============================================================================

/**
 * Basic plan information from the SBC document header
 */
export const PlanSummarySchema = z.object({
  /** Official plan name as listed in the SBC */
  plan_name: z.string().min(1, "Plan name is required"),
  /** Plan coverage dates */
  coverage_period: z.object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  }),
  /** Who the plan covers (individual, family, or both) */
  coverage_for: z.union([
    z.enum(["individual", "family", "individual_and_family"]),
    z.string(),
  ]),
  /** Plan type (HMO, PPO, etc.) */
  plan_type: z.union([
    z.enum(["HMO", "PPO", "EPO", "POS", "HMO-POS", "HMO-EPO", "PPO-EPO", "PPO-POS"]),
    z.string(),
  ]),
  /** Insurance company name */
  issuer_name: z.string().min(1, "Issuer name is required"),
  /** Contact information for the insurance company */
  issuer_contact_info: z.object({
    phone: z.string().min(1, "Phone number is required"),
    website: z.string().url("Must be a valid URL"),
  }),
});

/**
 * Answers to the "Important Questions" section of SBC documents
 * Contains key financial information about the plan
 */
export const ImportantQuestionsSchema = z.object({
  /** Annual deductible amounts */
  overall_deductible: z.object({
    individual: z.number().min(0, "Individual deductible cannot be negative"),
    family: z.number().min(0, "Family deductible cannot be negative"),
    details: z.string().optional(),
  }),
  /** Services covered before meeting deductible */
  services_covered_before_deductible: z.object({
    covered: z.boolean(),
    services: z.array(z.string()),
    details: z.string().optional(),
  }),
  /** Whether plan has service-specific deductibles */
  deductibles_for_specific_services: z.object({
    exists: z.boolean(),
    details: z.string().optional(),
  }),
  /** Annual out-of-pocket maximum amounts */
  out_of_pocket_limit_for_plan: z.object({
    individual: z.number().min(0, "Individual out-of-pocket limit cannot be negative"),
    family: z.number().min(0, "Family out-of-pocket limit cannot be negative"),
    details: z.string().optional(),
  }),
  /** Expenses that don't count toward out-of-pocket max */
  not_included_in_out_of_pocket_limit: z.object({
    services: z.array(z.string()),
    details: z.string().optional(),
  }),
  /** Network provider information */
  network_provider_savings: z.object({
    lower_costs: z.boolean(),
    website: z.string().min(1, "Website is required"),
    phone: z.string().min(1, "Phone is required"),
    details: z.string().optional(),
  }),
  /** Specialist referral requirements */
  need_referral_for_specialist_care: z.object({
    required: z.boolean(),
    details: z.string().optional(),
  }),
});

/**
 * Individual service entry from the "Services You May Need" table
 * Represents coverage details for a specific type of healthcare service
 */
export const ServiceYouMayNeedSchema = z.object({
  /** Service identifier (matches CommonMedicalEventServiceTypes) */
  name: z.string().min(1, "Service name is required"),
  /** Cost information for this service */
  what_you_will_pay: z.object({
    /** What you pay when using in-network providers */
    network_provider: z.string().min(1, "Network provider cost is required"),
    /** What you pay when using out-of-network providers */
    out_of_network_provider: z.string().min(1, "Out-of-network provider cost is required"),
    /** Important limitations, exclusions, or other details */
    limitations_exceptions_and_other_important_information: z.string(),
  }),
});

/**
 * Services that are excluded vs. other services that are covered
 * From the final sections of SBC documents
 */
export const ExcludedAndOtherCoveredServicesSchema = z.object({
  /** Services explicitly not covered by the plan */
  excluded_services: z.array(z.string()),
  /** Additional services that are covered (may have limitations) */
  other_covered_services: z.array(z.string()),
});

/**
 * Complete parsed policy document structure
 * Represents all data extracted from an SBC PDF
 */
export const ParsedPolicySchema = z.object({
  /** URL where the original PDF file is stored */
  file_url: z.string().url("Must be a valid URL"),
  /** URLs of page images generated from the PDF */
  image_urls: z.array(z.string().url("Must be a valid URL")),
  /** Basic plan information */
  plan_summary: PlanSummarySchema,
  /** Key plan details and financial information */
  important_questions: ImportantQuestionsSchema,
  /** Detailed service coverage information */
  services_you_may_need: z.array(ServiceYouMayNeedSchema),
  /** Excluded and other covered services */
  excluded_and_other_covered_services: ExcludedAndOtherCoveredServicesSchema,
});

// =============================================================================
// AI OPERATION SCHEMAS
// =============================================================================

/**
 * Input parameters for AI category generation
 * Used when requesting AI analysis of insurance coverage areas
 */
export const GenerateCategoriesInputSchema = z.object({
  /** User's search query or area of interest */
  query: z.string().min(1, "Query is required"),
  /** User's current insurance settings */
  context: InsuranceSettingsSchema,
  /** The user's policy data for analysis */
  policy: ParsedPolicySchema,
});

/**
 * AI response format for category generation
 * Standardizes the output from AI category analysis
 */
export const GenerateCategoriesOutputSchema = z.object({
  /** AI-refined version of the user's query */
  formatted_query: z.string(),
  /** Generated categories with coverage analysis */
  categories: z.array(CategoryWithSubcategoriesSchema),
});

/**
 * Input parameters for generating situation suggestions
 * Used to create contextual healthcare scenario suggestions
 */
export const GenerateSituationsInputSchema = z.object({
  /** Base query or area of interest */
  query: z.string().min(1, "Query is required"),
  /** Context including network preference and current category */
  context: z.object({
    isInNetwork: z.boolean(),
    currentCategory: z.string().optional(),
  }),
  /** User's policy for contextual suggestions */
  policy: ParsedPolicySchema,
});

/**
 * Price checking tool parameters
 * Used by the AI assistant's price checking functionality
 */
export const PriceCheckSchema = z.object({
  /** Medical condition, treatment, or medication to check */
  query: z.string().min(2, "Please enter a medical condition, treatment, or medication."),
  /** Whether to check in-network or out-of-network pricing */
  isInNetwork: z.boolean(),
  /** Amount already spent toward deductible */
  deductibleSpent: z.number().min(0, "Deductible spent cannot be negative"),
  /** Amount already spent toward out-of-pocket maximum */
  outOfPocketSpent: z.number().min(0, "Out-of-pocket spent cannot be negative"),
});

/**
 * Price check result structure
 * Returned by the price checking tool
 */
export const PriceCheckResultSchema = z.object({
  /** Name of the service or treatment */
  name: z.string(),
  /** Estimated out-of-pocket cost for the user */
  estimatedCost: z.number().min(0, "Estimated cost cannot be negative"),
  /** Detailed explanation of the cost calculation */
  details: z.string(),
});

// =============================================================================
// CHAT AND UI SCHEMAS
// =============================================================================

/**
 * Chat message structure for the assistant interface
 */
export const ChatMessageSchema = z.object({
  /** Unique message identifier */
  id: z.string().min(1, "Message ID is required"),
  /** Who sent the message */
  role: z.enum(["user", "system", "assistant"], {
    errorMap: () => ({ message: "Role must be user, system, or assistant" }),
  }),
  /** Message content */
  content: z.string(),
  /** Optional timestamp */
  timestamp: z.date().optional(),
});

// =============================================================================
// STANDARD MEDICAL EVENT SERVICE TYPES
// =============================================================================

/**
 * Predefined medical service types that correspond to standard SBC categories
 * These match the CommonMedicalEventServiceTypes object used in parsing
 */
export const MEDICAL_SERVICE_TYPES = [
  "primary_care_visit",
  "specialist_visit", 
  "preventive_care",
  "diagnostic_test",
  "imaging",
  "generic_drugs",
  "preferred_brand_drugs",
  "non_preferred_brand_drugs",
  "specialty_drugs",
  "outpatient_facility_fee",
  "outpatient_physician_fee",
  "emergency_room",
  "emergency_transport",
  "urgent_care",
  "hospital_facility_fee",
  "hospital_physician_fee",
  "mental_health_outpatient",
  "mental_health_inpatient",
  "pregnancy_office_visits",
  "childbirth_professional",
  "childbirth_facility",
  "home_health_care",
  "rehabilitation_services",
  "habilitation_services",
  "skilled_nursing",
  "durable_medical_equipment",
  "hospice_services",
  "childrens_eye_exam",
  "childrens_glasses",
  "childrens_dental_checkup",
] as const;

/**
 * Schema for validating medical service types
 */
export const MedicalServiceTypeSchema = z.enum(MEDICAL_SERVICE_TYPES);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Export inferred TypeScript types for use throughout the application
export type InsuranceSettings = z.infer<typeof InsuranceSettingsSchema>;
export type OutOfPocketCost = z.infer<typeof OutOfPocketCostSchema>;
export type HealthCategory = z.infer<typeof HealthCategorySchema>;
export type CategoryWithSubcategories = z.infer<typeof CategoryWithSubcategoriesSchema>;
export type PlanSummary = z.infer<typeof PlanSummarySchema>;
export type ImportantQuestions = z.infer<typeof ImportantQuestionsSchema>;
export type ServiceYouMayNeed = z.infer<typeof ServiceYouMayNeedSchema>;
export type ExcludedAndOtherCoveredServices = z.infer<typeof ExcludedAndOtherCoveredServicesSchema>;
export type ParsedPolicy = z.infer<typeof ParsedPolicySchema>;
export type GenerateCategoriesInput = z.infer<typeof GenerateCategoriesInputSchema>;
export type GenerateCategoriesOutput = z.infer<typeof GenerateCategoriesOutputSchema>;
export type GenerateSituationsInput = z.infer<typeof GenerateSituationsInputSchema>;
export type PriceCheck = z.infer<typeof PriceCheckSchema>;
export type PriceCheckResult = z.infer<typeof PriceCheckResultSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type MedicalServiceType = z.infer<typeof MedicalServiceTypeSchema>;

// =============================================================================
// MEDICAL INFORMATION SCHEMAS
// =============================================================================

/**
 * Individual dependent information
 */
export const DependentSchema = z.object({
  /** Unique identifier for the dependent */
  id: z.string().min(1, "Dependent ID is required"),
  /** Age of the dependent */
  age: z.number().min(0, "Age cannot be negative").max(120, "Age must be realistic"),
  /** Sex of the dependent */
  sex: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Sex must be male or female" }),
  }),
  /** Relationship to primary member */
  relationship: z.enum(["spouse", "child", "domestic_partner"], {
    errorMap: () => ({ message: "Relationship must be spouse, child, or domestic partner" }),
  }),
});

/**
 * Current medication information
 */
export const MedicationSchema = z.object({
  /** Medication name */
  name: z.string().min(1, "Medication name is required"),
  /** Dosage information */
  dosage: z.string().min(1, "Dosage is required"),
  /** How often the medication is taken */
  frequency: z.string().min(1, "Frequency is required"),
  /** Whether this is a brand name or generic medication */
  type: z.enum(["brand", "generic"], {
    errorMap: () => ({ message: "Type must be brand or generic" }),
  }),
});

/**
 * Pre-existing medical condition
 */
export const PreExistingConditionSchema = z.object({
  /** Name of the condition */
  condition: z.string().min(1, "Condition name is required"),
  /** When the condition was diagnosed */
  diagnosedDate: z.string().min(1, "Diagnosis date is required"),
  /** Whether the condition is currently being treated */
  currentlyTreated: z.boolean(),
  /** Additional details about the condition */
  notes: z.string().optional(),
});

/**
 * Allergy information
 */
export const AllergySchema = z.object({
  /** What the person is allergic to */
  allergen: z.string().min(1, "Allergen is required"),
  /** Type of allergy */
  type: z.enum(["food", "medication", "environmental", "other"], {
    errorMap: () => ({ message: "Type must be food, medication, environmental, or other" }),
  }),
  /** Severity of the allergic reaction */
  severity: z.enum(["mild", "moderate", "severe"], {
    errorMap: () => ({ message: "Severity must be mild, moderate, or severe" }),
  }),
});

/**
 * Recent hospitalization or surgery
 */
export const RecentMedicalEventSchema = z.object({
  /** Type of medical event */
  type: z.enum(["hospitalization", "surgery", "emergency_visit"], {
    errorMap: () => ({ message: "Type must be hospitalization, surgery, or emergency_visit" }),
  }),
  /** Description of the event */
  description: z.string().min(1, "Description is required"),
  /** Date of the event */
  date: z.string().min(1, "Date is required"),
  /** Estimated cost of the event */
  estimatedCost: z.number().min(0, "Cost cannot be negative").optional(),
  /** Whether this event is related to ongoing care */
  ongoingCare: z.boolean(),
});

/**
 * Complete medical information for a person (primary or dependent)
 */
export const PersonMedicalInfoSchema = z.object({
  /** Person identifier */
  personId: z.string().min(1, "Person ID is required"),
  /** Pre-existing medical conditions */
  preExistingConditions: z.array(PreExistingConditionSchema).default([]),
  /** Current medications */
  currentMedications: z.array(MedicationSchema).default([]),
  /** Known allergies */
  allergies: z.array(AllergySchema).default([]),
  /** Recent hospitalizations or surgeries */
  recentMedicalEvents: z.array(RecentMedicalEventSchema).default([]),
  /** Whether the person smokes */
  smoker: z.boolean().default(false),
  /** Estimated annual healthcare usage */
  expectedUsage: z.enum(["low", "moderate", "high"], {
    errorMap: () => ({ message: "Expected usage must be low, moderate, or high" }),
  }).default("moderate"),
});

/**
 * Complete medical information form data
 */
export const MedicalInformationSchema = z.object({
  /** Primary member information */
  primaryMember: z.object({
    age: z.number().min(18, "Primary member must be at least 18").max(120, "Age must be realistic"),
    sex: z.enum(["male", "female"], {
      errorMap: () => ({ message: "Sex must be male or female" }),
    }),
  }),
  /** Dependent information */
  dependents: z.array(DependentSchema).default([]),
  /** Medical information for primary member */
  primaryMedicalInfo: PersonMedicalInfoSchema,
  /** Medical information for each dependent */
  dependentMedicalInfo: z.array(PersonMedicalInfoSchema).default([]),
  /** Annual household income for subsidy calculations */
  annualIncome: z.number().min(0, "Income cannot be negative").optional(),
  /** ZIP code for provider network analysis */
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format").optional(),
});

/**
 * Cost calculation result for medical scenarios
 */
export const MedicalScenarioResultSchema = z.object({
  /** Scenario description */
  scenario: z.string(),
  /** Estimated annual cost for this scenario */
  estimatedAnnualCost: z.number().min(0, "Cost cannot be negative"),
  /** Amount user will pay out of pocket */
  userPayment: z.number().min(0, "Payment cannot be negative"),
  /** Amount insurance will cover */
  insurancePayment: z.number().min(0, "Payment cannot be negative"),
  /** Detailed breakdown of costs */
  costBreakdown: z.object({
    deductiblePayment: z.number().min(0, "Payment cannot be negative"),
    coinsurancePayment: z.number().min(0, "Payment cannot be negative"),
    copayments: z.number().min(0, "Payment cannot be negative"),
    outOfPocketMax: z.number().min(0, "Payment cannot be negative"),
  }),
  /** Policy score for this scenario */
  policyScore: z.enum(["A", "B", "C", "D", "F"], {
    errorMap: () => ({ message: "Score must be A, B, C, D, or F" }),
  }),
  /** Recommendations for this scenario */
  recommendations: z.array(z.string()),
});

// =============================================================================
// HEALTHCARE INFORMATION SCHEMAS (PERSONAL HEALTH DATA)
// =============================================================================

/**
 * Simplified healthcare information for a person (primary member or dependent)
 * This is a more compact version optimized for the modal interface
 */
export const PersonHealthInfoSchema = z.object({
  /** Person identifier */
  id: z.string().min(1, "Person ID is required"),
  /** Person's name for display */
  name: z.string().default("Member"),
  /** Age */
  age: z.number().min(0, "Age cannot be negative").max(120, "Age must be realistic"),
  /** Relationship to primary member */
  relationship: z.enum(["self", "spouse", "child", "domestic_partner"], {
    errorMap: () => ({ message: "Relationship must be self, spouse, child, or domestic partner" }),
  }).default("self"),
  /** Pre-existing conditions (simplified as string array) */
  preExistingConditions: z.array(z.string()).default([]),
  /** Current medications (simplified as string array) */
  currentMedications: z.array(z.string()).default([]),
  /** Known allergies (simplified as string array) */
  allergies: z.array(z.string()).default([]),
  /** Expected medical events (simplified as string array) */
  expectedMedicalEvents: z.array(z.string()).default([]),
  /** Whether the person smokes */
  smoker: z.boolean().default(false),
  /** Estimated annual healthcare usage */
  expectedUsage: z.enum(["low", "moderate", "high"], {
    errorMap: () => ({ message: "Expected usage must be low, moderate, or high" }),
  }).default("moderate"),
});

/**
 * Complete healthcare information for the household
 * This is the main data structure for the healthcare information modal
 */
export const HealthcareInformationSchema = z.object({
  /** All household members including primary and dependents */
  members: z.array(PersonHealthInfoSchema).min(1, "At least one member is required"),
  /** Annual household income for context */
  annualIncome: z.number().min(0, "Income cannot be negative").optional(),
  /** ZIP code for provider network analysis */
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format").optional(),
  /** Last updated timestamp */
  lastUpdated: z.date().default(() => new Date()),
});

// Export inferred types for medical information
export type Dependent = z.infer<typeof DependentSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type PreExistingCondition = z.infer<typeof PreExistingConditionSchema>;
export type Allergy = z.infer<typeof AllergySchema>;
export type RecentMedicalEvent = z.infer<typeof RecentMedicalEventSchema>;
export type PersonMedicalInfo = z.infer<typeof PersonMedicalInfoSchema>;
export type MedicalInformation = z.infer<typeof MedicalInformationSchema>;
export type MedicalScenarioResult = z.infer<typeof MedicalScenarioResultSchema>;

// =============================================================================
// TYPE EXPORTS FOR HEALTHCARE INFORMATION
// =============================================================================

export type PersonHealthInfo = z.infer<typeof PersonHealthInfoSchema>;
export type HealthcareInformation = z.infer<typeof HealthcareInformationSchema>;