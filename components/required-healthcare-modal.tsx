"use client";

import { HealthcareInformationModal } from "@/components/healthcare-information-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useHealthcareInformation } from "@/hooks/use-healthcare-information";
import { AlertCircle, Heart, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Required Healthcare Modal Component
 * 
 * Displays a required modal on first visit when no healthcare information exists.
 * This modal explains the benefits of providing healthcare information and guides
 * users to complete their healthcare profile for personalized analysis.
 * 
 * Features:
 * - Shows only on first visit when no healthcare info exists
 * - Cannot be dismissed without completing or explicitly skipping
 * - Provides clear value proposition for healthcare information
 * - Direct integration with the healthcare information modal
 */
export function RequiredHealthcareModal() {
  const { hasCompleteInfo, isLoading } = useHealthcareInformation();
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);

  // Check if user has previously dismissed the required modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("healthcare_modal_dismissed");
      setHasBeenDismissed(dismissed === "true");
    }
  }, []);

  // Show required modal if:
  // 1. Not loading
  // 2. No complete healthcare info
  // 3. User hasn't previously dismissed it
  useEffect(() => {
    if (!isLoading && !hasCompleteInfo && !hasBeenDismissed) {
      setShowRequiredModal(true);
    } else {
      setShowRequiredModal(false);
    }
  }, [isLoading, hasCompleteInfo, hasBeenDismissed]);

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("healthcare_modal_dismissed", "true");
    }
    setHasBeenDismissed(true);
    setShowRequiredModal(false);
  };



  if (!showRequiredModal) {
    return null;
  }

  return (
    <Dialog open={showRequiredModal} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" hideCloseButton>
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Heart className="h-7 w-7 text-red-500" />
            Welcome to Health Insurance Coverage Analyzer
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Get personalized insurance analysis by sharing your healthcare information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Personalized Analysis</h3>
              <p className="text-sm text-blue-700 mt-1">
                Get coverage recommendations tailored to your specific health needs
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Family Coverage</h3>
              <p className="text-sm text-green-700 mt-1">
                Include all family members for comprehensive household analysis
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Cost Estimates</h3>
              <p className="text-sm text-purple-700 mt-1">
                Accurate predictions based on your conditions and medications
              </p>
            </div>
          </div>

          {/* Information Types */}
          <div className="bg-muted/50 rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-3">We&apos;ll help you track:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-red-500"></Badge>
                Pre-existing conditions
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                Current medications
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-yellow-500"></Badge>
                Known allergies
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                Expected medical events
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900">Your Privacy is Protected</h4>
              <p className="text-sm text-amber-800 mt-1">
                All healthcare information is stored locally on your device and never transmitted to external servers. 
                                 Only you have access to this information, and it&apos;s used solely to enhance your insurance analysis experience.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <HealthcareInformationModal>
              <Button className="flex-1 flex items-center gap-2" size="lg">
                <Heart className="h-4 w-4" />
                Add My Healthcare Information
              </Button>
            </HealthcareInformationModal>
            
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
              size="lg"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can always add or update your healthcare information later using the button in the header.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 