import { runAudit } from '@/lib/audit-engine'
import { SpendFormData } from '@/types'

// ─── Test 1: Cursor Business with small team should downgrade ─────────────────
test('Cursor Business plan with 2 seats recommends downgrade to Pro', () => {
  const input: SpendFormData = {
    tools: [{ toolId: 'cursor', plan: 'Business', monthlySpend: 80, seats: 2 }],
    teamSize: 2,
    useCase: 'coding',
  }
  const result = runAudit(input)
  const rec = result.recommendations[0]
  expect(rec.recommendedAction).toBe('downgrade')
  expect(rec.recommendedPlan).toBe('Pro')
  expect(rec.monthlySavings).toBe(40)
})

// ─── Test 2: Claude Max should always recommend downgrade to Pro ──────────────
test('Claude Max plan recommends downgrade to Pro', () => {
  const input: SpendFormData = {
    tools: [{ toolId: 'claude', plan: 'Max', monthlySpend: 100, seats: 1 }],
    teamSize: 1,
    useCase: 'writing',
  }
  const result = runAudit(input)
  const rec = result.recommendations[0]
  expect(rec.recommendedAction).toBe('downgrade')
  expect(rec.monthlySavings).toBe(80)
})

// ─── Test 3: ChatGPT Enterprise with small team should downgrade ──────────────
test('ChatGPT Enterprise with 3 seats recommends downgrade to Team', () => {
  const input: SpendFormData = {
    tools: [{ toolId: 'chatgpt', plan: 'Enterprise', monthlySpend: 180, seats: 3 }],
    teamSize: 3,
    useCase: 'mixed',
  }
  const result = runAudit(input)
  const rec = result.recommendations[0]
  expect(rec.recommendedAction).toBe('downgrade')
  expect(rec.recommendedPlan).toBe('Team')
  expect(rec.monthlySavings).toBeGreaterThan(0)
})

// ─── Test 4: Spend anomaly detection ─────────────────────────────────────────
test('Detects spend anomaly when actual spend is 2x expected', () => {
  const input: SpendFormData = {
    tools: [{ toolId: 'cursor', plan: 'Pro', monthlySpend: 1000, seats: 2 }],
    teamSize: 2,
    useCase: 'coding',
  }
  const result = runAudit(input)
  const rec = result.recommendations[0]
  expect(rec.recommendedAction).toBe('optimize-seats')
  expect(rec.monthlySavings).toBe(960)
})

// ─── Test 5: Optimal spend returns no savings ─────────────────────────────────
test('Correctly priced plan returns already-optimal with zero savings', () => {
  const input: SpendFormData = {
    tools: [{ toolId: 'cursor', plan: 'Pro', monthlySpend: 20, seats: 1 }],
    teamSize: 1,
    useCase: 'coding',
  }
  const result = runAudit(input)
  const rec = result.recommendations[0]
  expect(rec.recommendedAction).toBe('already-optimal')
  expect(rec.monthlySavings).toBe(0)
})

// ─── Test 6: Total savings calculation ───────────────────────────────────────
test('Total savings correctly sums across multiple tools', () => {
  const input: SpendFormData = {
    tools: [
      { toolId: 'cursor', plan: 'Business', monthlySpend: 80, seats: 2 },
      { toolId: 'claude', plan: 'Max', monthlySpend: 100, seats: 1 },
    ],
    teamSize: 2,
    useCase: 'coding',
  }
  const result = runAudit(input)
  expect(result.totalMonthlySavings).toBe(120)
  expect(result.totalAnnualSavings).toBe(1440)
})

// ─── Test 7: Free plan with non-zero spend flags anomaly ─────────────────────
test('Free plan with non-zero spend flags as billing anomaly', () => {
  const input: SpendFormData = {
    tools: [{ toolId: 'gemini', plan: 'Free', monthlySpend: 500, seats: 1 }],
    teamSize: 1,
    useCase: 'research',
  }
  const result = runAudit(input)
  const rec = result.recommendations[0]
  expect(rec.recommendedAction).toBe('optimize-seats')
  expect(rec.monthlySavings).toBe(500)
})