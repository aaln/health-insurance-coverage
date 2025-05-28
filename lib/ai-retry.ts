import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { CoreMessage, generateObject, LanguageModelV1 } from "ai";
import { toast } from "sonner";
import z from 'zod';

interface AIRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  context?: string;
  temperatures?: number[]; // Array of temperatures to try
  backupModel?: unknown; // Backup model to try if all temperature attempts fail
}

export async function withAIRetry<T>(
  fn: (temperature?: number, model?: unknown) => Promise<T>,
  options: AIRetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    context = "",
    temperatures = [0.5, 0.7, 0.9], // Default temperatures to try
    backupModel = groq('meta-llama/llama-4-scout-17b-16e-instruct'), // Default backup model
  } = options;

  let lastError: unknown;
  let attemptCount = 0;

  // Try each temperature in sequence
  for (const temperature of temperatures) {
    if (attemptCount >= maxAttempts) break;
    
    try {
      attemptCount++;
      return await fn(temperature);
    } catch (error) {
      lastError = error;
      
      if (attemptCount === maxAttempts) {
        // If we've exhausted all temperature retries and have a backup model, try it
        if (backupModel) {
          try {
            return await fn(0.5, backupModel); // Use conservative temperature with backup
          } catch (backupError) {
            lastError = backupError;
          }
        }
        break;
      }

      // Log the error and notify user of retry
      console.error(`${context} - Attempt ${attemptCount} failed with temperature ${temperature}:`, error);
      toast.error(`Retrying ${context.toLowerCase()} with different parameters... (Attempt ${attemptCount}/${maxAttempts})`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attemptCount));
    }
  }

  // If we've exhausted all retries and backup, throw the final error
  const errorMessage = `${context} failed after ${attemptCount} attempts${backupModel ? ' and backup model' : ''}: ${(lastError as Error)?.message || 'Unknown error'}`;
  throw new Error(errorMessage);
}


export const generateObjectWithAIRetry = async <T = unknown>({
  model = anthropic("claude-sonnet-4-20250514"),
  prompt,
  system,
  messages,
  schema,
  backupModel = anthropic("claude-sonnet-4-20250514"),
}: {
  model: unknown;
  prompt?: string;
  system?: string;
  messages?: unknown[];
  schema: unknown;
  backupModel?: unknown;
}): Promise<T> => {
  return withAIRetry<T>(
    async (temperature = 0.5, fallbackModel?) => {
      const result = await generateObject({
        model: fallbackModel as LanguageModelV1 || model,
        prompt,
        system,
        messages: messages as CoreMessage[],
        schema: schema as z.ZodSchema,
        temperature,
      });
      return (result as { object: T }).object;
    },
    {
      temperatures: [0.5, 0.7, 0.9, 0.3],
      backupModel
    }
  );
};
