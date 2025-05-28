"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { HealthCategory, CategoryWithSubcategories } from "@/types/insurance"
import { getScoreColor } from "@/lib/utils"
import { useComposerRuntime } from "@assistant-ui/react"

interface CategoryScoresProps {
  categories: HealthCategory[]
  isInNetwork: boolean
  onCategorySelect?: (category: HealthCategory) => void
  onSearch?: (query: string) => void
  loading?: boolean
  situationSuggestions?: string[]
  situationLoading?: boolean
  onSuggestionClick?: (suggestion: string) => void
}

export function CategoryScores({
  categories,
  isInNetwork,
  onCategorySelect,
  onSearch,
  loading,
  situationSuggestions = [],
  situationLoading = false,
  onSuggestionClick,
}: CategoryScoresProps) {
  const [searchInput, setSearchInput] = useState("")

  const composerRuntime = useComposerRuntime();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchInput.trim()) {
      onSearch(searchInput)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    composerRuntime.setText(suggestion);
    composerRuntime.send();
    onSuggestionClick?.(suggestion);
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search categories or describe a situation..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-10 pr-3 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !searchInput.trim()} variant="default">
          {loading ? (
            <span className="animate-spin mr-2"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></span>
          ) : (
            <Search className="h-4 w-4 mr-1" />
          )}
          Search
        </Button>
      </form>
      
      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-none py-0"
            onClick={() => onCategorySelect?.(category)}
          >
            <div className={`h-1 ${getScoreColor(category.score)}`} />
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium flex items-center">
                    {category.name}
                    {Array.isArray((category as CategoryWithSubcategories).subcategories) && (category as CategoryWithSubcategories).subcategories!.length > 0 && (
                      <Search className="h-4 w-4 ml-1 text-gray-400" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${getScoreColor(
                    category.score,
                  )}`}
                >
                  {category.score}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No categories found matching your search.</p>
          <p className="text-sm mt-2">Try searching for a different term or situation.</p>
        </div>
      )}
    </div>
  )
}
