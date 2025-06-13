"use client";

import { HealthcareInformationSchema, type HealthcareInformation, type PersonHealthInfo } from "@/types/schemas";
import { useComposerRuntime } from "@assistant-ui/react";
import { useCallback, useEffect, useState } from "react";

const HEALTHCARE_STORAGE_KEY = "healthcare_information";

/**
 * Custom hook for managing healthcare information with localStorage persistence
 * 
 * This hook provides centralized management of household healthcare information
 * including members' medical conditions, medications, allergies, and expected events.
 * 
 * Features:
 * - Persistent storage via localStorage (never expires)
 * - Integration with AI chat runtime for contextual assistance
 * - Type-safe validation using Zod schemas
 * - Optimistic updates with error handling
 * 
 * @returns Object containing healthcare data, loading state, error state, and methods
 */
export function useHealthcareInformation() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [healthcareInfo, setHealthcareInfoState] = useState<HealthcareInformation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const composerRuntime = useComposerRuntime();

  // ========================================================================
  // STORAGE OPERATIONS
  // ========================================================================
  
  /**
   * Load healthcare information from localStorage
   */
  const loadFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const stored = localStorage.getItem(HEALTHCARE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validate with Zod schema
        const validatedData = HealthcareInformationSchema.parse({
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated), // Convert string back to Date
        });
        
        setHealthcareInfoState(validatedData);
        updateChatRuntime(validatedData);
      }
    } catch (err) {
      console.error("Failed to load healthcare information:", err);
      setError("Failed to load healthcare information");
      // Clear invalid data
      localStorage.removeItem(HEALTHCARE_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save healthcare information to localStorage
   */
  const saveToStorage = useCallback((data: HealthcareInformation) => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(HEALTHCARE_STORAGE_KEY, JSON.stringify(data));
      updateChatRuntime(data);
    } catch (err) {
      console.error("Failed to save healthcare information:", err);
      setError("Failed to save healthcare information");
    }
  }, []);

  /**
   * Update the AI chat runtime with healthcare context
   */
  const updateChatRuntime = useCallback((data: HealthcareInformation | null) => {
    if (!composerRuntime) return;
    
    try {
      const currentConfig = composerRuntime.getState().runConfig?.custom || {};
      
      composerRuntime.setRunConfig({
        custom: {
          ...currentConfig,
          healthcareInfo: data ? JSON.stringify({
            memberCount: data.members.length,
            members: data.members.map(member => ({
              name: member.name,
              age: member.age,
              relationship: member.relationship,
              hasConditions: member.preExistingConditions.length > 0,
              hasMedications: member.currentMedications.length > 0,
              hasAllergies: member.allergies.length > 0,
              hasExpectedEvents: member.expectedMedicalEvents.length > 0,
              smoker: member.smoker,
              expectedUsage: member.expectedUsage,
              // Include specific details for AI context
              preExistingConditions: member.preExistingConditions,
              currentMedications: member.currentMedications,
              allergies: member.allergies,
              expectedMedicalEvents: member.expectedMedicalEvents,
            })),
            householdInfo: {
              annualIncome: data.annualIncome,
              zipCode: data.zipCode,
            },
          }) : null,
        },
      });
    } catch (err) {
      console.error("Failed to update chat runtime:", err);
    }
  }, [composerRuntime]);

  // ========================================================================
  // LIFECYCLE EFFECTS
  // ========================================================================
  
  // Load data on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // ========================================================================
  // PUBLIC METHODS
  // ========================================================================
  
  /**
   * Update healthcare information with validation
   */
  const updateHealthcareInfo = useCallback((data: HealthcareInformation) => {
    try {
      setError(null);
      
      // Validate data with Zod schema
      const validatedData = HealthcareInformationSchema.parse({
        ...data,
        lastUpdated: new Date(),
      });
      
      setHealthcareInfoState(validatedData);
      saveToStorage(validatedData);
      
      return true;
    } catch (err) {
      console.error("Failed to update healthcare information:", err);
      setError(err instanceof Error ? err.message : "Invalid healthcare information");
      return false;
    }
  }, [saveToStorage]);

  /**
   * Add a new member to the household
   */
  const addMember = useCallback((member: Omit<PersonHealthInfo, "id">) => {
    if (!healthcareInfo) {
      // If no healthcare info exists, create initial structure
      const primaryMember: PersonHealthInfo = {
        id: "primary",
        name: "Primary Member",
        age: member.age || 30,
        relationship: "self",
        preExistingConditions: member.preExistingConditions || [],
        currentMedications: member.currentMedications || [],
        allergies: member.allergies || [],
        expectedMedicalEvents: member.expectedMedicalEvents || [],
        smoker: member.smoker || false,
        expectedUsage: member.expectedUsage || "moderate",
      };
      
      return updateHealthcareInfo({
        members: [primaryMember],
        lastUpdated: new Date(),
      });
    }
    
    const memberCount = healthcareInfo.members.length;
    const newMember: PersonHealthInfo = {
      ...member,
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Member ${memberCount + 1}`,
      relationship: memberCount === 0 ? "self" : "spouse", // First member is self, others default to spouse
    };
    
    return updateHealthcareInfo({
      ...healthcareInfo,
      members: [...healthcareInfo.members, newMember],
    });
  }, [healthcareInfo, updateHealthcareInfo]);

  /**
   * Update a specific member's information
   */
  const updateMember = useCallback((memberId: string, updates: Partial<PersonHealthInfo>) => {
    if (!healthcareInfo) return false;
    
    const updatedMembers = healthcareInfo.members.map(member =>
      member.id === memberId ? { ...member, ...updates } : member
    );
    
    return updateHealthcareInfo({
      ...healthcareInfo,
      members: updatedMembers,
    });
  }, [healthcareInfo, updateHealthcareInfo]);

  /**
   * Remove a member from the household
   */
  const removeMember = useCallback((memberId: string) => {
    if (!healthcareInfo) return false;
    
    // Don't allow removal if it's the only member
    if (healthcareInfo.members.length <= 1) {
      setError("At least one member is required");
      return false;
    }
    
    return updateHealthcareInfo({
      ...healthcareInfo,
      members: healthcareInfo.members.filter(member => member.id !== memberId),
    });
  }, [healthcareInfo, updateHealthcareInfo]);

  /**
   * Clear all healthcare information
   */
  const clearHealthcareInfo = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(HEALTHCARE_STORAGE_KEY);
    }
    setHealthcareInfoState(null);
    updateChatRuntime(null);
  }, [updateChatRuntime]);

  /**
   * Check if healthcare information is complete
   */
  const hasCompleteInfo = useCallback(() => {
    if (!healthcareInfo || healthcareInfo.members.length === 0) return false;
    
    // Check if primary member (self) exists
    const hasPrimaryMember = healthcareInfo.members.some(member => member.relationship === "self");
    
    return hasPrimaryMember;
  }, [healthcareInfo]);

  /**
   * Get summary statistics for display
   */
  const getSummary = useCallback(() => {
    if (!healthcareInfo) {
      return {
        memberCount: 0,
        conditionsCount: 0,
        medicationsCount: 0,
        allergiesCount: 0,
        eventsCount: 0,
      };
    }
    
    return {
      memberCount: healthcareInfo.members.length,
      conditionsCount: healthcareInfo.members.reduce((sum, member) => sum + member.preExistingConditions.length, 0),
      medicationsCount: healthcareInfo.members.reduce((sum, member) => sum + member.currentMedications.length, 0),
      allergiesCount: healthcareInfo.members.reduce((sum, member) => sum + member.allergies.length, 0),
      eventsCount: healthcareInfo.members.reduce((sum, member) => sum + member.expectedMedicalEvents.length, 0),
    };
  }, [healthcareInfo]);

  // ========================================================================
  // RETURN HOOK INTERFACE
  // ========================================================================
  
  return {
    // Data state
    healthcareInfo,
    isLoading,
    error,
    
    // Status checks
    hasCompleteInfo: hasCompleteInfo(),
    summary: getSummary(),
    
    // Update methods
    updateHealthcareInfo,
    addMember,
    updateMember,
    removeMember,
    clearHealthcareInfo,
    
    // Utility methods
    refreshFromStorage: loadFromStorage,
  };
} 