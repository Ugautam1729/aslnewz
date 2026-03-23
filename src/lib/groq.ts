import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

export async function summarizeArticle(title: string, content: string): Promise<string> {
  try {
    const text = content.replace(/<[^>]*>/g, '').substring(0, 2000)
    const res = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 100,
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a news summarizer for AsliNewz, an Indian mobile news app. Write EXACTLY 2 punchy sentences. Be direct and factual. For Indian readers aged 18-35.' },
        { role: 'user', content: `Title: ${title}\n\nContent: ${text}\n\nWrite 2-sentence summary:` },
      ],
    })
    return res.choices[0]?.message?.content?.trim() ?? title
  } catch (e) {
    console.error('Groq summarize error:', e)
    return title
  }
}

export async function chatWithArticle(
  title: string,
  content: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    const text = content.replace(/<[^>]*>/g, '').substring(0, 3000)
    const res = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `You are AsliNewz AI — a smart, friendly news assistant. Answer ONLY based on this article. Be conversational and concise. If question is outside the article scope, say so politely.\n\nArticle: "${title}"\n\n${text}`,
        },
        ...messages.slice(-6), // keep last 6 messages for context
      ],
    })
    return res.choices[0]?.message?.content?.trim() ?? "I couldn't find an answer in this article."
  } catch (e) {
    console.error('Groq chat error:', e)
    return 'AsliNewz AI is busy right now. Try again in a moment!'
  }
}
