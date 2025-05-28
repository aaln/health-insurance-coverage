import { groq } from "@ai-sdk/groq";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
// import { experimental_createMCPClient as createMCPClient } from "ai";

export const runtime = "edge";
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

  const fullSystemPrompt = `
  You are a health insurance expert.  Guide the user through the process of understanding their health insurance coverage.
  You have access to the user's health insurance policy and can answer questions about their coverage.
  You can also navigate the user's health insurance policy to find the information they need.
  
  BE HELPFUL AND CONCISE IN YOUR RESPONSES.

  - Network: ${runConfig?.custom?.isInNetwork ? "In-Network" : "Out-of-Network"}
  - Current Deductible: $${runConfig?.custom?.deductibleSpent}
  - Current Out-of-pocket: $${runConfig?.custom?.outOfPocketSpent}
  
  Current user policy: ${runConfig?.custom?.policy}
  ${system ? `System prompt: ${system}` : ""}
  `;

  console.log(fullSystemPrompt);

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
