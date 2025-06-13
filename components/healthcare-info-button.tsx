"use client";

import { HealthcareInformationModal } from "@/components/healthcare-information-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHealthcareInformation } from "@/hooks/use-healthcare-information";
import { Heart, Plus } from "lucide-react";

/**
 * Healthcare Information Button Component
 * 
 * Displays healthcare information status and provides access to the healthcare modal.
 * Shows different states based on whether healthcare information is available.
 * 
 * Features:
 * - Visual indicator of healthcare information status
 * - Member count badge when information is available
 * - Responsive design for different screen sizes
 * - Accessible button with proper ARIA labels
 */
export function HealthcareInfoButton() {
  const { hasCompleteInfo, summary, isLoading } = useHealthcareInformation();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="flex items-center gap-2">
        <Heart className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  return (
    <HealthcareInformationModal>
      <Button
        variant={hasCompleteInfo ? "outline" : "default"}
        size="sm"
        className="flex items-center gap-2 transition-colors"
        title={
          hasCompleteInfo
            ? `Healthcare information for ${summary.memberCount} member${summary.memberCount !== 1 ? "s" : ""}`
            : "Add healthcare information for personalized analysis"
        }
      >
        {hasCompleteInfo ? (
          <>
            <Heart className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">Healthcare Info</span>
            <Badge variant="secondary" className="ml-1">
              {summary.memberCount}
            </Badge>
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Healthcare Info</span>
          </>
        )}
      </Button>
    </HealthcareInformationModal>
  );
} 