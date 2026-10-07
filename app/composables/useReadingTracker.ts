import type { BookAccess, BookResult } from '~/utils/financeBooksApi'
import { toDateKey } from '~/utils/calendarDate'

export type ReadingStatus = 'quiero' | 'leyendo' | 'leido'

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  quiero: 'Quiero leer',
  leyendo: 'Leyendo',
  leido: 'Leído',
}

export type ReadingBook = {
  id: string
  title: string
  author: string
  cover: string | null
  link: string
  /** Edición legible en Internet Archive (null si no hay o aún no se buscó). */
  ia: string | null
  access: BookAccess
  pages: number
  currentPage: number
  status: ReadingStatus
  /** Ideas clave que te deja el libro. */
  takeaways: string[]
  /** Acción concreta para aplicar el libro a tus finanzas. */
  action: string
  actionDone: boolean
  rating: number
  addedAt: number
  startedAt: number | null
  finishedAt: number | null
}

export type ReadingSession = { bookId: string; date: string; pages: number; at: number }

type ReadingState = {
  books: ReadingBook[]
  sessions: ReadingSession[]
  dailyGoal: number
  /** Insignias ya celebradas (para no repetir el festejo). */
  celebrated: string[]
}

// --- Puntos de experiencia ---
export const XP = { page: 1, finished: 100, takeaway: 15, action: 40 }

const LEVELS = ['Curioso del dinero', 'Ahorrador novato', 'Presupuestador', 'Inversor curioso', 'Estratega', 'Mente millonaria', 'Leyenda financiera']

/** XP total necesario para alcanzar el nivel n (nivel 1 = 0). Cada nivel cuesta 150 XP más que el anterior. */
const xpForLevel = (n: number) => 75 * (n - 1) * n

export type Badge = { id: string; emoji: string; label: string; hint: string }

type Stats = { totalPages: number; finished: number; streak: number; bestStreak: number; takeaways: number; actions: number; sessions: number }

const BADGES: (Badge & { test: (s: Stats) => boolean })[] = [
  { id: 'primera', emoji: '📖', label: 'Primera página', hint: 'Registra tu primera lectura', test: (s) => s.sessions > 0 },
  { id: 'racha3', emoji: '🔥', label: 'En llamas', hint: 'Racha de 3 días', test: (s) => s.bestStreak >= 3 },
  { id: 'racha7', emoji: '⚡', label: 'Semana perfecta', hint: 'Racha de 7 días', test: (s) => s.bestStreak >= 7 },
  { id: 'racha30', emoji: '🏆', label: 'Hábito de hierro', hint: 'Racha de 30 días', test: (s) => s.bestStreak >= 30 },
  { id: 'pag100', emoji: '💯', label: '100 páginas', hint: 'Lee 100 páginas', test: (s) => s.totalPages >= 100 },
  { id: 'pag1000', emoji: '📚', label: 'Mil páginas', hint: 'Lee 1.000 páginas', test: (s) => s.totalPages >= 1000 },
  { id: 'libro1', emoji: '🎓', label: 'Primer libro', hint: 'Termina un libro', test: (s) => s.finished >= 1 },
  { id: 'libro5', emoji: '🧠', label: 'Biblioteca financiera', hint: 'Termina 5 libros', test: (s) => s.finished >= 5 },
  { id: 'idea3', emoji: '💡', label: 'Pensador', hint: 'Anota 3 ideas clave', test: (s) => s.takeaways >= 3 },
  { id: 'accion1', emoji: '✅', label: 'De la teoría a la acción', hint: 'Aplica una lección a tus finanzas', test: (s) => s.actions >= 1 },
]

const STORAGE_KEY = 'todo-finance-reading-v1'

const state = ref<ReadingState>({ books: [], sessions: [], dailyGoal: 10, celebrated: [] })
/** Insignias recién desbloqueadas, para mostrar un aviso. */
const freshBadges = ref<Badge[]>([])
let loaded = false

const num = (v: unknown, min = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : min)
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object'

function sanitize(raw: unknown): ReadingState {
  const r = isObj(raw) ? raw : {}
  const books: ReadingBook[] = (Array.isArray(r.books) ? r.books.filter(isObj) : [])
    .filter((b) => typeof b.id === 'string')
    .map((b) => {
      const pages = Math.round(num(b.pages))
      return {
        id: b.id,
        title: typeof b.title === 'string' ? b.title : 'Sin título',
        author: typeof b.author === 'string' ? b.author : '',
        cover: typeof b.cover === 'string' ? b.cover : null,
        link: typeof b.link === 'string' ? b.link : '',
        ia: typeof b.ia === 'string' && b.ia ? b.ia : null,
        access: b.access === 'public' || b.access === 'borrowable' ? b.access : null,
        pages,
        currentPage: Math.round(pages ? Math.min(pages, num(b.currentPage)) : num(b.currentPage)),
        status: (['quiero', 'leyendo', 'leido'] as const).includes(b.status) ? b.status : 'quiero',
        takeaways: Array.isArray(b.takeaways) ? b.takeaways.filter((t: unknown) => typeof t === 'string') : [],
        action: typeof b.action === 'string' ? b.action : '',
        actionDone: !!b.actionDone,
        rating: Math.min(5, Math.round(num(b.rating))),
        addedAt: num(b.addedAt) || Date.now(),
        startedAt: typeof b.startedAt === 'number' ? b.startedAt : null,
        finishedAt: typeof b.finishedAt === 'number' ? b.finishedAt : null,
      }
    })
  const ids = new Set(books.map((b) => b.id))
  return {
    books,
    sessions: (Array.isArray(r.sessions) ? r.sessions.filter(isObj) : [])
      .filter((s) => ids.has(s.bookId) && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && num(s.pages) > 0)
      .map((s) => ({ bookId: s.bookId, date: s.date, pages: Math.round(s.pages), at: num(s.at) })),
    dailyGoal: Math.round(num(r.dailyGoal, 1)) || 10,
    celebrated: Array.isArray(r.celebrated) ? r.celebrated.filter((c: unknown) => typeof c === 'string') : [],
  }
}

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    state.value = sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    state.value = sanitize(null)
  }
}

function persist() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDateKey(d)
}

function addDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

export function useReadingTracker() {
  load()

  const books = computed(() => state.value.books)
  const dailyGoal = computed(() => state.value.dailyGoal)

  const pagesByDay = computed(() => {
    const map = new Map<string, number>()
    for (const s of state.value.sessions) map.set(s.date, (map.get(s.date) ?? 0) + s.pages)
    return map
  })

  const pagesToday = computed(() => pagesByDay.value.get(daysAgo(0)) ?? 0)

  /** Días seguidos leyendo. Si hoy aún no lees, la racha de ayer sigue viva (pero en riesgo). */
  const streak = computed(() => {
    const days = pagesByDay.value
    const start = days.has(daysAgo(0)) ? 0 : days.has(daysAgo(1)) ? 1 : -1
    if (start < 0) return 0
    let count = 0
    while (days.has(daysAgo(start + count))) count++
    return count
  })
  const streakAtRisk = computed(() => streak.value > 0 && pagesToday.value === 0)

  const bestStreak = computed(() => {
    const keys = Array.from(pagesByDay.value.keys()).sort()
    let best = 0
    let run = 0
    let prev: number | null = null
    for (const key of keys) {
      const t = new Date(`${key}T00:00:00`).getTime()
      run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1
      best = Math.max(best, run)
      prev = t
    }
    return best
  })

  const stats = computed<Stats>(() => ({
    totalPages: state.value.sessions.reduce((s, x) => s + x.pages, 0),
    finished: state.value.books.filter((b) => b.status === 'leido').length,
    streak: streak.value,
    bestStreak: bestStreak.value,
    takeaways: state.value.books.reduce((s, b) => s + b.takeaways.length, 0),
    actions: state.value.books.filter((b) => b.actionDone).length,
    sessions: state.value.sessions.length,
  }))

  const xp = computed(() => {
    const s = stats.value
    return s.totalPages * XP.page + s.finished * XP.finished + s.takeaways * XP.takeaway + s.actions * XP.action
  })

  const level = computed(() => {
    let n = 1
    while (xp.value >= xpForLevel(n + 1)) n++
    const from = xpForLevel(n)
    const to = xpForLevel(n + 1)
    return { n, name: LEVELS[Math.min(n, LEVELS.length) - 1]!, progress: (xp.value - from) / (to - from), toNext: to - xp.value }
  })

  const badges = computed(() => BADGES.map(({ test, ...b }) => ({ ...b, unlocked: test(stats.value) })))

  /** Páginas por día de los últimos 7 días (el último es hoy). */
  const lastWeek = computed(() => {
    const labels = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    return Array.from({ length: 7 }, (_, i) => {
      const key = daysAgo(6 - i)
      return { key, label: labels[new Date(`${key}T00:00:00`).getDay()]!, pages: pagesByDay.value.get(key) ?? 0 }
    })
  })

  /** Ritmo real: promedio de páginas por día en los últimos 14 días (o la meta diaria si aún no hay datos). */
  const pace = computed(() => {
    let total = 0
    for (let i = 0; i < 14; i++) total += pagesByDay.value.get(daysAgo(i)) ?? 0
    return total > 0 ? total / 14 : state.value.dailyGoal
  })

  /** Fecha estimada para terminar un libro con el ritmo actual. */
  function finishEstimate(book: ReadingBook) {
    if (!book.pages || book.status === 'leido') return null
    const left = book.pages - book.currentPage
    const days = Math.ceil(left / Math.max(1, pace.value))
    return { days, date: addDays(days) }
  }

  /** Revisa insignias nuevas y las celebra una sola vez. */
  function checkBadges() {
    const fresh = badges.value.filter((b) => b.unlocked && !state.value.celebrated.includes(b.id))
    if (!fresh.length) return
    state.value.celebrated.push(...fresh.map((b) => b.id))
    freshBadges.value.push(...fresh.map(({ unlocked: _u, ...b }) => b))
    useConfetti().celebrate('estrellas')
  }

  function commit() {
    persist()
    checkBadges()
  }

  function find(id: string) {
    return state.value.books.find((b) => b.id === id)
  }

  function hasBook(id: string) {
    return state.value.books.some((b) => b.id === id)
  }

  function addBook(result: BookResult, status: ReadingStatus = 'quiero') {
    if (hasBook(result.id)) return
    state.value.books.unshift({
      id: result.id,
      title: result.title,
      author: result.author,
      cover: result.cover,
      link: result.link,
      ia: result.ia,
      access: result.access,
      pages: result.pages,
      currentPage: 0,
      status,
      takeaways: [],
      action: '',
      actionDone: false,
      rating: 0,
      addedAt: Date.now(),
      startedAt: status === 'leyendo' ? Date.now() : null,
      finishedAt: null,
    })
    commit()
  }

  function removeBook(id: string) {
    state.value.books = state.value.books.filter((b) => b.id !== id)
    state.value.sessions = state.value.sessions.filter((s) => s.bookId !== id)
    commit()
  }

  function setStatus(id: string, status: ReadingStatus) {
    const book = find(id)
    if (!book) return
    book.status = status
    if (status === 'leyendo' && !book.startedAt) book.startedAt = Date.now()
    if (status === 'leido') {
      book.finishedAt = Date.now()
      // Marcarlo a mano no suma páginas a la racha: solo cierra el progreso.
      if (book.pages) book.currentPage = book.pages
      useConfetti().celebrate()
    } else {
      book.finishedAt = null
    }
    commit()
  }

  function setReadable(id: string, ia: string, access: Exclude<BookAccess, null>) {
    const book = find(id)
    if (!book) return
    book.ia = ia
    book.access = access
    persist()
  }

  function setPages(id: string, pages: number) {
    const book = find(id)
    if (!book || !(pages > 0)) return
    book.pages = Math.round(pages)
    book.currentPage = Math.min(book.currentPage, book.pages)
    commit()
  }

  function logPagesInternal(book: ReadingBook, pages: number) {
    state.value.sessions.push({ bookId: book.id, date: daysAgo(0), pages, at: Date.now() })
    book.currentPage += pages
  }

  /** Registra que leíste hasta la página `page` (o `pages` páginas más con `addPages`). */
  function logReading(id: string, opts: { page?: number; addPages?: number }) {
    const book = find(id)
    if (!book) return
    const target = opts.page ?? book.currentPage + (opts.addPages ?? 0)
    const capped = book.pages ? Math.min(book.pages, Math.round(target)) : Math.round(target)
    const delta = capped - book.currentPage
    if (delta <= 0) return
    const goalBefore = pagesToday.value >= state.value.dailyGoal
    logPagesInternal(book, delta)
    if (book.status !== 'leyendo') {
      book.status = 'leyendo'
      book.startedAt ??= Date.now()
    }
    if (!goalBefore && pagesToday.value >= state.value.dailyGoal) useConfetti().celebrate('estrellas')
    if (book.pages && book.currentPage >= book.pages) {
      book.status = 'leido'
      book.finishedAt = Date.now()
      useConfetti().celebrate()
    }
    commit()
  }

  function addTakeaway(id: string, text: string) {
    const book = find(id)
    const t = text.trim()
    if (!book || !t) return
    book.takeaways.push(t)
    commit()
  }

  function removeTakeaway(id: string, index: number) {
    const book = find(id)
    if (!book) return
    book.takeaways.splice(index, 1)
    commit()
  }

  function setAction(id: string, action: string) {
    const book = find(id)
    if (!book) return
    book.action = action.trim()
    if (!book.action) book.actionDone = false
    commit()
  }

  function toggleActionDone(id: string) {
    const book = find(id)
    if (!book || !book.action) return
    book.actionDone = !book.actionDone
    commit()
  }

  function setRating(id: string, rating: number) {
    const book = find(id)
    if (!book) return
    book.rating = book.rating === rating ? 0 : rating
    commit()
  }

  function setDailyGoal(pages: number) {
    if (!(pages > 0)) return
    state.value.dailyGoal = Math.round(pages)
    persist()
  }

  function dismissBadge() {
    freshBadges.value.shift()
  }

  return {
    books,
    dailyGoal,
    pagesToday,
    streak,
    streakAtRisk,
    bestStreak,
    stats,
    xp,
    level,
    badges,
    lastWeek,
    pace,
    freshBadges,
    finishEstimate,
    hasBook,
    addBook,
    removeBook,
    setStatus,
    setPages,
    setReadable,
    logReading,
    addTakeaway,
    removeTakeaway,
    setAction,
    toggleActionDone,
    setRating,
    setDailyGoal,
    dismissBadge,
  }
}
