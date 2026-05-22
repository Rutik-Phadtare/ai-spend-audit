'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AuditResult } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import LeadCapture from '@/components/LeadCapture'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  downgrade:        { label: 'Downgrade Plan',  color: 'bg-yellow-500' },
  switch:           { label: 'Switch Tool',      color: 'bg-blue-500'   },
  'optimize-seats': { label: 'Reduce Seats',     color: 'bg-orange-500' },
  'already-optimal':{ label: 'Already Optimal',  color: 'bg-green-500'  },
  'use-credits':    { label: 'Use Credits',      color: 'bg-purple-500' },
}

export default function AuditPageClient() {
  const { id } = useParams()
  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/audit?id=${id}`)
      .then(r => r.json())
      .then(data => { setAudit(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading your audit...</p>
    </div>
  )

  if (!audit) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Audit not found.</p>
    </div>
  )

  const { recommendations, totalMonthlySavings, totalAnnualSavings, totalMonthlySpend, aiSummary } = audit
  const isHighSavings = totalMonthlySavings > 500
  const isOptimal = totalMonthlySavings <= 0

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <span className="font-bold text-xl">SpendSmart AI</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Copy Share Link
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <Card className={isOptimal ? 'border-green-500' : 'border-yellow-500'}>
          <CardContent className="pt-6 text-center space-y-2">
            {isOptimal ? (
              <>
                <p className="text-4xl font-bold text-green-500">✓ Optimized</p>
                <p className="text-muted-foreground">You&apos;re spending well. No significant savings identified.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Potential Savings Found</p>
                <p className="text-5xl font-bold text-yellow-400">${totalMonthlySavings.toFixed(0)}<span className="text-2xl">/mo</span></p>
                <p className="text-xl text-muted-foreground">${totalAnnualSavings.toFixed(0)} saved per year</p>
                <p className="text-sm text-muted-foreground">Currently spending ${totalMonthlySpend}/mo</p>
              </>
            )}
          </CardContent>
        </Card>

        {aiSummary && (
          <Card>
            <CardHeader><CardTitle className="text-base">AI Analysis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Tool Breakdown</h2>
          {recommendations.map((rec, i) => {
            const action = ACTION_LABELS[rec.recommendedAction]
            return (
              <Card key={i}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{rec.toolName}</span>
                    <span className={`text-xs text-white px-2 py-1 rounded-full ${action.color}`}>
                      {action.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{rec.currentPlan} · ${rec.currentSpend}/mo</span>
                    {rec.monthlySavings > 0 && (
                      <>
                        <span>→</span>
                        <span className="text-green-400 font-medium">Save ${rec.monthlySavings}/mo</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {isHighSavings && (
          <Card className="border-purple-500 bg-purple-950/20">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="font-bold text-lg">You could save even more with Credex</p>
              <p className="text-sm text-muted-foreground">
                Credex sells discounted AI credits — the same tools at 20–40% off retail.
                At ${totalMonthlySavings.toFixed(0)}/mo in identified savings, a Credex consultation pays for itself immediately.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">Book Free Credex Consultation</Button>
            </CardContent>
          </Card>
        )}

        {!leadSubmitted ? (
          <Card>
            <CardContent className="pt-6 space-y-3">
              {isOptimal
                ? <p className="font-medium text-center">Get notified when new optimizations apply to your stack</p>
                : <p className="font-medium text-center">Get your full report by email</p>
              }
              {!showLeadForm
                ? <Button className="w-full" onClick={() => setShowLeadForm(true)}>
                    {isOptimal ? 'Notify me of future savings' : 'Email me this report →'}
                  </Button>
                : <LeadCapture
                    auditId={id as string}
                    totalMonthlySavings={totalMonthlySavings}
                    onSuccess={() => setLeadSubmitted(true)}
                  />
              }
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500">
            <CardContent className="pt-6 text-center">
              <p className="text-green-400 font-medium">✓ Report sent! Check your inbox.</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <a href="/" className="text-sm text-muted-foreground underline">Run a new audit</a>
        </div>
      </div>
    </main>
  )
}