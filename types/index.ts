// ─── Tool & Plan Types ───────────────────────────────────────────────────────

export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed'

export type ToolId =
  | 'cursor'
  | 'github-copilot'
  | 'claude'
  | 'chatgpt'
  | 'anthropic-api'
  | 'openai-api'
  | 'gemini'
  | 'windsurf'

export interface ToolEntry {
  toolId: ToolId
  plan: string
  monthlySpend: number
  seats: number
}

export interface SpendFormData {
  tools: ToolEntry[]
  teamSize: number
  useCase: UseCase
}

// ─── Audit Types ─────────────────────────────────────────────────────────────

export type RecommendationType =
  | 'downgrade'
  | 'switch'
  | 'optimize-seats'
  | 'already-optimal'
  | 'use-credits'

export interface ToolRecommendation {
  toolId: ToolId
  toolName: string
  currentPlan: string
  currentSpend: number
  recommendedAction: RecommendationType
  recommendedPlan?: string
  recommendedTool?: string
  projectedSpend: number
  monthlySavings: number
  annualSavings: number
  reasoning: string
}

export interface AuditResult {
  id: string
  formData: SpendFormData
  recommendations: ToolRecommendation[]
  totalMonthlySpend: number
  totalProjectedSpend: number
  totalMonthlySavings: number
  totalAnnualSavings: number
  aiSummary: string
  createdAt: string
}

// ─── Lead Capture Types ───────────────────────────────────────────────────────

export interface LeadData {
  email: string
  companyName?: string
  role?: string
  teamSize?: number
  auditId: string
  totalMonthlySavings: number
}