export interface InsuranceSettings {
    deductibleSpent: number
    outOfPocketSpent: number
    isInNetwork: boolean
  }
  
  export interface HealthCategory {
    id: number
    name: string
    score: "A" | "B" | "C" | "D" | "F"
    description: string
    out_of_pocket_costs: {
      situation: string
      cost: number
      cost_frequency: string
      extra_details?: string
    }[]
  }
  
  export interface CategoryWithSubcategories extends HealthCategory {
    subcategories?: CategoryWithSubcategories[]
  }
  
  export interface ChatMessage {
    id: string
    role: "user" | "system"
    content: string
  }
  