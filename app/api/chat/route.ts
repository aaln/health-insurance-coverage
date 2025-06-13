import { groq } from "@ai-sdk/groq";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
// import { experimental_createMCPClient as createMCPClient } from "ai";
// import { agentops } from 'agentops';

// export const runtime = "edge";
export const maxDuration = 30;

// const mcpClient = await createMCPClient({
//   // TODO adjust this to point to your MCP server URL
//   transport: {
//     type: "sse",
//     url: "http://localhost:8000/sse",
//   },
// });

// const mcpTools = await mcpClient.tools();

export async function POST(req: Request) {
  const { messages, system, tools, runConfig } = await req.json();

  // Extract healthcare information from runConfig
  const healthcareContext = runConfig?.custom?.healthcareInfo 
    ? JSON.parse(runConfig.custom.healthcareInfo) 
    : null;

  // Build healthcare context string for the prompt
  let healthcarePromptSection = "";
  if (healthcareContext && healthcareContext.members) {
    healthcarePromptSection = `
HOUSEHOLD HEALTHCARE INFORMATION:
- Total members: ${healthcareContext.memberCount}
- Annual income: ${healthcareContext.householdInfo?.annualIncome ? `$${healthcareContext.householdInfo.annualIncome.toLocaleString()}` : 'Not provided'}
- ZIP code: ${healthcareContext.householdInfo?.zipCode || 'Not provided'}

MEMBER DETAILS:
${healthcareContext.members.map((member: { name?: string; relationship: string; age: number; smoker: boolean; expectedUsage: string; preExistingConditions: string[]; currentMedications: string[]; allergies: string[]; expectedMedicalEvents: string[]; }, index: number) => `
Member ${index + 1} (${member.name || 'Unnamed'}) - ${member.relationship} - Age ${member.age}
- Smoker: ${member.smoker ? 'Yes' : 'No'}
- Expected usage: ${member.expectedUsage}
- Pre-existing conditions: ${member.preExistingConditions.length > 0 ? member.preExistingConditions.join(', ') : 'None'}
- Current medications: ${member.currentMedications.length > 0 ? member.currentMedications.join(', ') : 'None'}
- Allergies: ${member.allergies.length > 0 ? member.allergies.join(', ') : 'None'}
- Expected medical events: ${member.expectedMedicalEvents.length > 0 ? member.expectedMedicalEvents.join(', ') : 'None'}
`).join('')}

IMPORTANT: Use this healthcare information to provide personalized advice about:
- Coverage for specific conditions and medications
- Cost estimates based on expected healthcare usage
- Recommendations for preventive care and wellness
- Network provider suggestions for specific conditions
- Prior authorization requirements for medications
- Coverage limitations for pre-existing conditions
`;
  }

  const fullSystemPrompt = `
  You are a health insurance expert helping users understand their coverage in the context of their specific healthcare needs.
  
  CORE CAPABILITIES:
  - Analyze insurance policies against individual healthcare needs
  - Provide personalized cost estimates and coverage advice
  - Recommend optimal healthcare strategies based on member profiles
  - Explain complex insurance terms in simple language
  - Guide users through claims processes and prior authorizations
  
  BE HELPFUL, PERSONALIZED, AND CONCISE IN YOUR RESPONSES.

  CURRENT INSURANCE CONTEXT:
  - Network: ${runConfig?.custom?.isInNetwork ? "In-Network" : "Out-of-Network"}
  - Current Deductible Spent: $${runConfig?.custom?.deductibleSpent || 0}
  - Current Out-of-pocket Spent: $${runConfig?.custom?.outOfPocketSpent || 0}
  
  ${healthcarePromptSection}
  
  CURRENT USER POLICY: ${runConfig?.custom?.policy || 'No policy uploaded'}
  
  ${system ? `ADDITIONAL SYSTEM INSTRUCTIONS: ${system}` : ""}
  
  RESPONSE GUIDELINES:
  - Always consider the user's specific healthcare needs when providing advice
  - Mention relevant conditions, medications, or allergies when applicable
  - Provide cost estimates based on their deductible and out-of-pocket spending
  - Recommend specific actions based on their healthcare profile
  - Be empathetic to health concerns while maintaining professional accuracy
  `;

  console.log("Full system prompt with healthcare context:", fullSystemPrompt);

  const result = streamText({
    model: groq('compound-beta'),// groq('compound-beta-mini')
    messages,
    // forward system prompt and tools from the frontend
    toolCallStreaming: true,
    system: fullSystemPrompt,
    tools: {
      ...frontendTools(tools),
      // ...mcpTools,
    },
    onError: console.log,
  });

  return result.toDataStreamResponse();
}
