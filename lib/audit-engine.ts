import { SpendFormData, AuditResult, ToolRecommendation, ToolId } from '@/types'
import { getToolInfo, getPlanInfo } from './pricing-data'
import { v4 as uuidv4 } from 'uuid'

// ─── Per-tool audit logic ─────────────────────────────────────────────────────

function auditCursor(entry: SpendFormData['tools'][0], teamSize: number, useCase: string): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Cursor'

  // Business plan for small teams is overkill
  if (plan === 'Business' && seats <= 3) {
    const projectedSpend = seats * 20
    return {
      toolId: 'cursor', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Pro',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Business plan adds SSO and admin features only useful for larger teams. With ${seats} seat(s), Pro at $20/seat gives identical AI capability at half the cost.`,
    }
  }

  // Enterprise for under 20 seats makes no sense
  if (plan === 'Enterprise' && seats < 20) {
    const projectedSpend = seats * 40
    return {
      toolId: 'cursor', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Business',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Enterprise pricing requires minimum 20 seats for ROI. At ${seats} seat(s), Business plan covers all team needs without custom contract overhead.`,
    }
  }

  // Non-coding teams on Cursor
  if (useCase !== 'coding' && useCase !== 'mixed' && plan !== 'Hobby') {
    const projectedSpend = seats * 20
    return {
      toolId: 'cursor', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'switch', recommendedTool: 'Claude Pro',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Cursor is optimized for coding workflows. For ${useCase} use cases, Claude Pro offers better value at the same price point with broader capabilities.`,
    }
  }

  return optimalResult('cursor', toolName, plan, monthlySpend)
}

function auditGithubCopilot(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'GitHub Copilot'

  // Enterprise for small teams
  if (plan === 'Enterprise' && seats < 10) {
    const projectedSpend = seats * 19
    return {
      toolId: 'github-copilot', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Business',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `GitHub Copilot Enterprise adds fine-tuned models and Copilot Chat on GitHub.com — features that matter at scale. For ${seats} developer(s), Business at $19/seat covers all practical needs.`,
    }
  }

  // Individual paying more than Business rate with 2+ seats
  if (plan === 'Individual' && seats >= 2) {
    const projectedSpend = seats * 19
    const currentActual = seats * 10
    if (projectedSpend > currentActual) {
      return optimalResult('github-copilot', toolName, plan, monthlySpend)
    }
  }

  return optimalResult('github-copilot', toolName, plan, monthlySpend)
}

function auditClaude(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Claude'

  // Team plan with fewer than 5 seats — minimum is 5, likely overpaying
  if (plan === 'Team' && seats < 5) {
    const projectedSpend = seats * 20
    return {
      toolId: 'claude', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Pro',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Claude Team has a 5-seat minimum at $30/seat. With only ${seats} user(s), individual Pro plans at $20/seat give the same model access for less.`,
    }
  }

  // Max plan — check if Pro suffices
  if (plan === 'Max' && seats >= 1) {
    const projectedSpend = seats * 20
    return {
      toolId: 'claude', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Pro',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Claude Max offers 20x usage limits — typically needed only for power users running large daily workflows. Pro at $20/seat covers most team usage patterns at 80% less cost.`,
    }
  }

  return optimalResult('claude', toolName, plan, monthlySpend)
}

function auditChatGPT(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'ChatGPT'

  // Team with 2 seats — barely qualifies, check if Plus is cheaper
  if (plan === 'Team' && seats <= 3) {
    const projectedSpend = seats * 20
    return {
      toolId: 'chatgpt', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Plus',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `ChatGPT Team adds shared workspaces and admin controls, which add overhead for ${seats} user(s). Individual Plus plans at $20/seat deliver the same GPT-4o access for less.`,
    }
  }

  // Both ChatGPT and Claude — overlap
  return optimalResult('chatgpt', toolName, plan, monthlySpend)
}

function auditGemini(entry: SpendFormData['tools'][0], useCase: string): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Gemini'

  if ((plan === 'Business' || plan === 'Enterprise') && useCase === 'coding') {
    const projectedSpend = seats * 20
    return {
      toolId: 'gemini', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'switch', recommendedTool: 'Cursor Pro',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Gemini's strengths are multimodal research and Google Workspace integration. For coding workflows, Cursor Pro at $20/seat provides IDE-native AI with significantly better code completion.`,
    }
  }

  return optimalResult('gemini', toolName, plan, monthlySpend)
}

function auditWindsurf(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Windsurf'

  if (plan === 'Teams' && seats <= 3) {
    const projectedSpend = seats * 15
    return {
      toolId: 'windsurf', toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'downgrade', recommendedPlan: 'Pro',
      projectedSpend, monthlySavings: monthlySpend - projectedSpend,
      annualSavings: (monthlySpend - projectedSpend) * 12,
      reasoning: `Windsurf Teams adds admin controls suited for larger groups. With ${seats} developer(s), Pro at $15/seat provides the same AI capability without team management overhead.`,
    }
  }

  return optimalResult('windsurf', toolName, plan, monthlySpend)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function optimalResult(toolId: ToolId, toolName: string, plan: string, monthlySpend: number): ToolRecommendation {
  return {
    toolId, toolName, currentPlan: plan, currentSpend: monthlySpend,
    recommendedAction: 'already-optimal',
    projectedSpend: monthlySpend,
    monthlySavings: 0,
    annualSavings: 0,
    reasoning: `Your current ${toolName} ${plan} plan is well-matched to your usage and team size.`,
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function runAudit(formData: SpendFormData): AuditResult {
  const { tools, teamSize, useCase } = formData
  const recommendations: ToolRecommendation[] = []

  for (const entry of tools) {
    let rec: ToolRecommendation

    switch (entry.toolId) {
      case 'cursor':         rec = auditCursor(entry, teamSize, useCase); break
      case 'github-copilot': rec = auditGithubCopilot(entry, teamSize); break
      case 'claude':         rec = auditClaude(entry, teamSize); break
      case 'chatgpt':        rec = auditChatGPT(entry, teamSize); break
      case 'gemini':         rec = auditGemini(entry, useCase); break
      case 'windsurf':       rec = auditWindsurf(entry, teamSize); break
      default:               rec = optimalResult(entry.toolId, entry.toolId, entry.plan, entry.monthlySpend)
    }

    recommendations.push(rec)
  }

  const totalMonthlySpend = tools.reduce((s, t) => s + t.monthlySpend, 0)
  const totalProjectedSpend = recommendations.reduce((s, r) => s + r.projectedSpend, 0)
  const totalMonthlySavings = totalMonthlySpend - totalProjectedSpend
  const totalAnnualSavings = totalMonthlySavings * 12

  return {
    id: uuidv4(),
    formData,
    recommendations,
    totalMonthlySpend,
    totalProjectedSpend,
    totalMonthlySavings,
    totalAnnualSavings,
    aiSummary: '',
    createdAt: new Date().toISOString(),
  }
}