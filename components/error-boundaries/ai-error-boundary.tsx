/**
 * AI Error Boundary - Specialized error handling for AI operations
 * 
 * This error boundary is specifically designed to handle errors that occur
 * during AI operations like category generation, situation analysis, and
 * policy parsing. It provides user-friendly error messages and recovery options.
 * 
 * Key features:
 * - Specialized handling for different AI error types
 * - User-friendly error messages with action buttons
 * - Automatic retry functionality for transient errors
 * - Fallback UI that maintains application flow
 * - Error reporting for debugging and monitoring
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AI_ERROR_CODES, InsuranceAIError } from "@/lib/services";
import { AlertTriangle, Home, Mail, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

/**
 * Props for the AI Error Boundary component
 */
interface AIErrorBoundaryProps {
  /** Child components to render when no error occurs */
  children: ReactNode;
  /** Optional fallback component to render instead of default error UI */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Callback when an error occurs (for logging/analytics) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show retry button for recoverable errors */
  showRetry?: boolean;
  /** Maximum number of automatic retries before giving up */
  maxRetries?: number;
  /** Context description for better error messages */
  context?: string;
}

/**
 * State for the AI Error Boundary component
 */
interface AIErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
  /** Error information from React */
  errorInfo: ErrorInfo | null;
  /** Number of retry attempts made */
  retryCount: number;
  /** Whether a retry is currently in progress */
  retrying: boolean;
  /** Key to force re-mount of children on reset */
  resetKey: number;
}

/**
 * AI Error Boundary Component
 * 
 * Wraps AI-related components to provide graceful error handling and recovery.
 * Automatically categorizes errors and provides appropriate user messaging.
 * 
 * @example
 * ```tsx
 * <AIErrorBoundary 
 *   context="Category Analysis"
 *   showRetry={true}
 *   onError={(error) => analytics.track('ai_error', { error: error.message })}
 * >
 *   <CategoryAnalysisComponent />
 * </AIErrorBoundary>
 * ```
 */
export class AIErrorBoundary extends Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: AIErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      retrying: false,
      resetKey: 0,
    };
  }

  /**
   * React lifecycle method - catches errors in child components
   */
  static getDerivedStateFromError(error: Error): Partial<AIErrorBoundaryState> {
    console.error("AI Error Boundary caught error:", error);
    
    return {
      hasError: true,
      error,
    };
  }

  /**
   * React lifecycle method - called when an error occurs
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AI Error Boundary detailed error:", error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for certain error types
    if (this.shouldAutoRetry(error)) {
      this.scheduleRetry();
    }
  }

  /**
   * Clean up timeouts when component unmounts
   */
  componentWillUnmount() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  /**
   * Determine if an error should trigger automatic retry
   */
  private shouldAutoRetry(error: Error): boolean {
    const { maxRetries = 2 } = this.props;
    const { retryCount } = this.state;

    // Don't retry if we've exceeded max attempts
    if (retryCount >= maxRetries) {
      return false;
    }

    // Auto-retry for network errors and rate limits
    if (error instanceof InsuranceAIError) {
      const retryableCodes = [
        AI_ERROR_CODES.NETWORK_ERROR,
        AI_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        AI_ERROR_CODES.MODEL_UNAVAILABLE,
      ] as const;
      return retryableCodes.includes(error.code as typeof retryableCodes[number]);
    }

    // Auto-retry for network-related errors
    return error.message.includes("network") || error.message.includes("fetch");
  }

  /**
   * Schedule an automatic retry after a delay
   */
  private scheduleRetry() {
    const { retryCount } = this.state;
    
    // Exponential backoff: 1s, 2s, 4s, etc.
    const delay = Math.pow(2, retryCount) * 1000;
    
    console.log(`Scheduling auto-retry in ${delay}ms (attempt ${retryCount + 1})`);
    
    const timeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
    
    this.retryTimeouts.push(timeout);
  }

  /**
   * Handle manual or automatic retry
   */
  private handleRetry = () => {
    console.log("Retrying after error...");
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      retrying: true,
      resetKey: this.state.resetKey + 1, // Force re-mount
    });

    // Reset retrying state after a short delay
    setTimeout(() => {
      this.setState({ retrying: false });
    }, 500);
  };

  /**
   * Reset the error boundary to initial state
   */
  private handleReset = () => {
    console.log("Resetting AI Error Boundary");
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      retrying: false,
      resetKey: this.state.resetKey + 1, // Force re-mount
    });
  };

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: Error): { title: string; description: string; actionable: boolean } {
    if (error instanceof InsuranceAIError) {
      switch (error.code) {
        case AI_ERROR_CODES.NETWORK_ERROR:
          return {
            title: "Connection Issue",
            description: "We're having trouble connecting to our AI services. Please check your internet connection and try again.",
            actionable: true,
          };
        
        case AI_ERROR_CODES.RATE_LIMIT_EXCEEDED:
          return {
            title: "Too Many Requests",
            description: "We're receiving high traffic right now. Please wait a moment and try again.",
            actionable: true,
          };
        
        case AI_ERROR_CODES.MODEL_UNAVAILABLE:
          return {
            title: "Service Temporarily Unavailable",
            description: "Our AI analysis service is temporarily unavailable. We're working to restore it quickly.",
            actionable: true,
          };
        
        case AI_ERROR_CODES.VALIDATION_FAILED:
          return {
            title: "Data Processing Error",
            description: "We encountered an issue processing your data. Please try uploading your document again.",
            actionable: true,
          };
        
        case AI_ERROR_CODES.INVALID_INPUT:
          return {
            title: "Invalid Input",
            description: "The information provided couldn't be processed. Please check your input and try again.",
            actionable: true,
          };
        
        default:
          return {
            title: "AI Service Error",
            description: "We encountered an unexpected issue with our AI analysis. Please try again.",
            actionable: true,
          };
      }
    }

    // Generic error handling
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        actionable: true,
      };
    }

    return {
      title: "Unexpected Error",
      description: "Something went wrong.",
      actionable: false,
    };
  }

  /**
   * Render the error UI
   */
  private renderErrorUI() {
    const { error, retrying } = this.state;
    const { context = "AI operation", showRetry = true } = this.props;
    
    if (!error) return null;

    const { title, description, actionable } = this.getErrorMessage(error);

    return (
      <Card className="w-full max-w-2xl mx-auto my-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-lg">
                {title}
              </CardTitle>
              <CardDescription>
                Error in {context}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>What happened?</AlertTitle>
            <AlertDescription>
              {description}
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-3">
            {actionable && showRetry && (
              <Button 
                onClick={this.handleRetry}
                disabled={retrying}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
                {retrying ? "Retrying..." : "Try Again"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={this.handleReset}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Start Over
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "mailto:support@example.com"}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
          </div>

          {/* Development error details */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 p-3 bg-muted rounded text-sm">
              <summary className="cursor-pointer font-medium">
                Developer Information
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error instanceof InsuranceAIError && (
                  <div>
                    <strong>Code:</strong> {error.code}
                  </div>
                )}
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 text-xs overflow-x-auto">
                    {error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  render() {
    const { hasError, error, resetKey } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }
      
      // Use default error UI
      return this.renderErrorUI();
    }

    // Use resetKey to force re-mount of children when reset
    return <div key={resetKey}>{children}</div>;
  }
}