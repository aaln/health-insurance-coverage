import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MedicalInformationSchema, MedicalScenarioResultSchema, ParsedPolicySchema } from "@/types/schemas";
import type { MedicalInformation, ParsedPolicy, MedicalScenarioResult } from "@/types/schemas";
import { generateObjectWithAIRetry } from "@/lib/ai-retry";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";

const RequestSchema = z.object({
  medicalData: MedicalInformationSchema,
  policy: ParsedPolicySchema,
});

const AI_MODELS = {
  ANALYSIS: anthropic("claude-sonnet-4-20250514"),
  FALLBACK: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const { medicalData, policy } = RequestSchema.parse(body);
    
    console.log("Calculating costs for medical data:", {
      primaryMember: medicalData.primaryMember,
      dependentsCount: medicalData.dependents.length,
      conditionsCount: medicalData.primaryMedicalInfo.preExistingConditions.length,
      medicationsCount: medicalData.primaryMedicalInfo.currentMedications.length,
    });

    // Generate healthcare scenarios based on medical information
    const scenarios = await generateHealthcareScenarios(medicalData);
    
    // Calculate costs for each scenario
    const results: MedicalScenarioResult[] = [];
    
    for (const scenario of scenarios) {
      try {
        const result = await calculateScenarioCosts(scenario, medicalData, policy);
        results.push(result);
      } catch (error) {
        console.error(`Failed to calculate costs for scenario: ${scenario}`, error);
        // Add a fallback result for failed scenarios
        results.push({
          scenario,
          estimatedAnnualCost: 0,
          userPayment: 0,
          insurancePayment: 0,
          costBreakdown: {
            deductiblePayment: 0,
            coinsurancePayment: 0,
            copayments: 0,
            outOfPocketMax: policy.important_questions.out_of_pocket_limit_for_plan.individual,
          },
          policyScore: "N/A",
          recommendations: ["Unable to calculate costs for this scenario. Please contact your insurance provider."],
        });
      }
    }

    return NextResponse.json(results);
    
  } catch (error) {
    console.error("Cost calculation API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to calculate costs", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function generateHealthcareScenarios(
  medicalData: MedicalInformation
): Promise<string[]> {
  const systemPrompt = `You are a healthcare cost analyst. Based on the user's medical information and insurance policy, generate 5-8 realistic healthcare scenarios that they might encounter in the next year.

Consider their:
- Age: ${medicalData.primaryMember.age}
- Pre-existing conditions: ${medicalData.primaryMedicalInfo.preExistingConditions.map(c => c.condition).join(", ") || "None"}
- Current medications: ${medicalData.primaryMedicalInfo.currentMedications.map(m => m.name).join(", ") || "None"}
- Expected usage: ${medicalData.primaryMedicalInfo.expectedUsage}
- Smoker status: ${medicalData.primaryMedicalInfo.smoker ? "Yes" : "No"}
- Dependents: ${medicalData.dependents.length}

Generate scenarios that are:
1. Realistic for their medical profile
2. Specific enough to calculate costs
3. Cover a range from routine to emergency care
4. Include both planned and unexpected healthcare needs

Return only the scenario descriptions as a JSON array of strings.`;

  try {
    const result = await generateObjectWithAIRetry({
      model: AI_MODELS.ANALYSIS,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "Generate realistic healthcare scenarios for cost analysis.",
        },
      ],
      schema: z.object({
        scenarios: z.array(z.string()),
      }),
      backupModel: AI_MODELS.FALLBACK,
    }) as { scenarios: string[] };

    return result.scenarios;
  } catch (error) {
    console.error("Failed to generate scenarios:", error);
    
    // Return fallback scenarios
    const fallbackScenarios = [
      "Annual physical exam and routine lab work",
      "Prescription medication refills for the year", 
      "Urgent care visit for minor illness",
      "Specialist consultation and follow-up",
      "Emergency room visit for acute condition",
    ];

    // Add condition-specific scenarios if applicable
    if (medicalData.primaryMedicalInfo.preExistingConditions.length > 0) {
      fallbackScenarios.push("Management of chronic condition with multiple appointments");
    }

    if (medicalData.primaryMember.age > 50) {
      fallbackScenarios.push("Preventive screening tests (colonoscopy, mammogram, etc.)");
    }

    return fallbackScenarios;
  }
}

async function calculateScenarioCosts(
  scenario: string,
  medicalData: MedicalInformation,
  policy: ParsedPolicy
): Promise<MedicalScenarioResult> {
  const systemPrompt = `You are an expert health insurance cost calculator. Calculate realistic costs for a specific healthcare scenario.

Scenario: ${scenario}

Patient Profile:
- Age: ${medicalData.primaryMember.age}
- Pre-existing conditions: ${medicalData.primaryMedicalInfo.preExistingConditions.map(c => c.condition).join(", ") || "None"}
- Current medications: ${medicalData.primaryMedicalInfo.currentMedications.map(m => `${m.name} (${m.type})`).join(", ") || "None"}
- Expected usage: ${medicalData.primaryMedicalInfo.expectedUsage}
- Smoker: ${medicalData.primaryMedicalInfo.smoker ? "Yes" : "No"}

Insurance Policy Details:
- Plan Type: ${policy.plan_summary.plan_type}
- Individual Deductible: $${policy.important_questions.overall_deductible.individual}
- Family Deductible: $${policy.important_questions.overall_deductible.family}
- Out-of-Pocket Max (Individual): $${policy.important_questions.out_of_pocket_limit_for_plan.individual}
- Out-of-Pocket Max (Family): $${policy.important_questions.out_of_pocket_limit_for_plan.family}

Services Coverage:
${policy.services_you_may_need.map(service => 
  `- ${service.name}: Network: ${service.what_you_will_pay.network_provider}, Out-of-Network: ${service.what_you_will_pay.out_of_network_provider}`
).join("\n")}

Calculate:
1. Total estimated annual cost for this scenario
2. How much the user will pay out of pocket
3. How much insurance will cover
4. Breakdown of costs (deductible, coinsurance, copays, out-of-pocket max impact)
5. Policy grade (A-F) for this scenario
6. 3-5 specific recommendations

Assume in-network providers. Be realistic about costs and consider:
- Current medical expenses (medications, ongoing conditions)
- Typical costs for the scenario type
- How deductibles and out-of-pocket maximums work
- Coinsurance percentages and copayments from the policy`;

  try {
    const result = await generateObjectWithAIRetry({
      model: AI_MODELS.ANALYSIS,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Calculate detailed costs for this healthcare scenario: "${scenario}"`,
        },
      ],
      schema: MedicalScenarioResultSchema,
      backupModel: AI_MODELS.FALLBACK,
    }) as MedicalScenarioResult;

    // Validate the result
    return MedicalScenarioResultSchema.parse(result);
    
  } catch (error) {
    console.error(`Failed to calculate costs for scenario: ${scenario}`, error);
    throw error;
  }
}