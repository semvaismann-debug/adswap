import Link from 'next/link'
import Image from 'next/image'
import { Globe, Users, MapPin, ArrowRight } from 'lucide-react'
import type { Website } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import clsx from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  technology:    'bg-blue-100 text-blue-700',
  business:      'bg-emerald-100 text-emerald-700',
  lifestyle:     'bg-pink-100 text-pink-700',
  news:          'bg-orange-100 text-orange-700',
  entertainment: 'bg-purple-100 text-purple-700',
  education:     'bg-cyan-100 text-cyan-700',
  health:        'bg-green-100 text-green-700',
  travel:        'bg-yellow-100 text-yellow-700',
  food:          'bg-red-100 text-red-700',
  other:         'bg-gray-100 text-gray-700',
}

function formatTraffic(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function SiteCard({ site }: { site: Website }) {
  const categoryLabel = CATEGORIES.find(c => c.value === site.category)?.label ?? site.category

  return (
    <Link href={`/sites/${site.id}`} className="card p-5 flex flex-col gap-4 hover:shadow-md hover:border-navy-200 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {site.logo_url ? (
            <Image src={site.logo_url} alt={site.name} width={48} height={48} className="object-contain" />
          ) : (
            <Globe size={22} className="text-navy-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy-900 truncate group-hover:text-navy-700 transition-colors">
            {site.name}
          </h3>
          <p className="text-xs text-gray-400 truncate">{site.url}</p>
        </div>
      </div>

      {site.description && (
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{site.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {site.traffic && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {formatTraffic(site.traffic)}/мес
            </span>
          )}
          {site.geo && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {site.geo}
            </span>
          )}
        </div>
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[site.category] ?? CATEGORY_COLORS.other)}>
          {categoryLabel}
        </span>
      </div>

      <div className="flex items-center justify-end text-navy-600 text-xs font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mt-2">
        Подробнее <ArrowRight size={12} />
      </div>
    </Link>
  )
}
