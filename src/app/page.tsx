import { createClient } from '@/lib/supabase/server'
import CatalogSection from '@/components/sites/CatalogSection'
import { Zap } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: sites, count } = await supabase
    .from('websites')
    .select('*, profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-navy-800 border border-navy-700 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
            <Zap size={14} />
            P2P обмен рекламой
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Обменяйтесь рекламой<br />
            <span className="text-blue-400">с другими сайтами</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Найдите партнёров для взаимного размещения рекламы. Бесплатно, прозрачно, напрямую.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth" className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Начать бесплатно
            </Link>
            <a href="#catalog" className="btn-secondary py-3 px-6">
              Смотреть каталог
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-7xl mx-auto flex justify-center gap-12 text-center">
          <div>
            <div className="text-2xl font-bold text-navy-900">{count ?? 0}</div>
            <div className="text-xs text-gray-500">сайтов</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy-900">P2P</div>
            <div className="text-xs text-gray-500">без посредников</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy-900">0₽</div>
            <div className="text-xs text-gray-500">комиссии</div>
          </div>
        </div>
      </div>

      {/* Catalog — client component for filtering/search */}
      <CatalogSection initialSites={sites ?? []} />
    </div>
  )
}
