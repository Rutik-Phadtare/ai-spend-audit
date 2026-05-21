'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LeadCaptureProps {
  auditId: string
  totalMonthlySavings: number
  onSuccess: () => void
}

export default function LeadCapture({ auditId, totalMonthlySavings, onSuccess }: LeadCaptureProps) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) return // Bot detected
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, companyName: company, role,
          auditId, totalMonthlySavings,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot - hidden from real users */}
      <input
        type="text"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />
      <div className="space-y-1">
        <Label>Email *</Label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Company</Label>
          <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc" />
        </div>
        <div className="space-y-1">
          <Label>Role</Label>
          <Input value={role} onChange={e => setRole(e.target.value)} placeholder="CTO / Founder" />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending...' : 'Send my report →'}
      </Button>
    </form>
  )
}