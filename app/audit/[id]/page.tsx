import { Metadata } from 'next'
import AuditPageClient from '@/components/AuditPageClient'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Spend Audit — SpendSmart AI',
    description: 'View this AI spend audit to see potential savings on AI tools.',
    openGraph: {
      title: 'AI Spend Audit Results — SpendSmart AI',
      description: 'See how much this team could save on AI tools.',
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default function AuditPage() {
  return <AuditPageClient />
}