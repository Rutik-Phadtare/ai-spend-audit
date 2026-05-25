'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpendFormData, ToolEntry, ToolId, UseCase } from '@/types'
import { TOOLS } from '@/lib/pricing-data'

const STORAGE_KEY = 'ai-spend-audit-form'

const DEFAULT_TOOL: ToolEntry = {
  toolId: 'cursor',
  plan: 'Pro',
  monthlySpend: 20,
  seats: 1,
}

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: 'coding', label: 'Coding / Engineering' },
  { value: 'writing', label: 'Writing / Content' },
  { value: 'data', label: 'Data / Analytics' },
  { value: 'research', label: 'Research' },
  { value: 'mixed', label: 'Mixed / General' },
]

interface SpendFormProps {
  onSubmit: (data: SpendFormData) => void
  isLoading: boolean
}

export default function SpendForm({ onSubmit, isLoading }: SpendFormProps) {
  const [mounted, setMounted] = useState(false)
  const [tools, setTools] = useState<ToolEntry[]>([{ ...DEFAULT_TOOL }])
  const [teamSize, setTeamSize] = useState<number>(1)
  const [useCase, setUseCase] = useState<UseCase>('coding')

  // Mount + load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      setTools(parsed.tools || [{ ...DEFAULT_TOOL }])
      setTeamSize(parsed.teamSize || 1)
      setUseCase(parsed.useCase || 'coding')
    }
    setMounted(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tools, teamSize, useCase }))
  }, [tools, teamSize, useCase, mounted])

  const addTool = () => setTools([...tools, { ...DEFAULT_TOOL }])

  const removeTool = (index: number) => setTools(tools.filter((_, i) => i !== index))

  const updateTool = (index: number, field: keyof ToolEntry, value: string | number) => {
    const updated = [...tools]
    if (field === 'toolId') {
      const toolInfo = TOOLS.find(t => t.id === value)
      updated[index] = {
        ...updated[index],
        toolId: value as ToolId,
        plan: toolInfo?.plans[0].name || '',
        monthlySpend: toolInfo?.plans[0].pricePerSeat || 0,
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setTools(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ tools, teamSize, useCase })
  }

  const totalSpend = tools.reduce((s, t) => s + Number(t.monthlySpend), 0)

  // Don't render until client is ready
  if (!mounted) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Team</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Team Size</Label>
            <Input
              type="number"
              min={1}
              value={teamSize}
              onChange={e => setTeamSize(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="use-case">Primary Use Case</Label>
            <select
              id="use-case"
              value={useCase}
              onChange={e => setUseCase(e.target.value as UseCase)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              {USE_CASES.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tools.map((tool, index) => {
          const toolInfo = TOOLS.find(t => t.id === tool.toolId)
          return (
            <Card key={index}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Tool {index + 1}</CardTitle>
                {tools.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTool(index)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`tool-${index}`}>AI Tool</Label>
                  <select
                    id={`tool-${index}`}
                    value={tool.toolId}
                    onChange={e => updateTool(index, 'toolId', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {TOOLS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`plan-${index}`}>Plan</Label>
                  <select
                    id={`plan-${index}`}
                    value={tool.plan}
                    onChange={e => updateTool(index, 'plan', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {toolInfo?.plans.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                <Label>Monthly Spend ($)</Label>
                <Input
                  type="number"
                  min={0}
                  // Shows the number if it exists; if it's blank or undefined, falls back to empty string
                  value={tool.monthlySpend === undefined || tool.monthlySpend === null ? "" : tool.monthlySpend}
                  onChange={e => updateTool(index, 'monthlySpend', e.target.value)}
                  // Faint background text when the field is completely empty
                  placeholder="0" 
                  required
                />
              </div>
                <div className="space-y-2">
                <Label>Number of Seats</Label>
                <Input
                  type="number"
                  min={1}
                  value={tool.seats === undefined || tool.seats === null ? "" : tool.seats}
                  onChange={e => updateTool(index, 'seats', e.target.value)}
                  // Faint background text suggesting a baseline of 1 seat
                  placeholder="1"
                  required
                />
              </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button type="button" variant="outline" onClick={addTool} className="w-full">
        + Add Another Tool
      </Button>

      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total monthly spend</p>
            <p className="text-2xl font-bold">${totalSpend.toLocaleString()}/mo</p>
          </div>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Run Free Audit →'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}