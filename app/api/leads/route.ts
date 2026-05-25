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
      return NextResponse.json({ success: true })
    }

    // Save lead to Firestore
    await addDoc(collection(db, 'leads'), {
      ...lead,
      createdAt: new Date().toISOString(),
    })

    // Send email via Brevo SMTP
    if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS) {
      try {
        await sendConfirmationEmail(lead)
        console.log('Email sent successfully to:', lead.email)
      } catch (err: any) {
        console.error('Email sending failed:', err.message)
      }
    } else {
      console.warn('Warning: Brevo SMTP credentials missing.')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead save error:', error)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}

async function sendConfirmationEmail(lead: LeadData) {
  const nodemailer = await import('nodemailer')

  const transporter = nodemailer.default.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"SpendSmart AI" <${process.env.BREVO_SENDER_EMAIL}>`,
    to: lead.email,
    subject: 'Your AI spend audit results',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
    },
    // Plain text version helps avoid promotional tab
    text: `Hi${lead.companyName ? ` from ${lead.companyName}` : ''},

Your audit identified $${lead.totalMonthlySavings.toFixed(0)}/month in potential savings on your AI tools.

${lead.totalMonthlySavings > 500 ? 'Your savings potential qualifies for a free Credex consultation. Our team will reach out shortly.' : ''}

View your full report: ${process.env.NEXT_PUBLIC_APP_URL}/audit/${lead.auditId}

Built by Credex · Free forever · No spam`,
    html: `
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
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/audit/${lead.auditId}"
           style="display: inline-block; background: #1e293b; color: white;
           padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
          View Your Full Report →
        </a>
        <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
          Built by Credex · Free forever · No spam
        </p>
      </div>
    `,
  })
}