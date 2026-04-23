'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageCircle } from 'lucide-react'
import type { Message } from '@/lib/types'
import clsx from 'clsx'

type MessageWithSender = Message & { sender?: { id: string; full_name: string | null } }

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function groupByDate(messages: MessageWithSender[]) {
  const groups: { date: string; messages: MessageWithSender[] }[] = []
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString()
    const last = groups[groups.length - 1]
    if (last && last.date === date) last.messages.push(msg)
    else groups.push({ date, messages: [msg] })
  })
  return groups
}

export default function ChatSection({
  dealId,
  initialMessages,
  userId,
}: {
  dealId: string
  initialMessages: MessageWithSender[]
  userId: string
}) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => { scrollToBottom('instant') }, [])
  useEffect(() => { scrollToBottom() }, [messages.length, scrollToBottom])

  useEffect(() => {
    const channel = supabase
      .channel(`deal-chat-${dealId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `deal_id=eq.${dealId}` },
        async (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.sender_id === userId) return
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', newMsg.sender_id)
            .single()
          setMessages(prev => [...prev, { ...newMsg, sender: sender ?? undefined }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [dealId, userId])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    const optimistic: MessageWithSender = {
      id: `opt-${Date.now()}`,
      deal_id: dealId,
      sender_id: userId,
      text: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ deal_id: dealId, sender_id: userId, text: trimmed })
      .select('*')
      .single()

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...data } : m))
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    }

    setSending(false)
    inputRef.current?.focus()
  }

  const groups = groupByDate(messages)

  return (
    <div className="card flex flex-col" style={{ height: 'calc(100vh - 420px)', minHeight: '400px' }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <MessageCircle size={16} className="text-navy-400" />
        <span className="font-semibold text-navy-900 text-sm">Чат по сделке</span>
        <span className="text-xs text-gray-400 ml-auto">{messages.length} сообщений</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
            <MessageCircle size={32} className="mb-3 opacity-30" />
            <p>Начните обсуждение условий обмена</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(group.messages[0].created_at)}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {group.messages.map((msg, i) => {
              const isOwn = msg.sender_id === userId
              const prev = group.messages[i - 1]
              const isFirst = !prev || prev.sender_id !== msg.sender_id

              return (
                <div key={msg.id} className={clsx('flex mb-1', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && isFirst && (
                    <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 text-xs font-bold flex items-center justify-center mr-2 mt-auto mb-0.5 flex-shrink-0">
                      {msg.sender?.full_name?.[0] ?? '?'}
                    </div>
                  )}
                  {!isOwn && !isFirst && <div className="w-8 flex-shrink-0" />}

                  <div className={clsx(
                    'max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    isOwn ? 'bg-navy-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  )}>
                    {!isOwn && isFirst && (
                      <p className="text-xs font-semibold text-navy-600 mb-1">{msg.sender?.full_name ?? 'Участник'}</p>
                    )}
                    <p className="break-words">{msg.text}</p>
                    <p className={clsx('text-xs mt-1', isOwn ? 'text-navy-400' : 'text-gray-400')}>
                      {formatTime(msg.created_at)}
                      {msg.id.startsWith('opt-') && ' ·'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Напишите сообщение..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          maxLength={2000}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e) }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-navy-900 hover:bg-navy-800 text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
