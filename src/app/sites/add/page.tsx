'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/types'
import { Globe, Info, Upload } from 'lucide-react'

export default function AddSitePage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '', url: '', description: '', category: 'other', traffic: '', geo: '', logo_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const suggestLogo = () => {
    if (form.url) {
      const clean = form.url.replace(/^https?:\/\//, '').split('/')[0]
      set('logo_url', `https://www.google.com/s2/favicons?domain=${clean}&sz=64`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      let url = form.url.trim()
      if (!url.startsWith('http')) url = 'https://' + url

      const { error: insertError } = await supabase.from('websites').insert({
        owner_id: user.id,
        name: form.name.trim(),
        url,
        description: form.description.trim() || null,
        category: form.category,
        traffic: form.traffic ? parseInt(form.traffic) : null,
        geo: form.geo.trim() || null,
        logo_url: form.logo_url.trim() || null,
      })
      if (insertError) throw insertError
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении сайта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Globe size={24} /> Добавить сайт
        </h1>
        <p className="text-gray-500 text-sm mt-1">Разместите свой сайт в каталоге для поиска партнёров</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Название <span className="text-red-500">*</span></label>
            <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Мой блог" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL <span className="text-red-500">*</span></label>
            <input required type="text" value={form.url} onChange={e => set('url', e.target.value)}
              onBlur={suggestLogo} placeholder="example.com" className="input-base" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
          <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Расскажите об аудитории и условиях обмена..." className="input-base resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория <span className="text-red-500">*</span></label>
            <select required value={form.category} onChange={e => set('category', e.target.value)} className="input-base bg-white">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              Трафик/мес <Info size={12} className="text-gray-400" />
            </label>
            <input type="number" min="0" value={form.traffic} onChange={e => set('traffic', e.target.value)}
              placeholder="50000" className="input-base" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Гео аудитории</label>
            <input type="text" value={form.geo} onChange={e => set('geo', e.target.value)}
              placeholder="RU, UA, BY" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL логотипа</label>
            <div className="flex gap-2">
              <input type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)}
                placeholder="https://..." className="input-base" />
              <button type="button" onClick={suggestLogo} title="Автоопределить" className="btn-secondary px-3 flex-shrink-0">
                <Upload size={14} />
              </button>
            </div>
          </div>
        </div>

        {form.logo_url && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.logo_url} alt="logo" className="w-10 h-10 object-contain rounded" />
            <p className="text-sm text-gray-600">Предпросмотр логотипа</p>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
          <Info size={15} className="flex-shrink-0" />
          После добавления сайт появится в каталоге и другие смогут предложить вам обмен.
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 py-2.5">Отмена</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
            {loading ? 'Сохранение...' : 'Добавить сайт'}
          </button>
        </div>
      </form>
    </div>
  )
}
