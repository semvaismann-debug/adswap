import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'
import ChatSection from './ChatSection'
import DealStatusSection from './DealStatusSection'
import type { DealStatus } from '@/lib/types'

type Params = Promise<{ id: string }>

export default async function DealPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: deal } = await supabase
    .from('deals')
    .select(`
      *,
      site_from:websites!deals_website_from_fkey(id, name, url),
      site_to:websites!deals_website_to_fkey(id, name, url),
      initiator:profiles!deals_initiator_id_fkey(id, full_name),
      receiver:profiles!deals_receiver_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single()

  if (!deal) notFound()

  const isParticipant = deal.initiator_id === user.id || deal.receiver_id === user.id
  if (!isParticipant) redirect('/deals')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name)')
    .eq('deal_id', id)
    .order('created_at', { ascending: true })

  const isInitiator = deal.initiator_id === user.id
  const partner = isInitiator ? deal.receiver : deal.initiator

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/deals" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 mb-6 transition-colors">
        <ArrowLeft size={14} /> Назад к сделкам
      </Link>

      {/* Deal header */}
      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex flex-col items-center gap-1 text-center min-w-0">
              <div className="w-10 h-10 bg-navy-50 rounded-lg border border-gray-100 flex items-center justify-center">
                <Globe size={18} className="text-navy-400" />
              </div>
              <Link href={`/sites/${(deal.site_from as { id: string })?.id}`}
                className="text-xs font-medium text-navy-900 hover:text-blue-600 truncate max-w-[100px]">
                {(deal.site_from as { name: string })?.name}
              </Link>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="h-px bg-gray-200 w-full" />
              <span className="text-xs text-gray-400">обмен</span>
              <div className="h-px bg-gray-200 w-full" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center min-w-0">
              <div className="w-10 h-10 bg-navy-50 rounded-lg border border-gray-100 flex items-center justify-center">
                <Globe size={18} className="text-navy-400" />
              </div>
              <Link href={`/sites/${(deal.site_to as { id: string })?.id}`}
                className="text-xs font-medium text-navy-900 hover:text-blue-600 truncate max-w-[100px]">
                {(deal.site_to as { name: string })?.name}
              </Link>
            </div>
          </div>
          <div className="sm:ml-4">
            <div className="text-xs text-gray-500 mb-1">
              Партнёр: <span className="font-medium text-navy-900">{(partner as { full_name: string })?.full_name ?? '—'}</span>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(deal.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      <DealStatusSection dealId={id} status={deal.status as DealStatus} />
      <ChatSection dealId={id} initialMessages={messages ?? []} userId={user.id} />
    </div>
  )
}
