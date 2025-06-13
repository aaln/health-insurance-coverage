/**
 * Explorer Page - Interactive exploration of health insurance coverage
 * 
 * This page provides an AI-powered exploration interface for users to
 * discover and understand various aspects of their health insurance coverage
 * using natural language queries powered by Groq.
 */

"use client";

import { AssistantModal } from "@/components/assistant-ui/assistant-modal";
import { AIErrorBoundary, GeneralErrorBoundary } from "@/components/error-boundaries";
import { PolicyProvider } from "@/components/policy-context";
import { PolicySelector } from "@/components/policy-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { DollarSign, HeartPlus, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Explorer Page Component
 * 
 * Provides an interactive exploration interface where users can:
 * - Ask natural language questions about their coverage
 * - Explore different coverage scenarios
 * - Get AI-powered insights and recommendations
 * - Discover hidden benefits and opportunities
 */
export default function ExplorerPage() {
  // ========================================================================
  // STATE AND SETUP
  // ========================================================================
  
  /** Initialize the AI chat runtime with API endpoint */
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  /** Check if we're on a mobile device for responsive layout */
  const isMobile = useIsMobile();
  
  /** State for exploration query */
  const [query, setQuery] = useState("");
  const [isExploring, setIsExploring] = useState(false);
  const [explorationResults, setExplorationResults] = useState<string | null>(null);

  // ========================================================================
  // EXPLORATION HANDLERS
  // ========================================================================
  
  /**
   * Handle exploration query submission
   */
  const handleExploration = async () => {
    if (!query.trim()) return;
    
    setIsExploring(true);
    try {
      // Send exploration query to Groq via the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Help me explore and understand: ${query}. Please provide detailed insights, potential scenarios, and actionable recommendations.`
            }
          ],
          system: "You are an expert health insurance explorer. Help users discover insights about their coverage through detailed analysis and exploration.",
          tools: {},
          runConfig: {
            custom: {
              isInNetwork: true,
              deductibleSpent: 0,
              outOfPocketSpent: 0,
              policy: "Explorer mode - comprehensive analysis"
            }
          }
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value);
          }
        }
        
        setExplorationResults(result);
      }
    } catch (error) {
      console.error('Exploration error:', error);
      setExplorationResults('Sorry, there was an error processing your exploration request. Please try again.');
    } finally {
      setIsExploring(false);
    }
  };

  /**
   * Pre-defined exploration topics
   */
  const explorationTopics = [
    {
      icon: DollarSign,
      title: "Cost Analysis",
      description: "Explore potential costs for different medical scenarios",
      query: "What are the potential costs I might face for common medical procedures and how can I minimize them?"
    },
    {
      icon: Users,
      title: "Network Benefits",
      description: "Understand your network advantages and provider options",
      query: "What are the benefits of staying in-network and how can I find the best providers?"
    },
    {
      icon: TrendingUp,
      title: "Coverage Optimization",
      description: "Discover ways to maximize your coverage benefits",
      query: "How can I optimize my health insurance coverage to get the most value and benefits?"
    },
    {
      icon: Sparkles,
      title: "Hidden Benefits",
      description: "Uncover lesser-known benefits in your policy",
      query: "What hidden or lesser-known benefits are available in my health insurance policy?"
    }
  ];

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <GeneralErrorBoundary 
      onError={(error, errorInfo) => {
        console.error("Explorer Page Error:", error, errorInfo);
      }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <PolicyProvider>
          <SidebarProvider>
            <SidebarInset>
              
              {/* Application Header */}
              <header className="w-full max-w-screen-xl mx-auto flex h-16 shrink-0 items-center gap-2 border-b px-4">
                
                {/* Brand Logo and Title */}
                <Link href="/">
                  <div className="flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <HeartPlus className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Health Insurance Coverage</span>
                    </div>
                  </div>
                </Link>
                
                <Separator orientation="vertical" className="mr-2 h-4" />
                
                {/* Navigation Links */}
                <nav className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Analysis
                  </Link>
                  <Link
                    href="/scenarios"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Cost Scenarios
                  </Link>
                  <Link
                    href="/explorer"
                    className="text-sm font-medium text-primary"
                  >
                    Explorer
                  </Link>
                </nav>
                
                <Separator orientation="vertical" className="mr-2 h-4" />
                
                {/* GitHub Repository Link */}
                <Link
                  className="flex items-center gap-2"
                  href="https://github.com/aaln/health-insurance-coverage"
                  target="_blank"
                >
                  <div className="flex flex-col justify-center leading-tight">
                    <span className="font-semibold">GitHub</span>
                    <span className="text-xs text-muted-foreground">View Open Source Repo</span>
                  </div>
                </Link>
                
                {/* Policy Selection - Right-aligned */}
                <div className="flex-1 flex justify-end">
                  <AIErrorBoundary 
                    context="Policy Selector"
                    fallback={() => (
                      <div className="text-sm text-muted-foreground">
                        Policy selector unavailable
                      </div>
                    )}
                  >
                    <PolicySelector />
                  </AIErrorBoundary>
                </div>
              </header> 
              
              {/* Main Content Area */}
              <main className="flex flex-col h-full p-4 max-w-screen-xl mx-auto w-full space-y-6">
                
                {/* Page Header */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Search className="size-8" />
                    Coverage Explorer
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Discover insights about your health insurance coverage through AI-powered exploration. 
                    Ask questions, explore scenarios, and uncover opportunities to maximize your benefits.
                  </p>
                </div>

                {/* Exploration Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="size-5" />
                      Ask Anything About Your Coverage
                    </CardTitle>
                    <CardDescription>
                      Use natural language to explore your health insurance coverage. Ask about costs, benefits, providers, or any other coverage-related questions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="e.g., What would it cost if I needed surgery? What preventive care is covered? How can I save money on prescriptions?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button 
                      onClick={handleExploration}
                      disabled={!query.trim() || isExploring}
                      className="w-full"
                    >
                      {isExploring ? "Exploring..." : "Explore with AI"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Exploration Results */}
                {explorationResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Exploration Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm">
                          {explorationResults}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Exploration Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {explorationTopics.map((topic, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <topic.icon className="size-5" />
                          {topic.title}
                        </CardTitle>
                        <CardDescription>{topic.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setQuery(topic.query);
                          }}
                        >
                          Explore This Topic
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Features Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>What You Can Explore</CardTitle>
                    <CardDescription>
                      The Coverage Explorer uses advanced AI to help you understand your health insurance in depth
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center space-y-2">
                        <DollarSign className="size-8 mx-auto text-primary" />
                        <h3 className="font-semibold">Cost Scenarios</h3>
                        <p className="text-sm text-muted-foreground">
                          Understand potential costs for various medical situations
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <Users className="size-8 mx-auto text-primary" />
                        <h3 className="font-semibold">Provider Networks</h3>
                        <p className="text-sm text-muted-foreground">
                          Explore your provider options and network benefits
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <Sparkles className="size-8 mx-auto text-primary" />
                        <h3 className="font-semibold">Hidden Benefits</h3>
                        <p className="text-sm text-muted-foreground">
                          Discover lesser-known benefits and coverage opportunities
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </main>
              
              {/* Mobile Chat Modal - Only shown on mobile devices */}
              {isMobile && (
                <AIErrorBoundary 
                  context="Mobile Chat"
                  fallback={() => (
                    <div className="fixed bottom-4 right-4 p-2 bg-background border rounded">
                      Chat unavailable
                    </div>
                  )}
                >
                  <AssistantModal />
                </AIErrorBoundary>
              )}
            </SidebarInset>
          </SidebarProvider>
        </PolicyProvider>
      </AssistantRuntimeProvider>
    </GeneralErrorBoundary>
  );
} 