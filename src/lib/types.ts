export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Category =
  | 'technology'
  | 'business'
  | 'lifestyle'
  | 'news'
  | 'entertainment'
  | 'education'
  | 'health'
  | 'travel'
  | 'food'
  | 'other'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'technology', label: 'Технологии' },
  { value: 'business', label: 'Бизнес' },
  { value: 'lifestyle', label: 'Лайфстайл' },
  { value: 'news', label: 'Новости' },
  { value: 'entertainment', label: 'Развлечения' },
  { value: 'education', label: 'Образование' },
  { value: 'health', label: 'Здоровье' },
  { value: 'travel', label: 'Путешествия' },
  { value: 'food', label: 'Еда' },
  { value: 'other', label: 'Другое' },
]

export type Website = {
  id: string
  owner_id: string
  url: string
  name: string
  description: string | null
  category: Category
  traffic: number | null
  geo: string | null
  logo_url: string | null
  created_at: string
  profiles?: Profile
}

export type DealStatus = 'negotiating' | 'agreed' | 'done'

export type Deal = {
  id: string
  initiator_id: string
  receiver_id: string
  website_from: string
  website_to: string
  status: DealStatus
  created_at: string
  initiator?: Profile
  receiver?: Profile
  site_from?: Website
  site_to?: Website
}

export type Message = {
  id: string
  deal_id: string
  sender_id: string
  text: string
  created_at: string
  sender?: Profile
}
