import { ToolId } from '@/types'

export interface PlanInfo {
  name: string
  pricePerSeat: number
  minSeats: number
  maxSeats?: number
  description: string
}

export interface ToolInfo {
  id: ToolId
  name: string
  plans: PlanInfo[]
  category: string
}

export const TOOLS: ToolInfo[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'coding',
    plans: [
      { name: 'Hobby', pricePerSeat: 0, minSeats: 1, description: 'Free tier, limited completions' },
      { name: 'Pro', pricePerSeat: 20, minSeats: 1, description: '500 fast requests/month' },
      { name: 'Business', pricePerSeat: 40, minSeats: 1, description: 'SSO, admin dashboard, enforced privacy' },
      { name: 'Enterprise', pricePerSeat: 100, minSeats: 20, description: 'Custom contracts, SLA' },
    ],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'coding',
    plans: [
      { name: 'Individual', pricePerSeat: 10, minSeats: 1, description: 'Single developer' },
      { name: 'Business', pricePerSeat: 19, minSeats: 1, description: 'Policy management, audit logs' },
      { name: 'Enterprise', pricePerSeat: 39, minSeats: 1, description: 'Fine-tuned models, Copilot Chat in GitHub.com' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'mixed',
    plans: [
      { name: 'Free', pricePerSeat: 0, minSeats: 1, description: 'Limited messages' },
      { name: 'Pro', pricePerSeat: 20, minSeats: 1, description: '5x more usage than free' },
      { name: 'Max', pricePerSeat: 100, minSeats: 1, description: '20x more usage, priority access' },
      { name: 'Team', pricePerSeat: 30, minSeats: 5, description: 'Minimum 5 seats, collaboration features' },
      { name: 'Enterprise', pricePerSeat: 60, minSeats: 10, description: 'Custom, SSO, audit logs' },
      { name: 'API direct', pricePerSeat: 0, minSeats: 1, description: 'Pay per token' },
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'mixed',
    plans: [
      { name: 'Plus', pricePerSeat: 20, minSeats: 1, description: 'GPT-4o, DALL-E, Advanced Data Analysis' },
      { name: 'Team', pricePerSeat: 30, minSeats: 2, description: 'Minimum 2 seats, shared workspace' },
      { name: 'Enterprise', pricePerSeat: 60, minSeats: 10, description: 'Custom, SSO, unlimited GPT-4' },
      { name: 'API direct', pricePerSeat: 0, minSeats: 1, description: 'Pay per token' },
    ],
  },
  {
    id: 'anthropic-api',
    name: 'Anthropic API',
    category: 'mixed',
    plans: [
      { name: 'Pay as you go', pricePerSeat: 0, minSeats: 1, description: 'Per token billing' },
    ],
  },
  {
    id: 'openai-api',
    name: 'OpenAI API',
    category: 'mixed',
    plans: [
      { name: 'Pay as you go', pricePerSeat: 0, minSeats: 1, description: 'Per token billing' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    category: 'mixed',
    plans: [
      { name: 'Free', pricePerSeat: 0, minSeats: 1, description: 'Gemini 1.5 Flash limited' },
      { name: 'Advanced', pricePerSeat: 20, minSeats: 1, description: 'Gemini Ultra, Google One 2TB' },
      { name: 'Business', pricePerSeat: 24, minSeats: 1, description: 'Workspace integration' },
      { name: 'Enterprise', pricePerSeat: 36, minSeats: 1, description: 'Advanced security, compliance' },
      { name: 'API', pricePerSeat: 0, minSeats: 1, description: 'Pay per token' },
    ],
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    category: 'coding',
    plans: [
      { name: 'Free', pricePerSeat: 0, minSeats: 1, description: 'Limited credits' },
      { name: 'Pro', pricePerSeat: 15, minSeats: 1, description: '500 credits/month' },
      { name: 'Teams', pricePerSeat: 35, minSeats: 1, description: 'Team management, priority support' },
      { name: 'Enterprise', pricePerSeat: 60, minSeats: 10, description: 'Custom, SSO, audit logs' },
    ],
  },
]

export const getToolInfo = (toolId: ToolId): ToolInfo | undefined =>
  TOOLS.find((t) => t.id === toolId)

export const getPlanInfo = (toolId: ToolId, planName: string): PlanInfo | undefined =>
  getToolInfo(toolId)?.plans.find((p) => p.name === planName)