import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? 'reaction'
  const key = process.env.TENOR_API_KEY
  if (!key) return NextResponse.json({ gifs: [] })
  try {
    const r = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${key}&limit=15&media_filter=gif,tinygif`)
    const d = await r.json()
    const gifs = (d.results ?? []).map((r: any) => ({ url: r.media_formats?.gif?.url, preview: r.media_formats?.tinygif?.url })).filter((g: any) => g.url)
    return NextResponse.json({ gifs })
  } catch { return NextResponse.json({ gifs: [] }) }
}
