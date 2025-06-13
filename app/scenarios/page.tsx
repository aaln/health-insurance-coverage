"use client";

import { MedicalInformationForm } from "@/components/medical-information-form";
import { usePolicy } from "@/components/policy-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MedicalInformation, MedicalScenarioResult } from "@/types/schemas";
import { AlertCircle, Calculator, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function ScenariosPage() {

  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<MedicalScenarioResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { policy } = usePolicy();

  const handleFormSubmit = async (medicalData: MedicalInformation) => {
    if (!policy) {
      setError("Please upload and analyze a policy document first from the main page.");
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      console.log("Calculating costs for medical data:", medicalData);
      
      // Call API to calculate costs
      const response = await fetch("/api/calculate-costs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicalData,
          policy,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to calculate costs: ${response.statusText}`);
      }

      const calculatedResults = await response.json();
      setResults(calculatedResults);
    } catch (error) {
      console.error("Cost calculation failed:", error);
      setError(error instanceof Error ? error.message : "Failed to calculate costs");
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case "A":
        return "bg-green-100 text-green-800 border-green-200";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "D":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "F":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (        
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          Healthcare Cost Scenarios
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter your medical information to get personalized cost estimates and policy scores for different healthcare scenarios.
        </p>
      </div>

      {/* Policy Status Alert */}
      {!policy && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to upload and analyze a policy document first. Please go back to the main page and upload your Summary of Benefits and Coverage document.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Medical Information Form */}
      <MedicalInformationForm
        onSubmit={handleFormSubmit}
        isLoading={isCalculating}
        className="mb-8"
      />

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-2xl font-bold">Cost Analysis Results</h2>
            <Badge variant="secondary">{results.length} scenarios analyzed</Badge>
          </div>

          <div className="grid gap-6">
            {results.map((result, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{result.scenario}</CardTitle>
                      <CardDescription>
                        Annual cost estimate based on your medical profile
                      </CardDescription>
                    </div>
                    <Badge className={getScoreColor(result.policyScore)} variant="outline">
                      Grade: {result.policyScore}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Cost Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Total Annual Cost</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatCurrency(result.estimatedAnnualCost)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg border">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">You Pay</span>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {formatCurrency(result.userPayment)}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg border">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Insurance Pays</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(result.insurancePayment)}
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Cost Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Deductible:</span>
                        <span className="font-medium">{formatCurrency(result.costBreakdown.deductiblePayment)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Coinsurance:</span>
                        <span className="font-medium">{formatCurrency(result.costBreakdown.coinsurancePayment)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Copayments:</span>
                        <span className="font-medium">{formatCurrency(result.costBreakdown.copayments)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Out-of-Pocket Max:</span>
                        <span className="font-medium">{formatCurrency(result.costBreakdown.outOfPocketMax)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recommendations</h4>
                      <ul className="space-y-1">
                        {result.recommendations.map((recommendation, recIndex) => (
                          <li key={recIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}