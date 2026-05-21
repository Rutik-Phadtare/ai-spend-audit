import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc } from 'firebase/firestore'
import { AuditResult } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const audit: AuditResult = await req.json()

    // Get AI summary
    let aiSummary = ''
    try {
      const summaryRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audit),
      })
      const summaryData = await summaryRes.json()
      aiSummary = summaryData.summary || ''
    } catch {
      aiSummary = generateFallbackSummary(audit)
    }

    const finalAudit = { ...audit, aiSummary }

    // Save to Firebase
    await setDoc(doc(collection(db, 'audits'), audit.id), finalAudit)

    return NextResponse.json({ id: audit.id, success: true })
  } catch (error) {
    console.error('Audit save error:', error)
    return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { getDoc } = await import('firebase/firestore')
    const docRef = doc(collection(db, 'audits'), id)
    const snap = await getDoc(docRef)

    if (!snap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(snap.data())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 })
  }
}

function generateFallbackSummary(audit: AuditResult): string {
  const { totalMonthlySavings, totalAnnualSavings, recommendations } = audit
  const topSaving = recommendations.sort((a, b) => b.monthlySavings - a.monthlySavings)[0]

  if (totalMonthlySavings <= 0) {
    return `Great news — your AI tool stack is already well-optimized. You're spending $${audit.totalMonthlySpend}/month across ${recommendations.length} tool(s), which aligns well with your team size and use case. Keep an eye on seat counts as your team grows.`
  }

  return `Your audit identified $${totalMonthlySavings.toFixed(0)}/month ($${totalAnnualSavings.toFixed(0)}/year) in potential savings. The biggest opportunity is ${topSaving?.toolName} — ${topSaving?.reasoning} Optimizing your AI spend now means more runway for the tools that actually move the needle.`
}