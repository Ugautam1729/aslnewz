import Parser from 'rss-parser'
import { prisma } from '@/lib/prisma'
import { summarizeArticle } from '@/lib/groq'

const parser = new Parser({
  customFields: {
    item: [
      ['media:content',   'mediaContent',   { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure',       'enclosure',      { keepArray: false }],
    ],
  },
})

const FEEDS = [
  'https://feeds.feedburner.com/ndtvnews-top-stories',
  'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
  'https://www.thehindu.com/news/feeder/default.rss',
  'https://www.indiatoday.in/rss/home',
  'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml',
  'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
  'https://indianexpress.com/feed/',
  'https://www.livemint.com/rss/news',
  'https://timesofindia.indiatimes.com/rss/4719148.cms',
  'https://www.bollywoodhungama.com/rss/news.xml',
  'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
  'https://www.moneycontrol.com/rss/latestnews.xml',
  'https://techcrunch.com/feed/',
  'https://timesofindia.indiatimes.com/rss/858722.cms',
  'https://www.ndtv.com/business/rss',
]

// ML-style keyword weights for category detection
const CATEGORY_PATTERNS: { category: string; patterns: RegExp; weight: number }[] = [
  { category: 'Cricket',       patterns: /ipl|cricket|bcci|rohit sharma|virat kohli|test match|odi|t20|dhoni|bumrah|shami|rcb|csk|mi |kkr/i,                        weight: 1.0 },
  { category: 'Bollywood',     patterns: /bollywood|film|movie|actor|actress|srk|shah rukh|deepika|ranveer|alia bhatt|salman|katrina|hrithik|karan johar|ott|netflix india/i, weight: 1.0 },
  { category: 'Politics',      patterns: /modi|parliament|lok sabha|rajya sabha|election|bjp|congress|rahul gandhi|amit shah|cm |chief minister|government of india|political|yogi|kejriwal/i, weight: 1.0 },
  { category: 'Business',      patterns: /sensex|nifty|rupee|rbi|startup|ipo|economy|gdp|market|stock market|bank|inflation|adani|tata|reliance|mukesh ambani|budget/i, weight: 1.0 },
  { category: 'Technology',    patterns: /artificial intelligence|\bai\b|tech|app|google|apple|microsoft|iphone|android|software|chatgpt|openai|startup india|isro|elon musk/i, weight: 1.0 },
  { category: 'Sports',        patterns: /football|kabaddi|hockey|tennis|badminton|sports|athlete|tournament|championship|olympics|fifa|isl|pro kabaddi/i,              weight: 0.9 },
  { category: 'Entertainment', patterns: /entertainment|celebrity|web series|amazon prime|disney\+|hotstar|music|concert|award|grammy|oscar|filmfare/i,                  weight: 0.9 },
  { category: 'Health',        patterns: /health|covid|hospital|medicine|vaccine|disease|doctor|cancer|diabetes|mental health|ayurveda|who |pandemic/i,                  weight: 0.9 },
  { category: 'World',         patterns: /china|pakistan|usa|russia|ukraine|israel|world|international|\bun\b|nato|biden|trump|europe|middle east|war|conflict/i,        weight: 0.8 },
]

function detectCategory(title: string, desc: string): string {
  const text = title + ' ' + desc
  let best = { category: 'General', score: 0 }
  for (const { category, patterns, weight } of CATEGORY_PATTERNS) {
    const matches = (text.match(patterns) ?? []).length
    const score = matches * weight
    if (score > best.score) best = { category, score }
  }
  return best.category
}

function extractImage(item: any): string | null {
  if (item.mediaContent?.$.url)   return item.mediaContent.$.url
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url
  if (item.enclosure?.url && /\.(jpg|jpeg|png|webp)/i.test(item.enclosure.url)) return item.enclosure.url
  const c = item['content:encoded'] || item.content || ''
  const m = c.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)
  return m ? m[1] : null
}

async function getFallbackImage(keyword: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const q = encodeURIComponent(keyword.split(' ').slice(0,3).join(' '))
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${key}` },
    })
    const d = await r.json()
    return d.results?.[0]?.urls?.regular ?? null
  } catch { return null }
}

export async function ingestAllFeeds(): Promise<{ ingested: number; summarized: number }> {
  let ingested = 0, summarized = 0

  for (const feedUrl of FEEDS) {
    try {
      const parsed = await parser.parseURL(feedUrl)
      const items  = parsed.items.slice(0, 80)

      for (const item of items) {
        if (!item.title || !item.link) continue
        const exists = await prisma.article.findUnique({ where: { articleUrl: item.link } })
        if (exists) continue

        const imageUrl    = extractImage(item)
        const desc        = item.contentSnippet ?? ''
        const category    = detectCategory(item.title, desc)
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
        const content     = item['content:encoded'] || item.content || desc
        const readTime    = Math.max(1, Math.ceil(content.split(' ').length / 200))
        const breaking    = /breaking|urgent|just in|alert|exclusive:/i.test(item.title)

        const article = await prisma.article.create({
          data: { title: item.title.trim(), content, imageUrl, articleUrl: item.link, category, publishedAt, readTime, breaking, status: 'pending' },
        })
        ingested++

        try {
          const summary  = await summarizeArticle(item.title, content || desc || item.title)
          const finalImg = imageUrl ?? await getFallbackImage(item.title)
          await prisma.article.update({
            where: { id: article.id },
            data: { summary, imageUrl: finalImg, status: 'ready', score: Date.now() / 1000 },
          })
          summarized++

          if (breaking) {
            const users = await prisma.user.findMany({ select: { id: true } })
            if (users.length > 0) {
              await prisma.notification.createMany({
                data: users.map(u => ({ userId: u.id, type: 'breaking_news', title: '🔴 Breaking News', body: item.title.substring(0,120), link: `/feed` })),
                skipDuplicates: true,
              })
            }
          }
        } catch {
          await prisma.article.update({ where: { id: article.id }, data: { status: 'ready', summary: desc.substring(0,200) || item.title } })
        }
        await new Promise(r => setTimeout(r, 80))
      }
    } catch (e) { console.error('Feed error:', feedUrl, e) }
  }
  return { ingested, summarized }
}
