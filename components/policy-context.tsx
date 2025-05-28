import { useComposerRuntime } from "@assistant-ui/react";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface PlanSummary {
  plan_name: string;
  coverage_period: {
    start_date: string;
    end_date: string;
  };
  coverage_for: string;
  plan_type: string;
  issuer_name: string;
  issuer_contact_info: {
    phone: string;
    website: string;
  };
}

export interface ImportantQuestions {
  overall_deductible: {
    individual: number;
    family: number;
    details?: string;
  };
  services_covered_before_deductible: {
    covered: boolean;
    services: string[];
    details?: string;
  };
  deductibles_for_specific_services: {
    exists: boolean;
    details?: string;
  };
  out_of_pocket_limit_for_plan: {
    individual: number;
    family: number;
    details?: string;
  };
  not_included_in_out_of_pocket_limit: {
    services: string[];
    details?: string;
  };
  network_provider_savings: {
    lower_costs: boolean;
    website: string;
    phone: string;
    details?: string;
  };
  need_referral_for_specialist_care: {
    required: boolean;
    details?: string;
  };
}

export interface ServiceYouMayNeed {
  name: string;
  what_you_will_pay: {
    network_provider: string;
    out_of_network_provider: string;
    limitations_exceptions_and_other_important_information: string;
  };
}

export interface ExcludedAndOtherCoveredServices {
  excluded_services: string[];
  other_covered_services: string[];
}

export interface ParsedPolicy {
  file_url: string;
  image_urls: string[];
  plan_summary: PlanSummary;
  important_questions: ImportantQuestions;
  services_you_may_need: ServiceYouMayNeed[];
  excluded_and_other_covered_services: ExcludedAndOtherCoveredServices;
}

interface PolicyContextType {
  policy: ParsedPolicy | null;
  setPolicy: (policy: ParsedPolicy | null) => void;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "current_policy";

export const PolicyProvider = ({ children }: { children: ReactNode }) => {
  const [policy, setPolicyState] = useState<ParsedPolicy | null>(null);
  const composerRuntime = useComposerRuntime();
  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          setPolicyState(JSON.parse(stored));
          console.log("setting policy run config", policy)
          const cleanedPolicy = {
            ...policy,
            image_urls: [],
          }
          composerRuntime.setRunConfig({
            custom: {
              ...composerRuntime.getState().runConfig?.custom,
              policy: JSON.stringify(cleanedPolicy),
            },
          });
        } catch {}
      }
    }
  }, [composerRuntime, setPolicyState, policy]);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (policy) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(policy));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    console.log("setting policy run config", policy)
    const cleanedPolicy = {
      ...policy,
      image_urls: [],
    };
    composerRuntime.setRunConfig({
      custom: {
        ...composerRuntime.getState().runConfig?.custom,
        policy: JSON.stringify(cleanedPolicy),
      },
    });
  }, [policy, composerRuntime]);

  const setPolicy = (p: ParsedPolicy | null) => {
    setPolicyState(p);
  };

  return (
    <PolicyContext.Provider value={{ policy, setPolicy }}>
      {children}
    </PolicyContext.Provider>
  );
};

export function usePolicy() {
  const context = useContext(PolicyContext);
  if (context === undefined) {
    throw new Error("usePolicy must be used within a PolicyProvider");
  }
  return context;
} 