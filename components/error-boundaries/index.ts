/**
 * Error Boundaries Index - Centralized exports for error boundary components
 * 
 * This file provides a single entry point for importing error boundary components,
 * making it easier to apply consistent error handling throughout the application.
 * 
 * Usage:
 * ```tsx
 * import { AIErrorBoundary, GeneralErrorBoundary } from "@/components/error-boundaries";
 * ```
 */

export { AIErrorBoundary } from "./ai-error-boundary";
export { GeneralErrorBoundary } from "./general-error-boundary";

/**
 * Error boundary usage guide for code tourists:
 * 
 * 🤖 AIErrorBoundary
 * - Use around AI-powered components (category analysis, chat, parsing)
 * - Provides specialized handling for AI service errors
 * - Includes automatic retry for transient failures
 * - Shows user-friendly messages for different error types
 * 
 * 🛡️ GeneralErrorBoundary  
 * - Use as the outermost error boundary in your app
 * - Catches all React errors not handled by specialized boundaries
 * - Provides graceful degradation with recovery options
 * - Includes error reporting for monitoring
 * 
 * 💡 Best Practices:
 * - Wrap the entire app with GeneralErrorBoundary
 * - Use AIErrorBoundary around AI-specific features
 * - Always provide onError callbacks for monitoring
 * - Test error boundaries with intentional errors in development
 * 
 * 📚 Example Error Boundary Structure:
 * ```tsx
 * <GeneralErrorBoundary onError={logError}>
 *   <App>
 *     <AIErrorBoundary context="Policy Analysis">
 *       <PolicyAnalysisComponent />
 *     </AIErrorBoundary>
 *     <AIErrorBoundary context="Category Generation">
 *       <CategoryComponent />
 *     </AIErrorBoundary>
 *   </App>
 * </GeneralErrorBoundary>
 * ```
 */