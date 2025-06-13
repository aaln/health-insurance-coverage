/**
 * General Error Boundary - Catches all other types of React errors
 * 
 * This error boundary provides a fallback UI for any React errors that aren't
 * specifically handled by other specialized error boundaries. It's designed to
 * be the outermost error boundary that catches everything else.
 * 
 * Key features:
 * - Catches all types of React errors
 * - Provides graceful degradation with helpful messaging
 * - Error reporting and logging capabilities
 * - Recovery options for users
 * - Different UI for development vs production
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

/**
 * Props for the General Error Boundary component
 */
interface GeneralErrorBoundaryProps {
  /** Child components to render when no error occurs */
  children: ReactNode;
  /** Optional fallback component to render instead of default error UI */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Callback when an error occurs (for logging/analytics) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show the full error in development */
  showErrorDetails?: boolean;
  /** Custom error title */
  errorTitle?: string;
  /** Custom error description */
  errorDescription?: string;
}

/**
 * State for the General Error Boundary component
 */
interface GeneralErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
  /** Error information from React */
  errorInfo: ErrorInfo | null;
  /** Unique error ID for tracking */
  errorId: string;
  /** Key to force re-mount of children on reset */
  resetKey: number;
}

/**
 * Generate a unique error ID for tracking purposes
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * General Error Boundary Component
 * 
 * Catches all React errors not handled by specialized error boundaries.
 * Provides a user-friendly fallback UI with recovery options.
 * 
 * @example
 * ```tsx
 * <GeneralErrorBoundary 
 *   onError={(error, errorInfo) => {
 *     // Log to analytics/monitoring service
 *     analytics.track('react_error', { 
 *       error: error.message,
 *       componentStack: errorInfo.componentStack 
 *     });
 *   }}
 * >
 *   <App />
 * </GeneralErrorBoundary>
 * ```
 */
export class GeneralErrorBoundary extends Component<GeneralErrorBoundaryProps, GeneralErrorBoundaryState> {
  constructor(props: GeneralErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      resetKey: 0,
    };
  }

  /**
   * React lifecycle method - catches errors in child components
   */
  static getDerivedStateFromError(error: Error): Partial<GeneralErrorBoundaryState> {
    console.error("General Error Boundary caught error:", error);
    
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  /**
   * React lifecycle method - called when an error occurs
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("General Error Boundary detailed error:", error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send error reports to a service
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo);
    }
  }

  /**
   * Report error to monitoring service (placeholder)
   * In a real app, integrate with services like Sentry, Bugsnag, etc.
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    // Example error reporting (replace with your service)
    console.log("Reporting error to monitoring service:", {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
    
    // Example: Send to external service
    // errorReportingService.report({
    //   errorId,
    //   error,
    //   errorInfo,
    //   metadata: {
    //     userAgent: navigator.userAgent,
    //     url: window.location.href,
    //     timestamp: new Date().toISOString(),
    //   }
    // });
  }

  /**
   * Handle retry by resetting the error boundary
   */
  private handleRetry = () => {
    console.log("Retrying after general error...");
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      resetKey: this.state.resetKey + 1, // Force re-mount
    });
  };

  /**
   * Handle going back to home page
   */
  private handleGoHome = () => {
    window.location.href = "/";
  };

  /**
   * Handle reporting a bug
   */
  private handleReportBug = () => {
    const { error, errorId } = this.state;
    
    const subject = encodeURIComponent(`Bug Report - Error ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message || "Unknown error"}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim());
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  /**
   * Render the error UI
   */
  private renderErrorUI() {
    const { 
      error, 
      errorInfo, 
      errorId 
    } = this.state;
    
    const { 
      showErrorDetails = process.env.NODE_ENV === "development",
      errorTitle = "Something went wrong",
      errorDescription = "We're sorry, but something unexpected happened."
    } = this.props;
    
    if (!error) return null;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-xl">
                  {errorTitle}
                </CardTitle>
                <CardDescription>
                  Error ID: {errorId}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>
                {errorDescription}
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              
              <Button 
                variant="outline" 
                onClick={this.handleReportBug}
                className="flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Report Bug
              </Button>
            </div>

            {/* Development error details */}
            {showErrorDetails && (
              <details className="mt-4 p-3 bg-muted rounded text-sm">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development Mode)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Error Message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Error Stack:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                  {errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Production helpful information */}
            {!showErrorDetails && (
              <Alert>
                <AlertDescription>
                  If this problem persists, please contact our support team with 
                  Error ID: <code className="font-mono">{errorId}</code>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
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