import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AI Spend Audit Results'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  return new ImageResponse(
    (
      <div style={{
        background: '#0f172a',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif', color: 'white', padding: '60px',
      }}>
        <div style={{ fontSize: 28, color: '#94a3b8', marginBottom: 16 }}>
          🔍 SpendSmart AI
        </div>
        <div style={{ fontSize: 64, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
          Your AI Spend Audit
        </div>
        <div style={{ fontSize: 28, color: '#94a3b8', textAlign: 'center' }}>
          See exactly where you&apos;re overpaying for AI tools
        </div>
        <div style={{
          marginTop: 40, background: '#1e293b',
          padding: '16px 32px', borderRadius: 12,
          fontSize: 22, color: '#4ade80',
        }}>
          Free • No login required • Results in seconds
        </div>
      </div>
    ),
    { ...size }
  )
}