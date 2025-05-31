"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getScoreColor } from "@/lib/utils"
import type { HealthCategory } from "@/types/insurance"
import { InfoIcon, Search } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface CategoryScoresProps {
  categories: HealthCategory[]
  onCategorySelect?: (category: HealthCategory) => void
  onSearch?: (query: string) => void
  loading?: boolean
}

export function CategoryScores({
  categories,
  onCategorySelect,
  onSearch,
  loading,
}: CategoryScoresProps) {
  const [searchInput, setSearchInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchInput.trim()) {
      onSearch(searchInput)
    }
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
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  
                  {category.out_of_pocket_costs.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Out of pocket costs:</p>
                      <ul className="mt-1 space-y-1">
                        {category.out_of_pocket_costs.map((cost, i) => (
                          <li key={i} className="text-sm text-gray-600 flex justify-between">
                            <span>{cost.situation}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">${cost.cost}</span>
                              <span className="text-xs text-gray-500">({cost.cost_frequency})</span>
                              {cost.extra_details && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <InfoIcon className="h-3 w-3 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {cost.extra_details}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
