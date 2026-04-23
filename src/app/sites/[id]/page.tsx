import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Globe, Users, MapPin, Calendar, ArrowLeft, ExternalLink } from 'lucide-react'
import { CATEGORIES } from '@/lib/types'
import ProposeDealButton from './ProposeDealButton'
import EditSiteSection from './EditSiteSection'

type Params = Promise<{ id: string }>

function formatTraffic(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default async function SitePage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: site } = await supabase
    .from('websites')
    .select('*, profiles(id, full_name, avatar_url, created_at)')
    .eq('id', id)
    .single()

  if (!site) notFound()

  const isOwner = user?.id === site.owner_id
  const categoryLabel = CATEGORIES.find(c => c.value === site.category)?.label ?? site.category
  const siteUrl = site.url.startsWith('http') ? site.url : `https://${site.url}`
  const createdAt = new Date(site.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })

  let mySites: { id: string; name: string }[] = []
  if (user && !isOwner) {
    const { data } = await supabase.from('websites').select('id, name').eq('owner_id', user.id)
    mySites = data ?? []
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 mb-6 transition-colors">
        <ArrowLeft size={14} /> Назад в каталог
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-xl bg-navy-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {site.logo_url
                  ? <Image src={site.logo_url} alt={site.name} width={64} height={64} className="object-contain" />
                  : <Globe size={28} className="text-navy-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-navy-900">{site.name}</h1>
                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5">
                  {site.url} <ExternalLink size={12} />
                </a>
              </div>
            </div>
            {site.description && <p className="text-gray-600 leading-relaxed mb-4">{site.description}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="bg-navy-100 text-navy-700 text-sm font-medium px-3 py-1 rounded-full">{categoryLabel}</span>
              {site.geo && (
                <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <MapPin size={12} /> {site.geo}
                </span>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-navy-900 mb-4">Характеристики</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1"><Users size={12} />Трафик в месяц</div>
                <div className="text-xl font-bold text-navy-900">{formatTraffic(site.traffic)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1"><MapPin size={12} />Гео аудитории</div>
                <div className="text-xl font-bold text-navy-900">{site.geo || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1"><Globe size={12} />Категория</div>
                <div className="text-base font-semibold text-navy-900">{categoryLabel}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1"><Calendar size={12} />Добавлен</div>
                <div className="text-sm font-semibold text-navy-900">{createdAt}</div>
              </div>
            </div>
          </div>

          {isOwner && <EditSiteSection site={site} />}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Владелец</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                {(site.profiles as { full_name: string } | null)?.full_name?.[0] ?? '?'}
              </div>
              <div>
                <p className="font-medium text-navy-900">{(site.profiles as { full_name: string } | null)?.full_name ?? 'Пользователь'}</p>
                <p className="text-xs text-gray-400">Участник с {new Date(site.created_at).getFullYear()}</p>
              </div>
            </div>
          </div>

          <div className="card p-5 flex flex-col gap-3">
            {!user && (
              <>
                <p className="text-sm text-gray-600 text-center">Войдите, чтобы предложить обмен</p>
                <Link href="/auth" className="btn-primary w-full text-center py-2.5">Войти</Link>
              </>
            )}
            {user && isOwner && (
              <div className="text-center text-sm text-gray-500 py-2">Это ваш сайт</div>
            )}
            {user && !isOwner && (
              <ProposeDealButton
                siteId={site.id}
                siteName={site.name}
                receiverId={site.owner_id}
                mySites={mySites}
                userId={user.id}
              />
            )}
          </div>

          <a href={siteUrl} target="_blank" rel="noopener noreferrer"
            className="btn-secondary flex items-center justify-center gap-2 py-2.5">
            <ExternalLink size={14} /> Открыть сайт
          </a>
        </div>
      </div>
    </div>
  )
}
