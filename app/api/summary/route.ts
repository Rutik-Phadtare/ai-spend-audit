import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AuditResult } from '@/types'

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(req: NextRequest) {
  try {
    // 1. Verify API Key exists before proceeding
    if (!apiKey) {
      console.error('Configuration Error: GEMINI_API_KEY environment variable is missing.')
      return NextResponse.json(
        { error: 'API Configuration error: Missing GEMINI_API_KEY on the server.' },
        { status: 500 }
      )
    }

    const audit: AuditResult = await req.json()

    // 2. Safety Check: Verify that the incoming data structure is valid
    if (!audit || !audit.recommendations || !audit.formData) {
      return NextResponse.json(
        { error: 'Invalid request data: Missing recommendations or formData.' },
        { status: 400 }
      )
    }

    const { recommendations, totalMonthlySavings, totalAnnualSavings, formData } = audit

    // 3. Format the tool recommendations into a clean text summary
    const toolSummary = recommendations
      .map(r => `${r.toolName} (${r.currentPlan}): $${r.currentSpend}/mo → ${r.recommendedAction === 'already-optimal' ? 'optimal' : `save $${r.monthlySavings}/mo`}`)
      .join('\n')

    // Map raw use cases to natural, professional descriptions
    const useCaseLabel: Record<string, string> = {
      coding: 'software development engineering',
      writing: 'content production and copywriting',
      data: 'data analysis and business intelligence',
      research: 'market research and academic operations',
      mixed: 'general operational productivity',
    }

    const formattedUseCase = useCaseLabel[formData.useCase] || formData.useCase || 'operational workflows'

    // 4. Construct the refined prompt for a professional yet accessible analyst persona
    const prompt = `You are a sharp, analytical financial advisor for tech startups. Deliver a personalized cost-benefit summary directly to a founder running a team of ${formData.teamSize || 'unspecified size'} people heavily reliant on AI for ${formattedUseCase}.

Review their current software footprint and savings metrics carefully:
${toolSummary}

Total potential savings available: $${totalMonthlySavings || 0}/month ($${totalAnnualSavings || 0}/year)

Write a highly tailored narrative paragraph between 100 and 200 words following these rules:
- Tone: Professional, clear, and reassuring. Speak like a veteran startup advisor—not cold or robotic, but avoiding casual slang. Sound structured and financially grounded.
- Content: Start directly with the largest, highest-impact financial saving opportunity identified in the data. Explicitly tie your analysis back to how it affects a team of their size doing ${formattedUseCase} (e.g., talk about seat distribution, overlapping feature sets, or idle plans).
- Validation: Briefly acknowledge where their tech stack is already cost-efficient or well-optimized according to the numbers.
- Actionable Guidance: Provide exactly one concrete, immediate execution step to unlock the major savings.
- Form: Write a single fluid, readable paragraph. Do not use bullet points, bold headers, or introductory conversational filler like "Here is your summary". Stick strictly to numbers and clear analysis.`

    // 5. Call the Gemini API safely
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    
    // Await the response wrapper cleanly before pulling the text
    const response = await result.response
    const summary = response.text()

    // 6. Return the successfully generated summary
    return NextResponse.json({ summary })

  } catch (error: any) {
    console.error('Summary generation error details:', error)
    
    return NextResponse.json({ 
      error: 'Summary generation failed', 
      details: error?.message || String(error)
    }, { status: 500 })
  }
}