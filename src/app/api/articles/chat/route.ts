import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chatWithArticle } from '@/lib/groq'
export async function POST(req: NextRequest) {
  try {
    const { articleId, messages } = await req.json()
    if (!articleId || !messages) return NextResponse.json({ error:'Missing fields' }, { status:400 })
    const article = await prisma.article.findUnique({ where:{ id:articleId }, select:{ title:true, content:true, summary:true } })
    if (!article) return NextResponse.json({ error:'Not found' }, { status:404 })
    const reply = await chatWithArticle(article.title, article.content ?? article.summary ?? article.title, messages)
    return NextResponse.json({ reply })
  } catch(e) {
    console.error('Chat error:', e)
    return NextResponse.json({ reply:'AsliNewz AI is busy. Try again!' })
  }
}
