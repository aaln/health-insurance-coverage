/**
 * Custom hook for managing healthcare situation suggestions
 * 
 * This hook handles the generation and management of contextual healthcare
 * situation suggestions that help users understand their insurance coverage
 * for specific scenarios. It works alongside the category analysis system
 * to provide relevant, actionable suggestions.
 * 
 * Key features:
 * - Generates contextual suggestions based on current category/query
 * - Manages loading states for suggestion generation
 * - Handles errors gracefully with fallback suggestions
 * - Debounces requests to avoid excessive API calls
 * - Provides click handlers for suggestion interaction
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { generateSituations } from "@/actions/insurance-analyzer";
import type { ParsedPolicy, InsuranceSettings } from "@/types/schemas";

/**
 * Configuration options for the situation suggestions hook
 */
interface UseSituationSuggestionsOptions {
  /** The user's parsed insurance policy */
  policy: ParsedPolicy | null;
  /** Current insurance settings for context */
  settings: InsuranceSettings;
  /** Current category being analyzed (for contextual suggestions) */
  currentCategory?: string;
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;
  /** Custom suggestion click handler */
  onSuggestionClick?: (suggestion: string) => void;
  /** Custom error handler */
  onError?: (error: Error, context: string) => void;
}

/**
 * Return type for the situation suggestions hook
 */
interface UseSituationSuggestionsReturn {
  // State
  /** Array of current situation suggestions */
  suggestions: string[];
  /** Loading state for suggestion generation */
  loading: boolean;
  /** Most recent error, if any */
  error: Error | null;
  
  // Actions
  /** Generate suggestions for a specific query */
  generateSuggestions: (query: string) => Promise<void>;
  /** Handle clicking on a suggestion */
  handleSuggestionClick: (suggestion: string) => void;
  /** Refresh suggestions with the last query */
  refresh: () => Promise<void>;
  /** Clear all suggestions and reset state */
  clear: () => void;
  
  // Utilities
  /** Whether suggestions are available */
  hasSuggestions: boolean;
  /** Whether the hook is ready to generate suggestions */
  isReady: boolean;
}

/**
 * Default fallback suggestions when AI generation fails
 * These cover common healthcare scenarios that most users encounter
 */
const DEFAULT_SUGGESTIONS = [
  "What if I need an MRI?",
  "Emergency room visit costs",
  "Monthly prescription expenses", 
  "Specialist consultation fees",
  "Preventive care coverage",
  "Physical therapy sessions",
  "Urgent care visit costs",
  "Lab test coverage",
];

/**
 * Custom hook for managing healthcare situation suggestions
 * 
 * @param options Configuration options for the hook
 * @returns Object with state and actions for suggestion management
 * 
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   loading,
 *   generateSuggestions,
 *   handleSuggestionClick,
 *   hasSuggestions
 * } = useSituationSuggestions({
 *   policy: userPolicy,
 *   settings: userSettings,
 *   currentCategory: "Primary Care",
 *   onSuggestionClick: (suggestion) => {
 *     // Handle suggestion click (e.g., add to chat)
 *     composerRuntime.setText(suggestion);
 *     composerRuntime.send();
 *   }
 * });
 * ```
 */
export function useSituationSuggestions({
  policy,
  settings,
  currentCategory,
  debounceMs = 500,
  onSuggestionClick,
  onError,
}: UseSituationSuggestionsOptions): UseSituationSuggestionsReturn {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  
  // Ref for managing debounced requests
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  
  /**
   * Handle errors with consistent messaging and optional custom handler
   */
  const handleError = useCallback((err: unknown, context: string) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    
    if (onError) {
      onError(error, context);
    } else {
      // Use fallback suggestions instead of showing error to user
      console.warn(`Situation Suggestions Warning (${context}):`, error);
      setSuggestions(DEFAULT_SUGGESTIONS);
    }
  }, [onError]);

  /**
   * Clean up any pending requests or timeouts
   */
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ========================================================================
  // CORE ACTIONS
  // ========================================================================
  
  /**
   * Generate suggestions for a specific query
   * Includes debouncing to avoid excessive API calls
   */
  const generateSuggestions = useCallback(async (query: string): Promise<void> => {
    if (!policy) {
      console.warn("Cannot generate suggestions: no policy available");
      // If no policy, show default suggestions immediately
      setSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }

    // Store the query for potential refresh calls
    setLastQuery(query);
    
    // Clean up any pending requests
    cleanup();
    
    // Debounce the request
    return new Promise((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        try {
          console.log("Generating suggestions for query:", query);
          
          const context = {
            isInNetwork: settings.isInNetwork,
            currentCategory: currentCategory || query,
          };
          
          const newSuggestions = await generateSituations(query, context, policy);
          
          // Only update if this request wasn't aborted
          if (!abortControllerRef.current?.signal.aborted) {
            setSuggestions(newSuggestions);
          }
          
          resolve();
        } catch (err) {
          // Only handle error if request wasn't aborted
          if (!abortControllerRef.current?.signal.aborted) {
            handleError(err, "generate suggestions");
          }
          resolve();
        } finally {
          if (!abortControllerRef.current?.signal.aborted) {
            setLoading(false);
          }
        }
      }, debounceMs);
    });
  }, [policy, settings, currentCategory, debounceMs, handleError, cleanup]);

  /**
   * Handle clicking on a suggestion
   */
  const handleSuggestionClick = useCallback((suggestion: string): void => {
    console.log("Suggestion clicked:", suggestion);
    
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      console.warn("No suggestion click handler provided");
    }
  }, [onSuggestionClick]);

  /**
   * Refresh suggestions using the last query
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (lastQuery) {
      await generateSuggestions(lastQuery);
    }
  }, [lastQuery, generateSuggestions]);

  /**
   * Clear all suggestions and reset state
   */
  const clear = useCallback((): void => {
    cleanup();
    setSuggestions([]);
    setError(null);
    setLoading(false);
    setLastQuery("");
  }, [cleanup]);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  /**
   * Auto-generate suggestions when currentCategory changes or when policy loads
   * If no category is provided, generate general suggestions
   */
  useEffect(() => {
    if (policy) {
      const query = currentCategory || "general healthcare situations";
      generateSuggestions(query);
    }
  }, [policy, currentCategory, generateSuggestions]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  
  const hasSuggestions = suggestions.length > 0;
  const isReady = Boolean(policy && !loading);

  // ========================================================================
  // RETURN VALUE
  // ========================================================================
  
  return {
    // State
    suggestions,
    loading,
    error,
    
    // Actions
    generateSuggestions,
    handleSuggestionClick,
    refresh,
    clear,
    
    // Utilities
    hasSuggestions,
    isReady,
  };
}