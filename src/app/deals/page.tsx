import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HandshakeIcon, ArrowRight, Clock } from 'lucide-react'
import type { Deal } from '@/lib/types'

type DealRow = Deal & {
  site_from: { id: string; name: string; url: string } | null
  site_to:   { id: string; name: string; url: string } | null
  initiator: { full_name: string | null } | null
  receiver:  { full_name: string | null } | null
}

function StatusBadge({ status, isNew }: { status: string; isNew?: boolean }) {
  const map = {
    negotiating: { label: 'Обсуждается', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    agreed:      { label: 'Договорились', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    done:        { label: 'Завершено', color: 'bg-green-100 text-green-700 border-green-200' },
  } as const
  const { label, color } = map[status as keyof typeof map] ?? { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${color} flex items-center gap-1`}>
      {isNew && <span className="w-1.5 h-1.5 bg-current rounded-full" />}
      {label}
    </span>
  )
}

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      site_from:websites!deals_website_from_fkey(id, name, url),
      site_to:websites!deals_website_to_fkey(id, name, url),
      initiator:profiles!deals_initiator_id_fkey(full_name),
      receiver:profiles!deals_receiver_id_fkey(full_name)
    `)
    .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const rows = (deals ?? []) as DealRow[]
  const incoming = rows.filter(d => d.status === 'negotiating' && d.receiver_id === user.id)

  const grouped = {
    negotiating: rows.filter(d => d.status === 'negotiating'),
    agreed:      rows.filter(d => d.status === 'agreed'),
    done:        rows.filter(d => d.status === 'done'),
  }
  const labels = { negotiating: 'Обсуждаются', agreed: 'Договорились', done: 'Завершённые' }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <HandshakeIcon size={24} /> Мои сделки
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Все ваши предложения об обмене рекламой</p>
        </div>
        {incoming.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
            <Clock size={14} />
            {incoming.length} новых предложения
          </div>
        )}
      </div>

      {rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <HandshakeIcon size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Сделок пока нет</p>
          <p className="text-sm mt-1">Найдите партнёров в каталоге и предложите обмен</p>
          <Link href="/" className="btn-primary mt-4 inline-block">Перейти в каталог</Link>
        </div>
      )}

      {(Object.keys(grouped) as (keyof typeof grouped)[]).map(status => {
        const items = grouped[status]
        if (items.length === 0) return null
        return (
          <div key={status} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {labels[status]} ({items.length})
            </h2>
            <div className="flex flex-col gap-3">
              {items.map(deal => {
                const isInitiator = deal.initiator_id === user.id
                const isNewForMe = !isInitiator && deal.status === 'negotiating'
                return (
                  <Link key={deal.id} href={`/deals/${deal.id}`}
                    className={`card p-5 flex items-center gap-4 hover:shadow-md hover:border-navy-200 transition-all group ${isNewForMe ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusBadge status={deal.status} isNew={isNewForMe} />
                        {isNewForMe && <span className="text-xs text-yellow-600 font-medium">Новое предложение</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-navy-900 truncate">{deal.site_from?.name ?? '—'}</span>
                        <span className="text-gray-400 flex-shrink-0">↔</span>
                        <span className="font-medium text-navy-900 truncate">{deal.site_to?.name ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span>
                          {isInitiator
                            ? `Вы → ${deal.receiver?.full_name ?? 'получатель'}`
                            : `${deal.initiator?.full_name ?? 'инициатор'} → Вам`}
                        </span>
                        <span>•</span>
                        <span>{new Date(deal.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-navy-500 flex-shrink-0 transition-colors" />
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
