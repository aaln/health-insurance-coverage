/**
 * Custom hook for managing insurance category analysis
 * 
 * This hook encapsulates all the logic for generating, managing, and navigating
 * insurance categories using AI analysis. It separates the complex AI operations
 * from UI components, making the code more testable and reusable.
 * 
 * Key features:
 * - Manages category generation with loading states
 * - Handles breadcrumb navigation
 * - Provides search functionality
 * - Manages error states with user-friendly messages
 * - Optimizes API calls with proper dependency tracking
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { generateCategories } from "@/actions/insurance-analyzer";
import type { 
  CategoryWithSubcategories, 
  InsuranceSettings, 
  ParsedPolicy 
} from "@/types/schemas";

/**
 * Configuration options for the category analysis hook
 */
interface UseCategoryAnalysisOptions {
  /** The user's parsed insurance policy */
  policy: ParsedPolicy | null;
  /** Current insurance settings (network preference, spending, etc.) */
  settings: InsuranceSettings;
  /** Whether to auto-load categories on mount */
  autoLoad?: boolean;
  /** Custom error handler (defaults to toast notifications) */
  onError?: (error: Error, context: string) => void;
}

/**
 * Return type for the category analysis hook
 */
interface UseCategoryAnalysisReturn {
  // State
  /** Currently displayed categories */
  categories: CategoryWithSubcategories[];
  /** Loading state for category operations */
  loading: boolean;
  /** Current breadcrumb navigation path */
  breadcrumbs: CategoryWithSubcategories[];
  /** Most recent error, if any */
  error: Error | null;
  
  // Actions
  /** Load categories for a specific query */
  loadCategories: (query: string) => Promise<void>;
  /** Navigate to a specific category (adds to breadcrumbs) */
  selectCategory: (category: CategoryWithSubcategories) => Promise<void>;
  /** Navigate back to a specific breadcrumb level */
  navigateToBreadcrumb: (index: number) => Promise<void>;
  /** Perform a new search, clearing breadcrumbs */
  searchCategories: (query: string) => Promise<void>;
  /** Reset to initial state */
  reset: () => void;
  
  // Utilities
  /** Get the current breadcrumb path as a readable string */
  getBreadcrumbPath: () => string;
  /** Check if we're at the root level (no breadcrumbs) */
  isAtRoot: boolean;
}

/**
 * Custom hook for managing insurance category analysis with AI
 * 
 * @param options Configuration options for the hook
 * @returns Object with state and actions for category management
 * 
 * @example
 * ```tsx
 * const {
 *   categories,
 *   loading,
 *   breadcrumbs,
 *   selectCategory,
 *   searchCategories,
 *   navigateToBreadcrumb
 * } = useCategoryAnalysis({
 *   policy: userPolicy,
 *   settings: userSettings,
 *   autoLoad: true
 * });
 * ```
 */
export function useCategoryAnalysis({
  policy,
  settings,
  autoLoad = true,
  onError,
}: UseCategoryAnalysisOptions): UseCategoryAnalysisReturn {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryWithSubcategories[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  
  /**
   * Get the current breadcrumb path as a human-readable string
   */
  const getBreadcrumbPath = useCallback((): string => {
    return breadcrumbs.map((crumb) => crumb.name).join(" > ");
  }, [breadcrumbs]);

  /**
   * Handle errors with consistent messaging and optional custom handler
   */
  const handleError = useCallback((err: unknown, context: string) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    
    if (onError) {
      onError(error, context);
    } else {
      // Default error handling with user-friendly messages
      const userMessage = error.message.includes("network") 
        ? "Network error. Please check your connection and try again."
        : `Failed to ${context}. Please try again.`;
      
      toast.error(userMessage);
      console.error(`Category Analysis Error (${context}):`, error);
    }
  }, [onError]);

  /**
   * Generate the appropriate query string based on current context
   */
  const buildQuery = useCallback((baseQuery: string): string => {
    const networkContext = settings.isInNetwork ? "in-network" : "out-of-network";
    const breadcrumbPath = getBreadcrumbPath();
    
    if (breadcrumbPath) {
      return `${breadcrumbPath} > ${baseQuery} focused on ${networkContext}`;
    }
    
    return baseQuery || `overall coverage focused on ${networkContext}`;
  }, [settings.isInNetwork, getBreadcrumbPath]);

  // ========================================================================
  // CORE ACTIONS
  // ========================================================================
  
  /**
   * Load categories for a specific query
   * This is the core function that interfaces with the AI service
   */
  const loadCategories = useCallback(async (query: string): Promise<void> => {
    if (!policy) {
      console.warn("Cannot load categories: no policy available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullQuery = buildQuery(query);
      console.log("Loading categories with query:", fullQuery);
      
      const result = await generateCategories(fullQuery, settings, policy);
      setCategories(result.categories);
      
      // Success feedback for non-initial loads
      if (query.trim()) {
        toast.success("Categories loaded successfully");
      }
    } catch (err) {
      handleError(err, "load categories");
      setCategories([]); // Clear categories on error
    } finally {
      setLoading(false);
    }
  }, [policy, settings, buildQuery, handleError]);

  /**
   * Navigate to a specific category, adding it to the breadcrumb trail
   */
  const selectCategory = useCallback(async (category: CategoryWithSubcategories): Promise<void> => {
    console.log("Selecting category:", category.name);
    
    const newBreadcrumbs = [...breadcrumbs, category];
    setBreadcrumbs(newBreadcrumbs);
    
    const breadcrumbPath = newBreadcrumbs.map(c => c.name).join(" > ");
    await loadCategories(breadcrumbPath);
  }, [breadcrumbs, loadCategories]);

  /**
   * Navigate back to a specific breadcrumb level
   * @param index Breadcrumb index to navigate to (-1 for root)
   */
  const navigateToBreadcrumb = useCallback(async (index: number): Promise<void> => {
    let newBreadcrumbs: CategoryWithSubcategories[];
    
    if (index === -1) {
      // Navigate to root
      newBreadcrumbs = [];
    } else {
      // Navigate to specific breadcrumb level
      newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    }
    
    setBreadcrumbs(newBreadcrumbs);
    
    const breadcrumbPath = newBreadcrumbs.map(c => c.name).join(" > ");
    await loadCategories(breadcrumbPath || "overall coverage");
  }, [breadcrumbs, loadCategories]);

  /**
   * Perform a new search, clearing the breadcrumb trail
   */
  const searchCategories = useCallback(async (query: string): Promise<void> => {
    console.log("Searching categories with query:", query);
    setBreadcrumbs([]); // Clear breadcrumbs for new search
    await loadCategories(query);
  }, [loadCategories]);

  /**
   * Reset the hook to its initial state
   */
  const reset = useCallback((): void => {
    setCategories([]);
    setBreadcrumbs([]);
    setError(null);
    setLoading(false);
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  /**
   * Auto-load categories when policy or settings change
   */
  useEffect(() => {
    if (autoLoad && policy) {
      // Reset state and load initial categories
      setBreadcrumbs([]);
      
      // Call loadCategories directly to avoid dependency issues
      const networkContext = settings.isInNetwork ? "in-network" : "out-of-network";
      const query = `overall coverage focused on ${networkContext}`;
      
      setLoading(true);
      setError(null);

      console.log("Auto-loading categories with query:", query);
      
      generateCategories(query, settings, policy)
        .then(({ categories }) => {
          setCategories(categories);
          console.log(`Auto-loaded ${categories.length} categories`);
        })
        .catch((err) => {
          handleError(err, "auto-load categories");
          setCategories([]);
        })
        .finally(() => setLoading(false));
    }
  }, [policy, settings.isInNetwork, settings.deductibleSpent, settings.outOfPocketSpent, autoLoad, handleError]);

  // ========================================================================
  // RETURN VALUE
  // ========================================================================
  
  return {
    // State
    categories,
    loading,
    breadcrumbs,
    error,
    
    // Actions
    loadCategories,
    selectCategory,
    navigateToBreadcrumb,
    searchCategories,
    reset,
    
    // Utilities
    getBreadcrumbPath,
    isAtRoot: breadcrumbs.length === 0,
  };
}