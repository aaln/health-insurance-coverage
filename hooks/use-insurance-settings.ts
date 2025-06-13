/**
 * Custom hook for centralized insurance settings management
 * 
 * This hook provides a centralized way to manage user insurance settings
 * such as deductible spending, out-of-pocket spending, and network preferences.
 * It handles persistence to localStorage and provides validation for setting values.
 * 
 * Key features:
 * - Centralized settings state management
 * - Automatic localStorage persistence
 * - Settings validation with Zod schemas
 * - Optimistic updates with rollback on error
 * - Type-safe setting updates
 * - Change detection and callbacks
 */

import { InsuranceSettingsSchema, type InsuranceSettings } from "@/types/schemas";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Configuration options for the insurance settings hook
 */
interface UseInsuranceSettingsOptions {
  /** Initial settings (will be overridden by localStorage if available) */
  initialSettings?: Partial<InsuranceSettings>;
  /** Whether to persist settings to localStorage */
  persist?: boolean;
  /** localStorage key for persistence */
  storageKey?: string;
  /** Callback when settings change */
  onSettingsChange?: (newSettings: InsuranceSettings, previousSettings: InsuranceSettings) => void;
  /** Callback when settings validation fails */
  onValidationError?: (error: z.ZodError, attemptedSettings: Partial<InsuranceSettings>) => void;
}

/**
 * Return type for the insurance settings hook
 */
interface UseInsuranceSettingsReturn {
  // Current state
  /** Current insurance settings */
  settings: InsuranceSettings;
  /** Whether settings are being loaded from storage */
  loading: boolean;
  /** Most recent validation error, if any */
  error: z.ZodError | null;
  /** Whether settings have been modified from defaults */
  isModified: boolean;
  
  // Update actions
  /** Update multiple settings at once */
  updateSettings: (updates: Partial<InsuranceSettings>) => void;
  /** Update a single setting */
  updateSetting: <K extends keyof InsuranceSettings>(key: K, value: InsuranceSettings[K]) => void;
  /** Reset settings to defaults */
  resetSettings: () => void;
  /** Validate current settings */
  validateSettings: () => boolean;
  
  // Utility getters
  /** Get remaining deductible amount */
  getRemainingDeductible: (totalDeductible: number) => number;
  /** Get remaining out-of-pocket amount */
  getRemainingOutOfPocket: (totalOutOfPocketMax: number) => number;
  /** Check if deductible is met */
  isDeductibleMet: (totalDeductible: number) => boolean;
  /** Get network status as human-readable string */
  getNetworkStatus: () => "In-Network" | "Out-of-Network";
}

/**
 * Default insurance settings
 * These represent typical starting values for a new user
 */
const DEFAULT_SETTINGS: InsuranceSettings = {
  deductibleSpent: 500,
  outOfPocketSpent: 1200,
  isInNetwork: true,
};

/**
 * Custom hook for managing insurance settings with persistence and validation
 * 
 * @param options Configuration options for the hook
 * @returns Object with settings state and management functions
 * 
 * @example
 * ```tsx
 * const {
 *   settings,
 *   updateSettings,
 *   updateSetting,
 *   getRemainingDeductible,
 *   isDeductibleMet
 * } = useInsuranceSettings({
 *   persist: true,
 *   onSettingsChange: (newSettings) => {
 *     console.log("Settings updated:", newSettings);
 *   }
 * });
 * 
 * // Update multiple settings
 * updateSettings({
 *   deductibleSpent: 1000,
 *   isInNetwork: false
 * });
 * 
 * // Update single setting
 * updateSetting("outOfPocketSpent", 2500);
 * ```
 */
export function useInsuranceSettings({
  initialSettings = {},
  persist = true,
  storageKey = "insurance_settings",
  onSettingsChange,
  onValidationError,
}: UseInsuranceSettingsOptions = {}): UseInsuranceSettingsReturn {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [settings, setSettings] = useState<InsuranceSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  }));
  const [loading, setLoading] = useState(persist); // Start loading if we need to load from storage
  const [error, setError] = useState<z.ZodError | null>(null);
  const [originalSettings] = useState<InsuranceSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  }));

  // ========================================================================
  // VALIDATION HELPERS
  // ========================================================================
  
  /**
   * Validate settings using Zod schema
   */
  const validateSettings = useCallback((settingsToValidate: InsuranceSettings): boolean => {
    try {
      InsuranceSettingsSchema.parse(settingsToValidate);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err);
        if (onValidationError) {
          onValidationError(err, settingsToValidate);
        } else {
          // Default validation error handling
          const errorMessages = err.errors.map(e => e.message).join(", ");
          toast.error(`Invalid settings: ${errorMessages}`);
        }
      }
      return false;
    }
  }, [onValidationError]);


  // ========================================================================
  // CORE ACTIONS
  // ========================================================================
  
  /**
   * Update multiple settings at once
   */
  const updateSettings = useCallback((updates: Partial<InsuranceSettings>): void => {
    console.log("Updating settings:", updates);
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, ...updates };
      
      // Validate the new settings
      if (validateSettings(newSettings)) {
        // Persist to localStorage if enabled
        if (persist && typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(newSettings));
          } catch (err) {
            console.warn("Failed to persist settings to localStorage:", err);
          }
        }
        
        // Notify listeners of the change
        if (onSettingsChange) {
          onSettingsChange(newSettings, prevSettings);
        }
        
        return newSettings;
      } else {
        console.warn("Settings update failed validation, rolling back");
        return prevSettings;
      }
    });
  }, [validateSettings, persist, storageKey, onSettingsChange]);

  /**
   * Update a single setting
   */
  const updateSetting = useCallback(<K extends keyof InsuranceSettings>(
    key: K,
    value: InsuranceSettings[K]
  ): void => {
    updateSettings({ [key]: value } as Partial<InsuranceSettings>);
  }, [updateSettings]);

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback((): void => {
    console.log("Resetting settings to defaults");
    setSettings(prevSettings => {
      // Persist to localStorage if enabled
      if (persist && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SETTINGS));
        } catch (err) {
          console.warn("Failed to persist settings to localStorage:", err);
        }
      }
      
      // Notify listeners of the change
      if (onSettingsChange) {
        onSettingsChange(DEFAULT_SETTINGS, prevSettings);
      }
      
      toast.success("Settings reset to defaults");
      return DEFAULT_SETTINGS;
    });
  }, [persist, storageKey, onSettingsChange]);

  /**
   * Validate current settings
   */
  const validateCurrentSettings = useCallback((): boolean => {
    return validateSettings(settings);
  }, [settings, validateSettings]);

  // ========================================================================
  // UTILITY GETTERS
  // ========================================================================
  
  /**
   * Calculate remaining deductible amount
   */
  const getRemainingDeductible = useCallback((totalDeductible: number): number => {
    return Math.max(0, totalDeductible - settings.deductibleSpent);
  }, [settings.deductibleSpent]);

  /**
   * Calculate remaining out-of-pocket amount
   */
  const getRemainingOutOfPocket = useCallback((totalOutOfPocketMax: number): number => {
    return Math.max(0, totalOutOfPocketMax - settings.outOfPocketSpent);
  }, [settings.outOfPocketSpent]);

  /**
   * Check if deductible has been met
   */
  const isDeductibleMet = useCallback((totalDeductible: number): boolean => {
    return settings.deductibleSpent >= totalDeductible;
  }, [settings.deductibleSpent]);

  /**
   * Get network status as human-readable string
   */
  const getNetworkStatus = useCallback((): "In-Network" | "Out-of-Network" => {
    return settings.isInNetwork ? "In-Network" : "Out-of-Network";
  }, [settings.isInNetwork]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  
  /**
   * Check if settings have been modified from their original state
   */
  const isModified = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  /**
   * Load settings from localStorage on mount
   */
  useEffect(() => {
    if (persist && typeof window !== "undefined") {
      setLoading(true);
      
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          const mergedSettings = { ...DEFAULT_SETTINGS, ...initialSettings, ...parsedSettings };
          
          // Validate loaded settings using schema directly (avoid callback dependency)
          try {
            InsuranceSettingsSchema.parse(mergedSettings);
            setSettings(mergedSettings);
            setError(null);
            console.log("Loaded settings from localStorage:", mergedSettings);
          } catch (validationErr) {
            console.warn("Loaded settings failed validation, using defaults");
            if (validationErr instanceof z.ZodError) {
              setError(validationErr);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load settings from localStorage:", err);
        toast.warning("Could not load saved settings, using defaults");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [persist, storageKey]);

  // ========================================================================
  // RETURN VALUE
  // ========================================================================
  
  return {
    // Current state
    settings,
    loading,
    error,
    isModified,
    
    // Update actions
    updateSettings,
    updateSetting,
    resetSettings,
    validateSettings: validateCurrentSettings,
    
    // Utility getters
    getRemainingDeductible,
    getRemainingOutOfPocket,
    isDeductibleMet,
    getNetworkStatus,
  };
}