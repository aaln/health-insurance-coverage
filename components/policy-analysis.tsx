/**
 * Policy Analysis Component - Main interface for insurance coverage analysis
 * 
 * This component provides the primary user interface for analyzing insurance
 * coverage using AI-powered categorization and contextual suggestions. It has
 * been refactored to use custom hooks for better separation of concerns.
 * 
 * Key features:
 * - AI-powered category analysis with breadcrumb navigation
 * - Contextual healthcare situation suggestions
 * - Centralized settings management
 * - Error boundaries for graceful error handling
 * - Responsive design with mobile/desktop layouts
 * 
 * Architecture:
 * - Uses useCategoryAnalysis hook for category management
 * - Uses useSituationSuggestions hook for suggestion management
 * - Uses useInsuranceSettings hook for settings state
 * - Wrapped with AIErrorBoundary for error handling
 */

"use client"

import { CategoryScores } from "@/components/category-scores"
import { AIErrorBoundary } from "@/components/error-boundaries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCategoryAnalysis,
  useInsuranceSettings,
  useSituationSuggestions
} from "@/hooks"
import { useComposerRuntime } from "@assistant-ui/react"
import { ChevronRight, Home } from "lucide-react"
import { useCallback } from "react"
import { Thread } from "./assistant-ui/thread"
import { usePolicy } from "./policy-context"
import { SettingsBar } from "./settings-bar"

/**
 * Main Policy Analysis Component
 * 
 * Provides a comprehensive interface for users to analyze their insurance
 * coverage with AI assistance. The component is now much cleaner thanks
 * to the custom hooks that handle all the complex logic.
 */
export default function PolicyAnalysis() {
  // ========================================================================
  // HOOKS AND STATE
  // ========================================================================
  
  /** Get the current policy from context */
  const { policy } = usePolicy();
  
  /** Get composer runtime for chat integration */
  const composerRuntime = useComposerRuntime();

  /** Centralized insurance settings management */
  const {
    settings,
    updateSettings,
    getNetworkStatus,
  } = useInsuranceSettings({
    initialSettings: {
      deductibleSpent: 500,
      outOfPocketSpent: 1200,
      isInNetwork: true,
    },
    persist: true,
    onSettingsChange: (newSettings) => {
      console.log("Insurance settings changed:", newSettings);
    },
  });

  /** AI-powered category analysis with navigation */
  const {
    categories,
    loading: categoryLoading,
    breadcrumbs,
    selectCategory,
    navigateToBreadcrumb,
    searchCategories,
  } = useCategoryAnalysis({
    policy,
    settings,
    autoLoad: true,
  });

  /** Contextual healthcare situation suggestions */
  const {
    suggestions: situationSuggestions,
    loading: situationLoading,
    handleSuggestionClick,
  } = useSituationSuggestions({
    policy,
    settings,
    currentCategory: breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : "Overall Coverage",
    onSuggestionClick: (suggestion: string) => {
      // Send suggestion to chat interface
      console.log("Suggestion clicked:", suggestion);
      composerRuntime.setText(suggestion);
      composerRuntime.send();
    },
  });

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  /**
   * Handle settings changes from the settings bar
   * Now uses the centralized settings hook
   */
  const handleSettingsChange = useCallback((newSettings: Parameters<typeof updateSettings>[0]) => {
    updateSettings(newSettings);
  }, [updateSettings]);

  /**
   * Handle category selection for drill-down navigation
   */
  const handleCategorySelect = async (category: Parameters<typeof selectCategory>[0]) => {
    console.log("Category selected:", category.name);
    await selectCategory(category);
  };

  /**
   * Handle breadcrumb navigation clicks
   */
  const handleBreadcrumbClick = async (index: number) => {
    console.log("Breadcrumb clicked:", index);
    await navigateToBreadcrumb(index);
  };

  /**
   * Handle search queries from the category scores component
   */
  const handleServerSearch = async (query: string) => {
    if (!query.trim()) return;
    console.log("Search initiated:", query);
    await searchCategories(query.trim());
  };

  // ========================================================================
  // EARLY RETURNS
  // ========================================================================
  
  /** Don't render if no policy is available */
  if (!policy) {
    return null;
  }

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <AIErrorBoundary 
      context="Policy Analysis" 
      showRetry={true}
      onError={(error, errorInfo) => {
        console.error("Policy Analysis Error:", error, errorInfo);
        // In production, send to monitoring service
      }}
    >
      <div className="flex flex-col bg-white rounded-lg shadow-lg">
        {/* Settings Bar - Configure insurance parameters */}
        <SettingsBar 
          settings={settings} 
          onSettingsChange={handleSettingsChange} 
        />

        <div className="flex flex-col lg:flex-row flex-1">
          {/* Main Content Area - Category Analysis */}
          <div className="w-full lg:w-2/3 p-4 border-r overflow-y-auto">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between space-x-2 text-sm mb-4 overflow-x-auto">
              <div className="flex items-center space-x-2">
                {/* Home button - navigate to root */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleBreadcrumbClick(-1)} 
                  className="p-1"
                  title="Go to overview"
                >
                  <Home className="h-4 w-4" />
                </Button>
                
                {/* Default category when no breadcrumbs */}
                {breadcrumbs.length === 0 && (
                  <>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Overall Coverage
                    </span>
                  </>
                )}
                
                {/* Breadcrumb trail */}
                {breadcrumbs.map((item, index) => (
                  <div key={item.id} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBreadcrumbClick(index)}
                      className="text-sm font-medium"
                      title={`Navigate to ${item.name}`}
                    >
                      {item.name}
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Network Status Badge */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={settings.isInNetwork ? "default" : "destructive"}
                  title={`Currently viewing ${getNetworkStatus()} coverage`}
                >
                  {getNetworkStatus()}
                </Badge>
              </div>
            </div>
            
            {/* Category Display Area */}
            {categoryLoading ? (
              // Loading skeleton while categories are being generated
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              // Main category scores component
              <CategoryScores
                categories={categories}
                onCategorySelect={handleCategorySelect}
                onSearch={handleServerSearch}
                loading={categoryLoading}
              />
            )}
          </div>

          {/* Sidebar - Suggestions and Chat */}
          <div className="hidden lg:flex w-full md:w-1/3 flex-col overflow-y-scroll p-4">
            
            {/* Healthcare Situation Suggestions - Always show */}
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                Common situations:
                {situationLoading && (
                  <span className="animate-spin" title="Loading suggestions...">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                  </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 overflow-x-auto">
                  {situationSuggestions.map((situation, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(situation)}
                      className="text-xs"
                      disabled={situationLoading}
                      title={`Ask about: ${situation}`}
                    >
                      {situation}
                    </Button>
                  ))}
                </div>
              </div>
            
            {/* AI Chat Thread */}
            <AIErrorBoundary 
              context="Chat Interface"
              fallback={(error, retry) => (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Chat is temporarily unavailable
                  </p>
                  <Button size="sm" onClick={retry}>
                    Retry Chat
                  </Button>
                </div>
              )}
            >
              <Thread />
            </AIErrorBoundary>
          </div>
        </div>
      </div>
    </AIErrorBoundary>
  )
}
