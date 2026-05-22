import { SpendFormData, AuditResult, ToolRecommendation, ToolId } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// ─── Spend Anomaly Check ──────────────────────────────────────────────────────

function checkSpendAnomaly(
  toolId: ToolId, toolName: string, plan: string,
  monthlySpend: number, seats: number, expectedPricePerSeat: number
): ToolRecommendation | null {
  // Free plan but paying money — clear billing issue
  if (expectedPricePerSeat === 0 && monthlySpend > 0) {
    return {
      toolId, toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'optimize-seats',
      projectedSpend: 0,
      monthlySavings: monthlySpend,
      annualSavings: monthlySpend * 12,
      reasoning: `You entered $${monthlySpend}/mo for ${toolName} ${plan} which should be free. This may be a billing error or you may be on a paid tier without realizing it — worth investigating immediately.`,
    }
  }
  const expectedSpend = seats * expectedPricePerSeat
  if (expectedSpend === 0) return null
  if (monthlySpend > expectedSpend * 1.5) {
    return {
      toolId, toolName, currentPlan: plan, currentSpend: monthlySpend,
      recommendedAction: 'optimize-seats',
      projectedSpend: expectedSpend,
      monthlySavings: monthlySpend - expectedSpend,
      annualSavings: (monthlySpend - expectedSpend) * 12,
      reasoning: `Expected spend for ${seats} seat(s) on ${plan} is $${expectedSpend}/mo but you entered $${monthlySpend}/mo. You may have more seats than needed or a billing error worth investigating.`,
    }
  }
  return null
}

function optimalResult(toolId: ToolId, toolName: string, plan: string, monthlySpend: number): ToolRecommendation {
  return {
    toolId, toolName, currentPlan: plan, currentSpend: monthlySpend,
    recommendedAction: 'already-optimal',
    projectedSpend: monthlySpend,
    monthlySavings: 0, annualSavings: 0,
    reasoning: `Your current ${toolName} ${plan} plan is well-matched to your usage and team size.`,
  }
}

// ─── Per-tool audit logic ─────────────────────────────────────────────────────

function auditCursor(entry: SpendFormData['tools'][0], teamSize: number, useCase: string): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Cursor'
  const planPrices: Record<string, number> = { 'Hobby': 0, 'Pro': 20, 'Business': 40, 'Enterprise': 100 }

  if (plan === 'Business' && seats <= 3) {
    const projectedSpend = seats * 20
    return { toolId: 'cursor', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Pro', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Business plan adds SSO and admin features only useful for larger teams. With ${seats} seat(s), Pro at $20/seat gives identical AI capability at half the cost.` }
  }
  if (plan === 'Enterprise' && seats < 20) {
    const projectedSpend = seats * 40
    return { toolId: 'cursor', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Business', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Enterprise pricing requires minimum 20 seats for ROI. At ${seats} seat(s), Business plan covers all team needs without custom contract overhead.` }
  }
  if (useCase !== 'coding' && useCase !== 'mixed' && plan !== 'Hobby') {
    const projectedSpend = seats * 20
    return { toolId: 'cursor', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'switch', recommendedTool: 'Claude Pro', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Cursor is optimized for coding workflows. For ${useCase} use cases, Claude Pro offers better value at the same price point with broader capabilities.` }
  }
  const anomaly = checkSpendAnomaly('cursor', toolName, plan, monthlySpend, seats, planPrices[plan] || 0)
  if (anomaly) return anomaly
  return optimalResult('cursor', toolName, plan, monthlySpend)
}

function auditGithubCopilot(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'GitHub Copilot'
  const planPrices: Record<string, number> = { 'Individual': 10, 'Business': 19, 'Enterprise': 39 }

  if (plan === 'Enterprise' && seats < 10) {
    const projectedSpend = seats * 19
    return { toolId: 'github-copilot', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Business', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `GitHub Copilot Enterprise adds fine-tuned models suited for large scale. For ${seats} developer(s), Business at $19/seat covers all practical needs.` }
  }
  const anomaly = checkSpendAnomaly('github-copilot', toolName, plan, monthlySpend, seats, planPrices[plan] || 0)
  if (anomaly) return anomaly
  return optimalResult('github-copilot', toolName, plan, monthlySpend)
}

function auditClaude(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Claude'
  const planPrices: Record<string, number> = { 'Free': 0, 'Pro': 20, 'Max': 100, 'Team': 30, 'Enterprise': 60, 'API direct': 0 }

  if (plan === 'Team' && seats < 5) {
    const projectedSpend = seats * 20
    return { toolId: 'claude', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Pro', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Claude Team has a 5-seat minimum at $30/seat. With only ${seats} user(s), individual Pro plans at $20/seat give the same model access for less.` }
  }
  if (plan === 'Max') {
    const projectedSpend = seats * 20
    return { toolId: 'claude', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Pro', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Claude Max offers 20x usage limits — typically needed only for power users. Pro at $20/seat covers most team usage patterns at 80% less cost.` }
  }
  const anomaly = checkSpendAnomaly('claude', toolName, plan, monthlySpend, seats, planPrices[plan] || 0)
  if (anomaly) return anomaly
  return optimalResult('claude', toolName, plan, monthlySpend)
}

function auditChatGPT(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'ChatGPT'
  const planPrices: Record<string, number> = { 'Plus': 20, 'Team': 30, 'Enterprise': 60, 'API direct': 0 }

  if (plan === 'Team' && seats <= 3) {
    const projectedSpend = seats * 20
    return { toolId: 'chatgpt', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Plus', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `ChatGPT Team adds shared workspaces suited for larger groups. With ${seats} user(s), individual Plus plans at $20/seat deliver the same GPT-4o access for less.` }
  }
  if (plan === 'Enterprise' && seats < 10) {
    const projectedSpend = seats * 30
    return { toolId: 'chatgpt', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Team', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `ChatGPT Enterprise is designed for large orgs needing SSO and compliance. With ${seats} seat(s), Team plan at $30/seat covers all practical needs.` }
  }
  const anomaly = checkSpendAnomaly('chatgpt', toolName, plan, monthlySpend, seats, planPrices[plan] || 0)
  if (anomaly) return anomaly
  return optimalResult('chatgpt', toolName, plan, monthlySpend)
}

function auditGemini(entry: SpendFormData['tools'][0], useCase: string): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Gemini'
  const planPrices: Record<string, number> = { 'Free': 0, 'Advanced': 20, 'Business': 24, 'Enterprise': 36, 'API': 0 }

  if ((plan === 'Business' || plan === 'Enterprise') && useCase === 'coding') {
    const projectedSpend = seats * 20
    return { toolId: 'gemini', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'switch', recommendedTool: 'Cursor Pro', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Gemini's strengths are multimodal research and Google Workspace integration. For coding workflows, Cursor Pro at $20/seat provides IDE-native AI with significantly better code completion.` }
  }
  const anomaly = checkSpendAnomaly('gemini', toolName, plan, monthlySpend, seats, planPrices[plan] || 0)
  if (anomaly) return anomaly
  return optimalResult('gemini', toolName, plan, monthlySpend)
}

function auditWindsurf(entry: SpendFormData['tools'][0], teamSize: number): ToolRecommendation {
  const { plan, monthlySpend, seats } = entry
  const toolName = 'Windsurf'
  const planPrices: Record<string, number> = { 'Free': 0, 'Pro': 15, 'Teams': 35, 'Enterprise': 60 }

  if (plan === 'Teams' && seats <= 3) {
    const projectedSpend = seats * 15
    return { toolId: 'windsurf', toolName, currentPlan: plan, currentSpend: monthlySpend, recommendedAction: 'downgrade', recommendedPlan: 'Pro', projectedSpend, monthlySavings: monthlySpend - projectedSpend, annualSavings: (monthlySpend - projectedSpend) * 12, reasoning: `Windsurf Teams adds admin controls suited for larger groups. With ${seats} developer(s), Pro at $15/seat provides the same AI capability without team management overhead.` }
  }
  const anomaly = checkSpendAnomaly('windsurf', toolName, plan, monthlySpend, seats, planPrices[plan] || 0)
  if (anomaly) return anomaly
  return optimalResult('windsurf', toolName, plan, monthlySpend)
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