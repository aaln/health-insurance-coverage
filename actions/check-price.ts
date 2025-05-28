"use server";
import { z } from "zod";
import { generateObjectWithAIRetry } from "@/lib/ai-retry";
import { anthropic } from "@ai-sdk/anthropic";
import { priceCheckSchema, PriceCheckResult } from "@/lib/tools/frontend/price-check-tool";
import { groq } from "@ai-sdk/groq";

export const checkPrice = async (args: z.infer<typeof priceCheckSchema>): Promise<{ results: PriceCheckResult[] }> => {
  // Validate input
  const parsed = priceCheckSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error("Invalid arguments for price check");
  }
  const { query, isInNetwork, deductibleSpent, outOfPocketSpent } = parsed.data;

  const schema = z.object({
    results: z.array(
      z.object({
        name: z.string(),
        estimatedCost: z.number(),
        details: z.string(),
      })
    ),
  });

  const system = `You are a helpful medical cost estimator. Given a query about a medical condition, treatment, or medication, estimate the typical out-of-pocket cost for a patient in the US. Consider whether the patient is in-network, their deductible spent, and out-of-pocket spent. Return an array of objects with name, estimatedCost (in USD), and details.`;

  const messages = [
    {
      role: "user",
      content: `Query: ${query}\nIn-Network: ${isInNetwork}\nDeductible Spent: $${deductibleSpent}\nOut-of-Pocket Spent: $${outOfPocketSpent}`,
    },
  ];

  const result = await generateObjectWithAIRetry({
    model: groq("compound-beta"),
    system,
    messages,
    schema,
  });

  return result;
}; 