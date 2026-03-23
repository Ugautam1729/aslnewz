import { NextRequest, NextResponse } from 'next/server'
import { ingestAllFeeds } from '@/lib/ingest'
export const maxDuration = 60
export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const result = await ingestAllFeeds()
  return NextResponse.json({ success:true, ...result })
}
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const result = await ingestAllFeeds()
  return NextResponse.json({ success:true, ...result })
}
