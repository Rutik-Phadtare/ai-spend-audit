import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { LeadData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const lead: LeadData = await req.json()

    // Honeypot check (handled in frontend, double-check here)
    if (!lead.email || !lead.email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Rate limit: max 3 leads per email
    const existing = await getDocs(
      query(collection(db, 'leads'), where('email', '==', lead.email))
    )
    if (existing.size >= 3) {
      return NextResponse.json({ success: true }) // Silent pass
    }

    await addDoc(collection(db, 'leads'), {
      ...lead,
      createdAt: new Date().toISOString(),
    })

    // Send email via Resend (optional - skip if no API key)
    if (process.env.RESEND_API_KEY) {
      await sendConfirmationEmail(lead)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead save error:', error)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}

async function sendConfirmationEmail(lead: LeadData) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SpendSmart AI <noreply@credex.rocks>',
      to: lead.email,
      subject: 'Your AI Spend Audit Report',
      html: `
        <h2>Your AI Spend Audit is Ready</h2>
        <p>Hi${lead.companyName ? ` from ${lead.companyName}` : ''},</p>
        <p>We found <strong>$${lead.totalMonthlySavings.toFixed(0)}/month</strong> in potential savings on your AI tools.</p>
        ${lead.totalMonthlySavings > 500 ? '<p>Our team will reach out shortly to discuss how Credex credits can help you capture even more of those savings.</p>' : ''}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/audit/${lead.auditId}">View your full report →</a></p>
      `,
    }),
  })
}