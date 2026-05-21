import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AuditResult } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const audit: AuditResult = await req.json()
    const { recommendations, totalMonthlySavings, totalAnnualSavings, formData } = audit

    const toolSummary = recommendations
      .map(r => `${r.toolName} (${r.currentPlan}): $${r.currentSpend}/mo → ${r.recommendedAction === 'already-optimal' ? 'optimal' : `save $${r.monthlySavings}/mo`}`)
      .join('\n')

    const prompt = `You are a financial advisor for startups. Write a 100-word personalized audit summary for a team of ${formData.teamSize} primarily using AI tools for ${formData.useCase}.

Their current AI tool spend:
${toolSummary}

Total potential savings: $${totalMonthlySavings}/month ($${totalAnnualSavings}/year)

Write a direct, confident 100-word paragraph. Start with the biggest insight. Be specific with numbers. End with one actionable next step. Do not use bullet points. Do not use headers. Sound like a trusted advisor, not a sales pitch.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const summary = result.response.text()

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 })
  }
}