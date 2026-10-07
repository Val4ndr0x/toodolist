import { categoryEmoji, money } from '~/composables/useFinance'
import { COLLECTION_KINDS } from '~/composables/useCollections'

export type SearchResult = {
  id: string
  group: string
  label: string
  subtitle?: string
  emoji?: string
  image?: string | null
  to: string
}

const open = ref(false)

export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const PAGES: SearchResult[] = [
  { id: 'p-hoy', group: 'Ir a', label: 'Hoy', emoji: '☀️', to: '/hoy' },
  { id: 'p-listas', group: 'Ir a', label: 'Listas', emoji: '📋', to: '/' },
  { id: 'p-libros', group: 'Ir a', label: 'Libros', emoji: '📓', to: '/books' },
  { id: 'p-tablero', group: 'Ir a', label: 'Tablero', emoji: '🧩', to: '/tablero' },
  { id: 'p-colecciones', group: 'Ir a', label: 'Colecciones', emoji: '🗃️', to: '/colecciones' },
  { id: 'p-calendario', group: 'Ir a', label: 'Calendario', emoji: '📅', to: '/calendario' },
  { id: 'p-cafe', group: 'Ir a', label: 'Café', emoji: '☕', to: '/cafe' },
  { id: 'p-casita', group: 'Ir a', label: 'Casita', emoji: '🏠', to: '/casita' },
  { id: 'p-clientes', group: 'Ir a', label: 'Clientes', emoji: '🎀', to: '/clientes' },
  { id: 'p-finanzas', group: 'Ir a', label: 'Finanzas', emoji: '💸', to: '/finanzas' },
  { id: 'p-fijos', group: 'Ir a', label: 'Gastos fijos', subtitle: 'Finanzas', emoji: '↻', to: '/finanzas?tab=fijos' },
  { id: 'p-stats', group: 'Ir a', label: 'Estadísticas', emoji: '📊', to: '/estadisticas' },
]

/** Busca en todas las secciones de la app. Estado compartido: la paleta se abre desde cualquier página. */
export function useGlobalSearch() {
  const { lists } = useLists()
  const { books } = useBooks()
  const { clients } = useClients()
  const { collections } = useCollections()
  const { transactions } = useFinance()
  const { events } = useCalendar()
  const { books: readingBooks } = useReadingTracker()

  /** Todo lo buscable; se recalcula solo cuando cambian los datos. */
  const index = computed<(SearchResult & { haystack: string })[]>(() => {
    const out: (SearchResult & { haystack: string })[] = []
    const push = (r: SearchResult, ...extra: (string | null | undefined)[]) =>
      out.push({ ...r, haystack: normalizeSearch([r.label, r.subtitle, ...extra].filter(Boolean).join(' ')) })

    for (const p of PAGES) push(p)
    for (const l of lists.value) {
      push({ id: `l-${l.id}`, group: 'Listas', label: l.name, subtitle: `${l.tasks.filter((t) => !t.completed).length} pendientes`, emoji: '📋', to: `/list/${l.id}` }, l.category)
      for (const t of l.tasks) {
        push(
          {
            id: `t-${t.id}`,
            group: 'Tareas',
            label: t.text,
            subtitle: [l.name, t.dueDate && `vence ${t.dueDate}`, t.assignee && `👤 ${t.assignee}`, t.completed && 'hecha'].filter(Boolean).join(' · '),
            emoji: t.completed ? '✅' : '⭐',
            to: `/list/${l.id}`,
          },
          ...t.subtasks.map((s) => s.text),
        )
      }
    }
    for (const c of clients.value) {
      push({ id: `c-${c.id}`, group: 'Clientes', label: c.name, subtitle: c.order || c.category || undefined, emoji: '🎀', image: c.sticker, to: `/clientes?id=${c.id}` }, c.category)
    }
    for (const b of books.value) push({ id: `b-${b.id}`, group: 'Libros', label: b.name, subtitle: `${b.pages.length} páginas`, emoji: '📓', to: `/books/${b.id}` })
    for (const col of collections.value) {
      const kind = COLLECTION_KINDS[col.kind]
      push({ id: `co-${col.id}`, group: 'Colecciones', label: col.name, subtitle: kind.label, emoji: kind.emoji, to: `/colecciones/${col.id}` })
      for (const it of col.items) {
        push({ id: `ci-${it.id}`, group: 'Colecciones', label: it.title, subtitle: [col.name, it.creator].filter(Boolean).join(' · '), emoji: kind.emoji, image: it.image?.startsWith('data:') ? null : it.image, to: `/colecciones/${col.id}` }, it.notes)
      }
    }
    for (const e of events.value) {
      push({ id: `e-${e.id}`, group: 'Calendario', label: e.title, subtitle: [e.date, e.time].filter(Boolean).join(' '), emoji: '📅', to: '/calendario' }, e.note)
    }
    for (const t of transactions.value.slice(0, 1500)) {
      push(
        {
          id: `f-${t.id}`,
          group: 'Movimientos',
          label: t.note || t.category,
          subtitle: `${t.type === 'gasto' ? '−' : '+'}${money(t.amount)} · ${t.category} · ${t.date}`,
          emoji: categoryEmoji(t.category),
          to: `/finanzas?tab=movimientos&month=${t.date.slice(0, 7)}&q=${encodeURIComponent(t.note || t.category)}`,
        },
        t.category,
      )
    }
    for (const rb of readingBooks.value) {
      push({ id: `r-${rb.id}`, group: 'Lecturas', label: rb.title, subtitle: rb.author, emoji: '📚', image: rb.cover, to: '/finanzas?tab=libros' })
    }
    return out
  })

  /** Resultados para `query`: todas las palabras deben aparecer; prioriza coincidencias al inicio. */
  function search(query: string, limit = 40): SearchResult[] {
    const words = normalizeSearch(query.trim()).split(/\s+/).filter(Boolean)
    if (!words.length) return PAGES
    const scored: { r: SearchResult; score: number }[] = []
    for (const r of index.value) {
      if (!words.every((w) => r.haystack.includes(w))) continue
      const label = normalizeSearch(r.label)
      const score = (label.startsWith(words[0]!) ? 0 : label.includes(words[0]!) ? 1 : 2) + (r.group === 'Ir a' ? -1 : 0)
      scored.push({ r, score })
    }
    return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((s) => s.r)
  }

  return { open, search }
}
