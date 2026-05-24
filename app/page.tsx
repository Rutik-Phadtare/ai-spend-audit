'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SpendForm from '@/components/SpendForm'
import { SpendFormData, AuditResult } from '@/types'
import { runAudit } from '@/lib/audit-engine'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (formData: SpendFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Run audit engine locally
      const auditResult: AuditResult = runAudit(formData)

      // Save to Firebase + get AI summary
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditResult),
      })

      if (!res.ok) throw new Error('Failed to save audit')

      const { id } = await res.json()

      // Redirect to results page
      router.push(`/audit/${id}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <span className="font-bold text-xl">SpendSmart AI</span>
          </div>
          <span className="text-sm text-muted-foreground">Free AI Spend Audit</span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
        <div className="inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
          Free • No login required • Results in seconds
        </div>
        <div className="text-xs text-muted-foreground">
          No GitHub access • No repo scanning • No bank account needed
        </div>
      </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Are you overpaying for AI tools?
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Enter what you pay for AI tools today. Get an instant audit showing exactly
          where you&apos;re overspending and how much you could save.
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-10 text-center">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <p className="text-2xl font-bold">$4,200</p>
            <p className="text-xs text-muted-foreground">avg annual savings found</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground">AI tools supported</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <p className="text-2xl font-bold">2 min</p>
            <p className="text-xs text-muted-foreground">to complete audit</p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <SpendForm onSubmit={handleSubmit} isLoading={isLoading} />
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built by Credex · Free forever · No spam
      </footer>
    </main>
  )
}