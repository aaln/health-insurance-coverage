import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { generateObject } from "ai";
import { toast } from "sonner";

interface AIRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  context?: string;
  temperatures?: number[]; // Array of temperatures to try
  backupModel?: any; // Backup model to try if all temperature attempts fail
}

export async function withAIRetry<T>(
  fn: (temperature?: number, model?: any) => Promise<T>,
  options: AIRetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    context = "",
    temperatures = [0.5, 0.7, 0.9], // Default temperatures to try
    backupModel = groq('meta-llama/llama-4-scout-17b-16e-instruct'), // Default backup model
  } = options;

  let lastError: any;
  let attemptCount = 0;

  // Try each temperature in sequence
  for (const temperature of temperatures) {
    if (attemptCount >= maxAttempts) break;
    
    try {
      attemptCount++;
      return await fn(temperature);
    } catch (error: any) {
      lastError = error;
      
      if (attemptCount === maxAttempts) {
        // If we've exhausted all temperature retries and have a backup model, try it
        if (backupModel) {
          try {
            return await fn(0.5, backupModel); // Use conservative temperature with backup
          } catch (backupError: any) {
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
  const errorMessage = `${context} failed after ${attemptCount} attempts${backupModel ? ' and backup model' : ''}: ${lastError?.message || 'Unknown error'}`;
  throw new Error(errorMessage);
}


export const generateObjectWithAIRetry = async ({
  model = anthropic("claude-sonnet-4-20250514"),
  prompt,
  system,
  messages,
  schema,
  backupModel = anthropic("claude-sonnet-4-20250514"),
}: {
  model: any;
  prompt?: string;
  system?: string;
  messages?: any[];
  schema: any;
  backupModel?: any;
}): Promise<any> => {
  return withAIRetry(
    async (temperature = 0.5, fallbackModel?) => {
      const result = await generateObject({
        model: fallbackModel || model,
        prompt,
        system,
        messages,
        schema,
        temperature,
        output: "object"
      });
      return result.object;
    },
    {
      temperatures: [0.5, 0.7, 0.9, 0.3],
      backupModel
    }
  );
};
