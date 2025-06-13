"use client";

import { useHealthcareInformation } from "@/hooks/use-healthcare-information";
import type { HealthcareInformation, PersonHealthInfo } from "@/types/schemas";
import { createContext, ReactNode, useContext } from "react";

/**
 * Healthcare Context Type Definition
 * Provides the interface for healthcare information management throughout the app
 */
interface HealthcareContextType {
  // Data state
  healthcareInfo: HealthcareInformation | null;
  isLoading: boolean;
  error: string | null;
  
  // Status checks
  hasCompleteInfo: boolean;
  summary: {
    memberCount: number;
    conditionsCount: number;
    medicationsCount: number;
    allergiesCount: number;
    eventsCount: number;
  };
  
  // Update methods
  updateHealthcareInfo: (data: HealthcareInformation) => boolean;
  addMember: (member: Omit<PersonHealthInfo, "id">) => boolean;
  updateMember: (memberId: string, updates: Partial<PersonHealthInfo>) => boolean;
  removeMember: (memberId: string) => boolean;
  clearHealthcareInfo: () => void;
  
  // Utility methods
  refreshFromStorage: () => void;
}

/**
 * Healthcare Context
 * Provides healthcare information state and methods to child components
 */
const HealthcareContext = createContext<HealthcareContextType | undefined>(undefined);

/**
 * Healthcare Provider Component
 * 
 * Wraps the application to provide healthcare information management.
 * Uses the useHealthcareInformation hook to manage state and integrate
 * with localStorage and AI chat runtime.
 * 
 * @param children - Child components that need access to healthcare context
 */
export function HealthcareProvider({ children }: { children: ReactNode }) {
  const healthcareHook = useHealthcareInformation();
  
  return (
    <HealthcareContext.Provider value={healthcareHook}>
      {children}
    </HealthcareContext.Provider>
  );
}

/**
 * Healthcare Context Hook
 * 
 * Custom hook to access healthcare information context.
 * Must be used within a HealthcareProvider.
 * 
 * @returns Healthcare context object with state and methods
 * @throws Error if used outside of HealthcareProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { healthcareInfo, hasCompleteInfo, updateHealthcareInfo } = useHealthcareContext();
 *   // ... component logic
 * }
 * ```
 */
export function useHealthcareContext() {
  const context = useContext(HealthcareContext);
  if (context === undefined) {
    throw new Error("useHealthcareContext must be used within a HealthcareProvider");
  }
  return context;
} 