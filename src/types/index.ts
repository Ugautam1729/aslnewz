export interface ArticleFeed {
  id: string; title: string; summary: string | null; imageUrl: string | null
  articleUrl: string; category: string; publishedAt: string; readTime: number
  views: number; breaking?: boolean
  _count: { comments: number; saves: number }
  isSaved?: boolean
}

export interface CommentFull {
  id: string; content: string; gifUrl: string | null; createdAt: string
  likedByMe?: boolean; _count?: { likes: number }
  user: { id: string; name: string | null; username: string | null; image: string | null }
}

export interface FriendUser {
  id: string; name: string | null; username: string | null; image: string | null
}

export interface ChatMessage {
  id: string; senderId: string; receiverId: string; content: string | null
  articleId: string | null; articleTitle: string | null; articleImage: string | null
  read: boolean; createdAt: string
}

export type Category = 'All' | 'Politics' | 'Cricket' | 'Bollywood' | 'Business' | 'Technology' | 'Sports' | 'Entertainment' | 'Health' | 'World' | 'General'
export const CATEGORIES: Category[] = ['All','Politics','Cricket','Bollywood','Business','Technology','Sports','Entertainment','Health','World']
export const CAT_CLASS: Record<string,string> = {
  Politics:'cat-politics', Cricket:'cat-cricket', Bollywood:'cat-bollywood', Business:'cat-business',
  Technology:'cat-technology', Sports:'cat-sports', Entertainment:'cat-entertainment', Health:'cat-health',
  World:'cat-world', General:'cat-general',
}
