# Health Insurance Coverage Analyzer - Usage Examples

This document provides comprehensive examples of how to use the Health Insurance Coverage Analyzer application.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Policy Analysis Example](#policy-analysis-example)
3. [AI-Powered Category Generation](#ai-powered-category-generation)
4. [Custom Hook Usage](#custom-hook-usage)
5. [Component Integration](#component-integration)
6. [Error Handling Examples](#error-handling-examples)
7. [Service Layer Usage](#service-layer-usage)

## Basic Setup

### Environment Variables
```bash
# Required API keys
GROQ_API_KEY=your_groq_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
UNSTRUCTURED_API_KEY=your_unstructured_api_key_here
BLOB_READ_WRITE_TOKEN=your_blob_storage_token_here
TRIGGER_SECRET_KEY=your_trigger_secret_here
```

### Installation and Development
```bash
# Install dependencies (using Bun - preferred runtime)
bun install

# Start development server
bun run dev

# Run linting
bun run lint

# Fetch sample insurance plans (development utility)
bun run fetch:plans
```

## Policy Analysis Example

### 1. Basic Policy Analysis Usage

```typescript
// Example of analyzing a healthcare situation
import { analyzeSituation } from "@/actions/insurance-analyzer";

async function analyzeEmergencyRoomVisit() {
  const situation = "Emergency room visit for chest pain with EKG and blood work";
  const context = {
    isInNetwork: true,
    deductibleSpent: 1000,
    outOfPocketSpent: 2000,
    deductibleLimit: 5000,
    outOfPocketLimit: 8000
  };

  try {
    const analysis = await analyzeSituation(situation, context);
    
    console.log("Estimated Cost:", analysis.estimatedCost);
    console.log("Coverage Details:", analysis.coverageDetails);
    console.log("Recommendations:", analysis.recommendations);
    
    return analysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback analysis is automatically provided by the service
  }
}
```

### 2. Category Generation Example

```typescript
// Generate insurance categories for a specific query
import { generateCategories } from "@/actions/insurance-analyzer";
import type { InsuranceSettings } from "@/types/schemas";

async function generateHealthcareCategories() {
  const query = "maternity care and prenatal visits";
  const context: InsuranceSettings = {
    isInNetwork: true,
    deductibleSpent: 500,
    outOfPocketSpent: 1200,
    deductibleLimit: 3000,
    outOfPocketLimit: 7000
  };
  
  // Sample policy data (normally loaded from parsed PDF)
  const policy = {
    plan_name: "Blue Cross Premium Plan",
    benefits: [
      {
        type: "MATERNITY_CARE",
        name: "Maternity Care",
        covered: true,
        cost_sharings: [
          {
            network_tier: "In-Network",
            copay_amount: 50,
            display_string: "$50 copay"
          }
        ]
      }
    ],
    deductibles: [
      {
        type: "Combined Medical and Drug EHB Deductible",
        amount: 3000,
        network_tier: "In-Network"
      }
    ],
    moops: [
      {
        type: "Maximum Out of Pocket for Medical and Drug EHB Benefits",
        amount: 7000,
        network_tier: "In-Network"
      }
    ]
  };

  try {
    const result = await generateCategories(query, context, policy);
    
    console.log("Generated Categories:", result.categories.length);
    console.log("Formatted Query:", result.formatted_query);
    
    result.categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Estimated Cost: $${category.estimated_cost}`);
      console.log(`   Subcategories: ${category.subcategories.length}`);
    });
    
    return result;
  } catch (error) {
    console.error("Category generation failed:", error);
    // Returns empty categories array and original query as fallback
  }
}
```

## AI-Powered Category Generation

### Example with Real Insurance Data

```typescript
import { InsuranceAIService } from "@/lib/services/insurance-ai-service";
import type { GenerateCategoriesInput } from "@/types/schemas";

async function demonstrateAIAnalysis() {
  const input: GenerateCategoriesInput = {
    query: "annual physical exam and preventive care",
    context: {
      isInNetwork: true,
      deductibleSpent: 0,
      outOfPocketSpent: 0,
      deductibleLimit: 2500,
      outOfPocketLimit: 6000
    },
    policy: {
      plan_name: "HealthFirst Silver Plan",
      benefits: [
        {
          type: "PREVENTIVE_CARE",
          name: "Preventive Care",
          covered: true,
          cost_sharings: [
            {
              network_tier: "In-Network",
              copay_amount: 0,
              display_string: "No Charge"
            }
          ]
        }
      ],
      deductibles: [
        {
          type: "Combined Medical and Drug EHB Deductible", 
          amount: 2500,
          network_tier: "In-Network"
        }
      ],
      moops: [
        {
          type: "Maximum Out of Pocket for Medical and Drug EHB Benefits",
          amount: 6000,
          network_tier: "In-Network"
        }
      ]
    }
  };

  try {
    // This uses the multi-model AI strategy (Claude → Groq → fallback)
    const result = await InsuranceAIService.generateCategories(input);
    
    console.log("AI Analysis Results:");
    console.log("- Categories found:", result.categories.length);
    console.log("- Processed query:", result.formatted_query);
    
    return result;
  } catch (error) {
    console.error("AI service error:", error);
    // Service automatically provides fallback response
  }
}
```

## Custom Hook Usage

### 1. Using Category Analysis Hook

```typescript
// components/insurance-category-display.tsx
"use client";

import { useCategoryAnalysis } from "@/hooks/use-category-analysis";
import { AIErrorBoundary } from "@/components/error-boundaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsuranceCategoryDisplay() {
  const {
    categories,
    loading,
    error,
    generateCategories,
    navigateToCategory
  } = useCategoryAnalysis();

  const handleAnalyze = async () => {
    const query = "emergency surgery and hospital stay";
    const context = {
      isInNetwork: true,
      deductibleSpent: 1500,
      outOfPocketSpent: 2000,
      deductibleLimit: 4000,
      outOfPocketLimit: 8000
    };

    await generateCategories(query, context);
  };

  if (loading) {
    return <div className="animate-pulse">Analyzing coverage...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <AIErrorBoundary>
      <div className="space-y-4">
        <Button onClick={handleAnalyze} disabled={loading}>
          Analyze Coverage
        </Button>
        
        {categories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {category.description}
              </p>
              <p className="font-semibold">
                Estimated Cost: ${category.estimated_cost}
              </p>
              
              {category.subcategories.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Subcategories:</h4>
                  <ul className="space-y-1">
                    {category.subcategories.map((sub, subIndex) => (
                      <li key={subIndex} className="text-sm">
                        • {sub.name} - ${sub.estimated_cost}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="mt-3"
                onClick={() => navigateToCategory(category)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AIErrorBoundary>
  );
}
```

### 2. Using Insurance Settings Hook

```typescript
// components/insurance-settings-panel.tsx
"use client";

import { useInsuranceSettings } from "@/hooks/use-insurance-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function InsuranceSettingsPanel() {
  const {
    settings,
    updateSettings,
    resetSettings,
    isValid,
    validationErrors
  } = useInsuranceSettings();

  const handleDeductibleChange = (value: string) => {
    const deductibleSpent = parseFloat(value) || 0;
    updateSettings({ deductibleSpent });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="network"
            checked={settings.isInNetwork}
            onCheckedChange={(isInNetwork) => updateSettings({ isInNetwork })}
          />
          <Label htmlFor="network">
            In-Network Provider
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="deductible-spent">Deductible Spent</Label>
            <Input
              id="deductible-spent"
              type="number"
              value={settings.deductibleSpent}
              onChange={(e) => handleDeductibleChange(e.target.value)}
              placeholder="$0"
            />
          </div>
          
          <div>
            <Label htmlFor="deductible-limit">Deductible Limit</Label>
            <Input
              id="deductible-limit"
              type="number"
              value={settings.deductibleLimit}
              onChange={(e) => updateSettings({ 
                deductibleLimit: parseFloat(e.target.value) || 0 
              })}
              placeholder="$5000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="oop-spent">Out-of-Pocket Spent</Label>
            <Input
              id="oop-spent"
              type="number"
              value={settings.outOfPocketSpent}
              onChange={(e) => updateSettings({ 
                outOfPocketSpent: parseFloat(e.target.value) || 0 
              })}
              placeholder="$0"
            />
          </div>
          
          <div>
            <Label htmlFor="oop-limit">Out-of-Pocket Limit</Label>
            <Input
              id="oop-limit"
              type="number"
              value={settings.outOfPocketLimit}
              onChange={(e) => updateSettings({ 
                outOfPocketLimit: parseFloat(e.target.value) || 0 
              })}
              placeholder="$8000"
            />
          </div>
        </div>

        {!isValid && validationErrors.length > 0 && (
          <div className="text-red-600 text-sm">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={resetSettings}
            size="sm"
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Component Integration

### Complete Policy Upload and Analysis Component

```typescript
// components/policy-upload-analyzer.tsx
"use client";

import { useState } from "react";
import { useCategoryAnalysis } from "@/hooks/use-category-analysis";
import { useInsuranceSettings } from "@/hooks/use-insurance-settings";
import { parseSBCFile } from "@/actions/parse";
import { AIErrorBoundary } from "@/components/error-boundaries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function PolicyUploadAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [policy, setPolicy] = useState(null);

  const { categories, loading: analyzing, generateCategories } = useCategoryAnalysis();
  const { settings } = useInsuranceSettings();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const result = await parseSBCFile(formData);
      setPolicy(result);
      console.log("Policy parsed successfully:", result);
    } catch (error) {
      console.error("Failed to parse policy:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!policy || !query.trim()) return;

    await generateCategories(query, settings, policy);
  };

  return (
    <AIErrorBoundary>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Insurance Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-gray-600 mt-2">
                Parsing PDF... This may take a few moments.
              </p>
            )}
            {policy && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Policy uploaded and parsed successfully
              </p>
            )}
          </CardContent>
        </Card>

        {/* Query Input */}
        {policy && (
          <Card>
            <CardHeader>
              <CardTitle>Analyze Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What healthcare service do you need?
                </label>
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Annual physical exam, Emergency room visit, Prescription medication..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleAnalyze}
                disabled={!query.trim() || analyzing}
                className="w-full"
              >
                {analyzing ? "Analyzing..." : "Analyze Coverage"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-700 mb-3">
                      {category.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        ${category.estimated_cost}
                      </span>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AIErrorBoundary>
  );
}
```

## Error Handling Examples

### Using Error Boundaries

```typescript
// components/app-with-error-handling.tsx
import { AIErrorBoundary } from "@/components/error-boundaries/ai-error-boundary";
import { GeneralErrorBoundary } from "@/components/error-boundaries/general-error-boundary";
import { PolicyUploadAnalyzer } from "./policy-upload-analyzer";

export function AppWithErrorHandling() {
  return (
    <GeneralErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Health Insurance Coverage Analyzer
            </h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 px-4">
          {/* AI operations wrapped in AI-specific error boundary */}
          <AIErrorBoundary>
            <PolicyUploadAnalyzer />
          </AIErrorBoundary>
        </main>
      </div>
    </GeneralErrorBoundary>
  );
}
```

## Service Layer Usage

### Direct Service Integration

```typescript
// lib/example-service-usage.ts
import { InsuranceAIService } from "@/lib/services/insurance-ai-service";
import { PolicyService } from "@/lib/services/policy-service";
import type { 
  GenerateCategoriesInput, 
  GenerateSituationSuggestionsInput 
} from "@/types/schemas";

export class InsuranceAnalysisExample {
  
  /**
   * Example: Process a policy file and generate categories
   */
  static async processNewPolicy(file: File, userQuery: string) {
    try {
      // 1. Parse the policy document
      const formData = new FormData();
      formData.append("file", file);
      
      // Note: This would normally use PolicyService.parseDocument
      // but using the existing action for this example
      const parsedPolicy = await parseSBCFile(formData);
      
      // 2. Generate categories based on user query
      const categoriesInput: GenerateCategoriesInput = {
        query: userQuery,
        context: {
          isInNetwork: true,
          deductibleSpent: 0,
          outOfPocketSpent: 0,
          deductibleLimit: 5000,
          outOfPocketLimit: 10000
        },
        policy: parsedPolicy
      };
      
      const categoriesResult = await InsuranceAIService.generateCategories(categoriesInput);
      
      // 3. Generate situation-based suggestions
      const suggestionsInput: GenerateSituationSuggestionsInput = {
        situation: `User is interested in: ${userQuery}`,
        context: categoriesInput.context,
        policy: parsedPolicy
      };
      
      const suggestionsResult = await InsuranceAIService.generateSituationSuggestions(suggestionsInput);
      
      return {
        policy: parsedPolicy,
        categories: categoriesResult.categories,
        suggestions: suggestionsResult.suggestions,
        success: true
      };
      
    } catch (error) {
      console.error("Policy processing failed:", error);
      return {
        policy: null,
        categories: [],
        suggestions: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Example: Batch analyze multiple healthcare scenarios
   */
  static async batchAnalyzeScenarios(scenarios: string[], settings: InsuranceSettings) {
    const results = [];
    
    for (const scenario of scenarios) {
      try {
        const analysis = await InsuranceAIService.analyzeSituation(scenario, settings);
        results.push({
          scenario,
          analysis,
          success: true
        });
      } catch (error) {
        results.push({
          scenario,
          analysis: null,
          success: false,
          error: error instanceof Error ? error.message : "Analysis failed"
        });
      }
    }
    
    return results;
  }
}

// Usage example
async function demonstrateServiceUsage() {
  const scenarios = [
    "Annual physical exam and blood work",
    "Emergency room visit for broken arm",
    "Prescription medication for diabetes",
    "Mental health counseling sessions"
  ];
  
  const settings = {
    isInNetwork: true,
    deductibleSpent: 500,
    outOfPocketSpent: 1200,
    deductibleLimit: 3000,
    outOfPocketLimit: 7000
  };
  
  const results = await InsuranceAnalysisExample.batchAnalyzeScenarios(scenarios, settings);
  
  console.log("Batch Analysis Results:");
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.scenario}`);
    if (result.success) {
      console.log(`   Cost: $${result.analysis.estimatedCost}`);
      console.log(`   Coverage: ${result.analysis.coverageDetails}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
}
```

## Advanced Usage Patterns

### Chat Integration with Assistant UI

```typescript
// components/insurance-chat-assistant.tsx
"use client";

import { useAssistant } from "@assistant-ui/react";
import { Thread } from "@assistant-ui/react";
import { useInsuranceSettings } from "@/hooks/use-insurance-settings";

export function InsuranceChatAssistant() {
  const { settings } = useInsuranceSettings();
  
  const assistant = useAssistant({
    api: "/api/chat",
    initialMessages: [
      {
        role: "assistant",
        content: "Hi! I'm your insurance coverage assistant. Upload your policy document and ask me anything about your coverage!"
      }
    ]
  });

  return (
    <div className="max-w-4xl mx-auto h-[600px]">
      <Thread
        assistantMessage={{
          components: {
            Text: ({ children }) => (
              <div className="prose prose-sm max-w-none">
                {children}
              </div>
            )
          }
        }}
        userMessage={{
          components: {
            Text: ({ children }) => (
              <div className="bg-blue-600 text-white rounded-lg p-3">
                {children}
              </div>
            )
          }
        }}
      />
    </div>
  );
}
```

---

## Quick Start Guide

1. **Set up environment variables** (see [Basic Setup](#basic-setup))
2. **Install dependencies**: `bun install`
3. **Start development server**: `bun run dev`
4. **Upload an insurance policy PDF**
5. **Ask questions about your coverage**
6. **Get AI-powered analysis and cost estimates**

## Key Features Demonstrated

- ✅ Multi-model AI integration (Claude + Groq with fallbacks)
- ✅ PDF policy document parsing
- ✅ Real-time cost estimation
- ✅ Category-based coverage analysis
- ✅ Custom React hooks for state management
- ✅ Comprehensive error handling with boundaries
- ✅ Responsive UI with shadcn/ui components
- ✅ TypeScript strict mode with Zod validation
- ✅ Service layer architecture with caching

## Next Steps

- Customize the AI prompts for your specific use cases
- Add user authentication and data persistence
- Implement additional insurance document types
- Add more sophisticated cost calculation algorithms
- Integrate with insurance provider APIs for real-time data

For more detailed information, see the project documentation in [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md). 