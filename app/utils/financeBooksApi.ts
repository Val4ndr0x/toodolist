/**
 * Cómo se puede leer el libro en Internet Archive:
 * - public: completo y gratis, sin cuenta (dominio público o liberado).
 * - borrowable: préstamo digital gratis con una cuenta de archive.org.
 * - null: no hay versión digital legal y gratuita.
 */
export type BookAccess = 'public' | 'borrowable' | null

/** Libro encontrado en internet (Open Library, o Internet Archive como respaldo). Ambas APIs son gratuitas y sin clave. */
export type BookResult = {
  /** Identificador estable: "ol:/works/OL…W" o "ia:<identifier>". */
  id: string
  title: string
  author: string
  pages: number
  cover: string | null
  year: number | null
  rating: number | null
  link: string
  access: BookAccess
  /** Identificador del libro escaneado en Internet Archive (para el lector). */
  ia: string | null
}

export type AccessFilter = 'leer' | 'publico' | 'todos'

export const ACCESS_FILTERS: { id: AccessFilter; label: string; hint: string }[] = [
  { id: 'leer', label: '📖 Para leer gratis', hint: 'Lectura completa o préstamo digital gratuito, en español' },
  { id: 'publico', label: '🔓 Sin cuenta', hint: 'Completos y libres, sin registrarte (muchos en inglés)' },
  { id: 'todos', label: '🔎 Todos', hint: 'Incluye libros sin versión digital gratuita' },
]

/** Lector incrustable de Internet Archive. */
export const readerUrl = (ia: string) => `https://archive.org/embed/${encodeURIComponent(ia)}`
/** Página del libro en Internet Archive (para pedir el préstamo). */
export const archiveUrl = (ia: string) => `https://archive.org/details/${encodeURIComponent(ia)}`

// Las etiquetas de Open Library tienen ruido, así que cada tema cruza dos materias y todas excluyen ficción.
export const BOOK_TOPICS = [
  { id: 'personales', label: '💰 Finanzas personales', query: 'subject:"personal finance"' },
  { id: 'inversion', label: '📈 Inversión', query: '(subject:investments OR subject:"stock exchange")' },
  { id: 'ahorro', label: '🐷 Ahorro y deudas', query: 'subject:"personal finance" (subject:saving OR subject:debt OR subject:budgets OR subject:"financial security")' },
  { id: 'emprender', label: '🚀 Emprender', query: 'subject:entrepreneurship (subject:business OR subject:success OR subject:management)' },
  { id: 'mentalidad', label: '🧠 Mentalidad y riqueza', query: '(subject:wealth OR subject:money) (subject:success OR subject:"self-help" OR subject:"personal finance")' },
  { id: 'economia', label: '🌍 Economía', query: 'subject:economics (subject:finance OR subject:money OR subject:"economic history")' },
] as const

export type BookTopicId = (typeof BOOK_TOPICS)[number]['id']

// La búsqueda libre se restringe a temas financieros para no traer novelas.
const FINANCE_FILTER =
  '(subject:finance OR subject:"personal finance" OR subject:investments OR subject:money OR subject:saving OR subject:wealth OR subject:economics OR subject:entrepreneurship)'

const NO_FICTION = '-subject:fiction -subject:"fiction, general" -subject:novela'

const OL_FIELDS = 'key,title,author_name,cover_i,number_of_pages_median,first_publish_year,ratings_average,editions,editions.title,editions.cover_i,editions.language,editions.ia,editions.ebook_access'

const cache = new Map<string, BookResult[]>()

function toAccess(v: unknown): BookAccess {
  return v === 'public' || v === 'borrowable' ? v : null
}

async function searchOpenLibrary(q: string, limit = 24): Promise<BookResult[]> {
  const params = new URLSearchParams({ q, fields: OL_FIELDS, sort: 'rating', limit: String(limit), lang: 'es' })
  const res = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!res.ok) throw new Error(`Open Library ${res.status}`)
  const data = await res.json()
  return (data.docs ?? []).map((d: any): BookResult => {
    // Si hay edición en español, se muestra su título y portada.
    const ed = d.editions?.docs?.[0]
    const spanish = ed && Array.isArray(ed.language) && ed.language.includes('spa')
    const coverId = (spanish && ed.cover_i) || d.cover_i
    return {
      id: `ol:${d.key}`,
      title: (spanish && ed.title) || d.title,
      author: d.author_name?.[0] ?? 'Autor desconocido',
      pages: typeof d.number_of_pages_median === 'number' ? d.number_of_pages_median : 0,
      cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      year: d.first_publish_year ?? null,
      rating: typeof d.ratings_average === 'number' ? d.ratings_average : null,
      link: `https://openlibrary.org${d.key}`,
      // El acceso es por edición: cuando la consulta filtra por ebook_access, Open Library devuelve la edición que cumple.
      access: ed?.ia?.[0] ? toAccess(ed.ebook_access) : null,
      ia: ed?.ia?.[0] && toAccess(ed.ebook_access) ? ed.ia[0] : null,
    }
  })
}

// Consultas equivalentes a cada tema para el buscador de Internet Archive (respaldo de Open Library).
const IA_TOPICS: Record<BookTopicId, string> = {
  personales: 'subject:("personal finance" OR "finanzas personales")',
  inversion: 'subject:(investments OR inversiones OR "stock exchange" OR bolsa)',
  ahorro: 'subject:(saving OR ahorro OR debt OR deudas OR budgets OR presupuesto)',
  emprender: 'subject:(entrepreneurship OR emprendimiento OR "small business")',
  mentalidad: 'subject:(wealth OR riqueza OR money OR dinero) AND subject:(success OR éxito OR "self-help")',
  economia: 'subject:(economics OR economía)',
}

const IA_FIELDS = ['identifier', 'title', 'creator', 'year', 'imagecount', 'collection']

// Colecciones escaneadas por bibliotecas (dominio público). Las subidas de usuarios pueden ser copias ilegales.
const IA_LIBRARY_COLLECTIONS = ['americana', 'toronto', 'gutenberg', 'europeanlibraries', 'cdl', 'library_of_congress', 'biodiversity', 'brittlebooks', 'bostonpubliclibrary']

/**
 * Internet Archive: gratis, sin clave y con lectura directa.
 * Préstamo si está en la biblioteca de préstamo; libre solo si lo escaneó una biblioteca o es de dominio público
 * (la licencia la declara quien sube el archivo, así que no sirve como garantía).
 */
function iaAccess(collections: string[], year: number | null): BookAccess {
  if (collections.includes('inlibrary')) return 'borrowable'
  // printdisabled sin inlibrary solo es accesible para personas con discapacidad visual certificada.
  if (collections.includes('printdisabled')) return null
  const open = (year !== null && year < 1930) || collections.some((c) => IA_LIBRARY_COLLECTIONS.includes(c))
  return open ? 'public' : null
}

async function searchInternetArchive(opts: { topic: BookTopicId; text: string; access: AccessFilter }): Promise<BookResult[]> {
  const base = opts.text ? `(${opts.text}) AND subject:(finance OR finanzas OR money OR dinero OR investments OR economics)` : IA_TOPICS[opts.topic]
  const language = opts.access === 'publico' || opts.text ? '' : ' AND language:(spa OR Spanish OR español)'
  const params = new URLSearchParams({ q: `${base} AND mediatype:texts${language}`, rows: '60', output: 'json' })
  for (const f of IA_FIELDS) params.append('fl[]', f)
  params.append('sort[]', 'downloads desc')
  const res = await fetch(`https://archive.org/advancedsearch.php?${params}`)
  if (!res.ok) throw new Error(`Internet Archive ${res.status}`)
  const data = await res.json()
  return (data.response?.docs ?? [])
    .map((d: any): BookResult => {
      const collections: string[] = Array.isArray(d.collection) ? d.collection : [d.collection].filter(Boolean)
      const parsedYear = Number.parseInt(String(d.year ?? ''), 10)
      const year = Number.isFinite(parsedYear) ? parsedYear : null
      const access = iaAccess(collections, year)
      return {
        id: `ia:${d.identifier}`,
        title: Array.isArray(d.title) ? d.title[0] : (d.title ?? 'Sin título'),
        author: (Array.isArray(d.creator) ? d.creator[0] : d.creator) ?? 'Autor desconocido',
        pages: typeof d.imagecount === 'number' ? d.imagecount : 0,
        cover: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
        year,
        rating: null,
        link: archiveUrl(d.identifier),
        access,
        ia: access ? d.identifier : null,
      }
    })
    .filter((r: BookResult) => (opts.access === 'publico' ? r.access === 'public' : opts.access === 'leer' ? r.access !== null : true))
    .slice(0, 24)
}

/** Busca libros de finanzas por tema o por texto libre. */
export async function searchFinanceBooks(opts: { topic?: BookTopicId; text?: string; access?: AccessFilter }): Promise<BookResult[]> {
  const text = opts.text?.trim() ?? ''
  const topic = BOOK_TOPICS.find((t) => t.id === opts.topic) ?? BOOK_TOPICS[0]
  const access = opts.access ?? 'todos'
  const accessQuery = access === 'publico' ? 'ebook_access:public' : access === 'leer' ? 'ebook_access:[borrowable TO *]' : ''
  // Los libros libres sin cuenta en español son pocos, así que en ese filtro no se exige idioma.
  const language = access === 'publico' || text ? '' : 'language:spa'
  const q = [text || topic.query, text ? FINANCE_FILTER : '', NO_FICTION, accessQuery, language].filter(Boolean).join(' ')
  const cached = cache.get(q)
  if (cached) return cached

  let results: BookResult[]
  try {
    results = await searchOpenLibrary(q)
  } catch {
    // Respaldo también gratuito y sin clave, que respeta el filtro de acceso.
    results = await searchInternetArchive({ topic: topic.id, text, access })
  }
  // Quita duplicados por título (distintas obras con la misma edición en español).
  const seen = new Set<string>()
  results = results.filter((r) => {
    const key = r.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  cache.set(q, results)
  return results
}

/** Busca la mejor edición legible (pública o en préstamo, preferiblemente en español) de una obra de Open Library. */
export async function findReadableEdition(bookId: string): Promise<{ ia: string; access: Exclude<BookAccess, null> } | null> {
  if (!bookId.startsWith('ol:')) return null
  const key = bookId.slice(3)
  for (const q of [`key:"${key}" ebook_access:public`, `key:"${key}" ebook_access:[borrowable TO *]`]) {
    const [r] = await searchOpenLibrary(q, 1)
    if (r?.ia && r.access) return { ia: r.ia, access: r.access }
  }
  return null
}
