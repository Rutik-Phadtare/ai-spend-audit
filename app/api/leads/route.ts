import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { LeadData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const lead: LeadData = await req.json()

    // Honeypot/Sanity check
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

    // Save lead to Firestore
    await addDoc(collection(db, 'leads'), {
      ...lead,
      createdAt: new Date().toISOString(),
    })

    // CRITICAL FIX: We MUST await this call. 
    // In serverless environments (Vercel), background promises are killed instantly when a response is returned.
    if (process.env.BREVO_API_KEY) {
      try {
        await sendConfirmationEmail(lead)
      } catch (err: any) {
        // This will now reliably print in your terminal logs if Brevo rejects it!
        console.error('Email sending failed:', err.message)
      }
    } else {
      console.warn('Warning: BREVO_API_KEY environment variable is missing.')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead save error:', error)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}

async function sendConfirmationEmail(lead: LeadData) {
  let response: Response

  // CRITICAL FIX: Replace this with the exact email address verified on your Brevo Account!
  // If you used your personal gmail to sign up for Brevo, write that exact gmail here.
  const VERIFIED_SENDER_EMAIL = 'neo721955@gmail.com'

  try {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: { name: 'SpendSmart AI', email: VERIFIED_SENDER_EMAIL },
        to: [{ email: lead.email }],
        subject: 'Your AI Spend Audit Report',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Your AI Spend Audit is Ready 🔍</h2>
            <p>Hi${lead.companyName ? ` from ${lead.companyName}` : ''},</p>
            <p>Your audit identified <strong>$${lead.totalMonthlySavings.toFixed(0)}/month</strong> 
            in potential savings on your AI tools.</p>
            ${lead.totalMonthlySavings > 500 ? `
            <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #7c3aed;">
                <strong>Your savings potential qualifies for a free Credex consultation.</strong>
                Our team will reach out shortly to show you how to capture even more savings
                through discounted AI credits.
              </p>
            </div>` : ''}
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/audit/${lead.auditId}" 
               style="display: inline-block; background: #1e293b; color: white; 
               padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              View Your Full Report →
            </a>
            <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
              Built by Credex · Free forever · No spam
            </p>
          </div>
        `,
      }),
    })
  } catch (networkErr) {
    throw new Error(`Brevo network error: ${(networkErr as Error).message}`)
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Brevo API error ${response.status}: ${errorBody}`)
  }
}