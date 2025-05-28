"use client"

import { useState, useEffect, useCallback } from "react"
import { SettingsBar } from "./settings-bar"
import { CategoryScores } from "@/components/category-scores"
import type { InsuranceSettings, CategoryWithSubcategories } from "@/types/insurance"
import { Thread } from "./assistant-ui/thread"
import { generateCategories, generateSituations } from "@/actions/insurance-analyzer"
import { usePolicy } from "./policy-context"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ChevronRight, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useComposerRuntime } from "@assistant-ui/react"

export default function PolicyAnalysis() {
  const [settings, setSettings] = useState<InsuranceSettings>({
    deductibleSpent: 500,
    outOfPocketSpent: 1200,
    isInNetwork: true,
  })

  const { policy } = usePolicy()
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([])
  const [loading, setLoading] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryWithSubcategories[]>([])
  const [situationSuggestions, setSituationSuggestions] = useState<string[]>([])
  const [situationLoading, setSituationLoading] = useState(false);
  const composerRuntime = useComposerRuntime();

  // Helper to get the current breadcrumb path as a string
  const getBreadcrumbPath = (crumbs: CategoryWithSubcategories[]) =>
    crumbs.map((c) => c.name).join(" > ")

  // Helper to fetch situations for a query
  const fetchSituations = useCallback(async (query: string) => {
    if (!policy) return
    setSituationLoading(true)
    try {
      const situations = await generateSituations(
        query,
        { isInNetwork: settings.isInNetwork },
        policy
      )
      setSituationSuggestions(situations)
    } catch {
      setSituationSuggestions([])
    } finally {
      setSituationLoading(false)
    }
  }, [policy, settings.isInNetwork])

  // Load categories and situations on mount and when settings or policy changes
  useEffect(() => {
    if (!policy) return
    setLoading(true)
    setBreadcrumbs([])
    const query = `overall coverage focused on ${settings.isInNetwork ? "in-network" : "out-of-network"}`
    generateCategories(query, settings, policy)
      .then((cats) => {
        setCategories(cats)
      })
      .catch(() => {
        toast.error("Failed to load categories")
        setCategories([])
      })
      .finally(() => setLoading(false))
    fetchSituations(query)
  }, [settings, policy, fetchSituations])

  const handleSettingsChange = (newSettings: Partial<InsuranceSettings>) => {
    setSettings((prev: InsuranceSettings) => ({ ...prev, ...newSettings }))
    // In a real app, we would recalculate scores based on new settings
  }

  const handleCategorySelect = async (category: CategoryWithSubcategories) => {
    if (!policy) return
    setLoading(true)
    const newBreadcrumbs = [...breadcrumbs, category]
    setBreadcrumbs(newBreadcrumbs)
    const breadcrumbPath = getBreadcrumbPath(newBreadcrumbs)
    const query = `${breadcrumbPath} focused on ${settings.isInNetwork ? "in-network" : "out-of-network"}`
    try {
      const cats = await generateCategories(
        query,
        settings,
        policy
      )
      setCategories(cats)
    } catch {
      toast.error("Failed to load categories")
      setCategories([])
    } finally {
      setLoading(false)
    }
    fetchSituations(query)
  }

  const handleBreadcrumbClick = async (index: number) => {
    if (!policy) return
    setLoading(true)
    let newBreadcrumbs: CategoryWithSubcategories[]
    if (index === -1) {
      newBreadcrumbs = []
    } else {
      newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    }
    setBreadcrumbs(newBreadcrumbs)
    const breadcrumbPath = getBreadcrumbPath(newBreadcrumbs)
    const query = `${breadcrumbPath || "overall coverage"} focused on ${settings.isInNetwork ? "in-network" : "out-of-network"}`
    try {
      const cats = await generateCategories(
        query,
        settings,
        policy
      )
      setCategories(cats)
    } catch {
      toast.error("Failed to load categories")
      setCategories([])
    } finally {
      setLoading(false)
    }
    fetchSituations(query)
  }

  // New: handle server-side search from CategoryScores
  const handleServerSearch = async (query: string) => {
    if (!policy || !query.trim()) return
    setLoading(true)
    setBreadcrumbs([])
    const searchQuery = `${query.trim()} focused on ${settings.isInNetwork ? "in-network" : "out-of-network"}`
    try {
      const cats = await generateCategories(
        searchQuery,
        settings,
        policy
      )
      setCategories(cats)
    } catch {
      toast.error("Failed to load categories")
      setCategories([])
    } finally {
      setLoading(false)
    }
    fetchSituations(searchQuery)
  }

  // Handler for suggestion click (search for that suggestion)
  const handleSuggestionClick = (suggestion: string) => {
    composerRuntime.setText(suggestion);
    composerRuntime.send();
    // handleServerSearch(suggestion)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-lg shadow-lg">
      <SettingsBar settings={settings} onSettingsChange={handleSettingsChange} />

      <div className="flex flex-col lg:flex-row flex-1">
        <div className="w-full lg:w-2/3 p-4 border-r h-[calc(100vh-280px)] overflow-y-auto">
          {/* Breadcrumbs UI */}
          <div className="flex items-center justify-between space-x-2 text-sm mb-4 overflow-x-auto">
            <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleBreadcrumbClick(-1)} className="p-1">
              <Home className="h-4 w-4" />
            </Button>
            {breadcrumbs.map((item, index) => (
              <div key={item.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(index)}
                  className="text-sm font-medium"
                >
                  {item.name}
                </Button>
              </div>
            ))}
            </div>
             <div className="flex items-center justify-between">
              <Badge variant={settings.isInNetwork ? "default" : "destructive"}>{settings.isInNetwork ? "In-Network" : "Out-of-Network"}</Badge>
            </div>

          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <CategoryScores
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onSearch={handleServerSearch}
              loading={loading}
            />
          )}
        </div>

        <div className="hidden lg:flex w-full md:w-1/3 flex-col overflow-y-scroll h-[calc(100vh-280px)]">
          {/* Situation Suggestions */}
          {situationSuggestions.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                Common situations:
                {situationLoading && <span className="animate-spin"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></span>}
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
                  >
                    {situation}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Thread />
        </div>
      </div>
    </div>
  )
}
