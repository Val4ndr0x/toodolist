import { deleteBoard } from '~/composables/useBoard'

/** Ámbito del tablero propio de un elemento de colección (ver useBoard). */
export const itemBoardScope = (itemId: string) => `coleccion-${itemId}`

export type CollectionKind = 'libros' | 'peliculas' | 'series' | 'musica' | 'museo' | 'otro'

export const COLLECTION_KINDS: Record<CollectionKind, { label: string; emoji: string; creatorLabel: string; itemLabel: string }> = {
  libros: { label: 'Libros', emoji: '📚', creatorLabel: 'Autor', itemLabel: 'libro' },
  peliculas: { label: 'Películas', emoji: '🎬', creatorLabel: 'Director', itemLabel: 'película' },
  series: { label: 'Series', emoji: '📺', creatorLabel: 'Plataforma o creador', itemLabel: 'serie' },
  musica: { label: 'Música', emoji: '🎵', creatorLabel: 'Artista', itemLabel: 'canción o álbum' },
  museo: { label: 'Museo de la fama', emoji: '🏛️', creatorLabel: 'Marca o equipo', itemLabel: 'pieza' },
  otro: { label: 'Otro', emoji: '✨', creatorLabel: 'Detalle', itemLabel: 'elemento' },
}

// --- Museo de la fama ---

/** Una sala del museo: las piezas se exhiben agrupadas por sala. */
export type MuseumCategory = { id: string; name: string; emoji: string }

/** Lo que el usuario contestó al armar su museo. */
export type MuseumConfig = {
  /** Qué se exhibe (id de MUSEUM_EXHIBITS). */
  exhibit: string
  /** Nombre en singular de cada pieza, p. ej. «gorra». */
  pieceLabel: string
  pieceEmoji: string
  /** Frase que aparece en la entrada del museo. */
  motto: string
  /** Estilo de las salas (id de MUSEUM_STYLES). */
  style: string
  categories: MuseumCategory[]
  /** Datos que se registran de cada pieza (ids de MUSEUM_FIELDS). */
  fields: string[]
}

export const MUSEUM_EXHIBITS: { id: string; label: string; piece: string; emoji: string; categories: [string, string][] }[] = [
  {
    id: 'gorras', label: 'Gorras', piece: 'gorra', emoji: '🧢',
    categories: [['Béisbol', '⚾'], ['Básquetbol', '🏀'], ['Fútbol americano', '🏈'], ['Fútbol', '⚽'], ['Snapback', '🧢'], ['Fitted 59FIFTY', '🎯'], ['Trucker', '🚚'], ['Vintage', '📼'], ['Edición limitada', '💎'], ['Firmadas', '✍️'], ['Streetwear', '🛹'], ['Regalos', '🎁']],
  },
  {
    id: 'tenis', label: 'Tenis', piece: 'par', emoji: '👟',
    categories: [['Jordan', '🏀'], ['Running', '🏃'], ['Skate', '🛹'], ['Clásicos', '📼'], ['Colaboraciones', '🤝'], ['Edición limitada', '💎']],
  },
  {
    id: 'camisetas', label: 'Camisetas', piece: 'camiseta', emoji: '👕',
    categories: [['Selecciones', '🌎'], ['Clubes', '⚽'], ['NBA', '🏀'], ['Retro', '📼'], ['Firmadas', '✍️'], ['Conciertos', '🎸']],
  },
  {
    id: 'figuras', label: 'Figuras', piece: 'figura', emoji: '🗿',
    categories: [['Anime', '🍥'], ['Marvel y DC', '🦸'], ['Videojuegos', '🎮'], ['Funko', '📦'], ['Edición limitada', '💎']],
  },
  {
    id: 'otro', label: 'Otra cosa', piece: 'pieza', emoji: '🏆',
    categories: [['Favoritos', '⭐'], ['Raros', '💎'], ['Regalos', '🎁'], ['Viajes', '✈️']],
  },
]

/** Estilos de sala: colores de pared, piso, placas y luces. */
export const MUSEUM_STYLES: {
  id: string
  label: string
  emoji: string
  blurb: string
  wall: string
  floor: string
  text: string
  muted: string
  accent: string
  plaque: string
  plaqueText: string
  light: string
}[] = [
  {
    id: 'salon', label: 'Salón de la fama', emoji: '🏆', blurb: 'Terciopelo, oro y reflectores',
    wall: 'radial-gradient(ellipse at 50% -10%, rgba(255,215,130,0.18), transparent 60%), repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 60px), #3a0f1c',
    floor: 'linear-gradient(#2a1a10, #1a0f08)', text: '#fbeccb', muted: 'rgba(251,236,203,0.62)', accent: '#e3b04b',
    plaque: 'linear-gradient(135deg, #f6d27a, #b8862b 55%, #f2cf74)', plaqueText: '#3a2508', light: 'rgba(255,224,150,0.38)',
  },
  {
    id: 'marmol', label: 'Museo clásico', emoji: '🏛️', blurb: 'Mármol blanco y columnas',
    wall: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.9), transparent 55%), linear-gradient(115deg, transparent 40%, rgba(160,160,170,0.12) 42%, transparent 46%), linear-gradient(60deg, transparent 62%, rgba(150,150,160,0.1) 63%, transparent 66%), #ecebe7',
    floor: 'repeating-linear-gradient(90deg, #d8d5cf 0 60px, #c9c5bd 60px 120px)', text: '#2b2a28', muted: 'rgba(43,42,40,0.58)', accent: '#a07b2c',
    plaque: 'linear-gradient(135deg, #3b3a37, #1f1e1c)', plaqueText: '#e9d7a6', light: 'rgba(255,255,255,0.7)',
  },
  {
    id: 'urbano', label: 'Streetwear', emoji: '🛹', blurb: 'Concreto, grafiti y neón',
    wall: 'radial-gradient(circle at 15% 30%, rgba(255,64,129,0.22), transparent 30%), radial-gradient(circle at 85% 20%, rgba(0,229,255,0.2), transparent 30%), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 40px), #2b2b2e',
    floor: 'linear-gradient(#1c1c1e, #111113)', text: '#f5f5f5', muted: 'rgba(245,245,245,0.6)', accent: '#ff4081',
    plaque: 'linear-gradient(135deg, #ffe600, #ffb800)', plaqueText: '#111111', light: 'rgba(0,229,255,0.28)',
  },
  {
    id: 'estadio', label: 'Estadio', emoji: '🏟️', blurb: 'Césped, luces y marcador',
    wall: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.25), transparent 50%), linear-gradient(#0d2a4a, #123a63)',
    floor: 'repeating-linear-gradient(90deg, #2f8a3a 0 40px, #2a7c34 40px 80px)', text: '#ffffff', muted: 'rgba(255,255,255,0.65)', accent: '#ffd23f',
    plaque: 'linear-gradient(135deg, #1b1b1b, #000000)', plaqueText: '#ffd23f', light: 'rgba(255,255,255,0.35)',
  },
  {
    id: 'galeria', label: 'Galería moderna', emoji: '🖼️', blurb: 'Paredes blancas y minimalismo',
    wall: 'linear-gradient(#fafafa, #f0f0f0)', floor: 'linear-gradient(#d9c3a5, #c7ad8b)', text: '#1a1a1a', muted: 'rgba(26,26,26,0.55)', accent: '#1a1a1a',
    plaque: 'linear-gradient(135deg, #ffffff, #f2f2f2)', plaqueText: '#1a1a1a', light: 'rgba(255,250,235,0.85)',
  },
]

/** Datos opcionales que se pueden registrar de cada pieza. */
export const MUSEUM_FIELDS: { id: string; label: string; emoji: string; placeholder: string }[] = [
  { id: 'equipo', label: 'Equipo', emoji: '🏟️', placeholder: 'p. ej. Yankees' },
  { id: 'anio', label: 'Año', emoji: '📆', placeholder: 'p. ej. 2019' },
  { id: 'modelo', label: 'Modelo', emoji: '🧩', placeholder: 'p. ej. 59FIFTY' },
  { id: 'talla', label: 'Talla', emoji: '📏', placeholder: 'p. ej. 7 3/8' },
  { id: 'color', label: 'Color', emoji: '🎨', placeholder: 'p. ej. Azul marino' },
  { id: 'origen', label: 'Dónde la conseguí', emoji: '📍', placeholder: 'p. ej. Estadio, viaje a NY' },
  { id: 'precio', label: 'Precio', emoji: '💰', placeholder: 'p. ej. $45' },
  { id: 'estado', label: 'Estado', emoji: '✨', placeholder: 'p. ej. Nueva con etiqueta' },
  { id: 'edicion', label: 'Edición especial', emoji: '💎', placeholder: 'p. ej. Serie Mundial 2024' },
]

export function museumStyle(id: string | undefined) {
  return MUSEUM_STYLES.find((s) => s.id === id) ?? MUSEUM_STYLES[0]!
}

export function defaultMuseumConfig(exhibitId = 'gorras'): MuseumConfig {
  const exhibit = MUSEUM_EXHIBITS.find((e) => e.id === exhibitId) ?? MUSEUM_EXHIBITS[0]!
  return {
    exhibit: exhibit.id,
    pieceLabel: exhibit.piece,
    pieceEmoji: exhibit.emoji,
    motto: '',
    style: MUSEUM_STYLES[0]!.id,
    categories: exhibit.categories.slice(0, 4).map(([name, emoji]) => ({ id: uuid(), name, emoji })),
    fields: ['equipo', 'anio', 'origen'],
  }
}

function sanitizeMuseum(m: unknown): MuseumConfig | null {
  if (!m || typeof m !== 'object') return null
  const r = m as Record<string, any>
  const fallback = defaultMuseumConfig(str(r.exhibit) || undefined)
  return {
    exhibit: str(r.exhibit) || fallback.exhibit,
    pieceLabel: str(r.pieceLabel) || fallback.pieceLabel,
    pieceEmoji: str(r.pieceEmoji) || fallback.pieceEmoji,
    motto: str(r.motto),
    style: museumStyle(str(r.style)).id,
    categories: Array.isArray(r.categories)
      ? r.categories
          .filter((c: any) => c && typeof c.id === 'string' && str(c.name).trim())
          .map((c: any) => ({ id: c.id, name: str(c.name).trim(), emoji: str(c.emoji) || '🏷️' }))
      : [],
    fields: Array.isArray(r.fields) ? r.fields.filter((f: unknown) => MUSEUM_FIELDS.some((x) => x.id === f)) : [],
  }
}

/** Reacción de cada calificación (índice = estrellas - 1). */
export const RATING_REACTIONS = [
  { emoji: '😴', label: 'Me aburrió' },
  { emoji: '😐', label: 'Regular' },
  { emoji: '🙂', label: 'Estuvo bien' },
  { emoji: '😍', label: 'Me encantó' },
  { emoji: '🤯', label: '¡Obra maestra!' },
] as const

/** Logros al llegar a cierta cantidad de elementos en una colección. */
export const COLLECTION_MILESTONES: Record<number, { emoji: string; title: string }> = {
  1: { emoji: '🌱', title: '¡Tu colección nació!' },
  5: { emoji: '🥉', title: 'Coleccionista en camino' },
  10: { emoji: '🥈', title: '¡Ya son 10!' },
  25: { emoji: '🥇', title: 'Coleccionista de oro' },
  50: { emoji: '🏆', title: '¡Medio centenar!' },
  100: { emoji: '👑', title: 'Leyenda de la colección' },
}

export function isCollectionKind(v: unknown): v is CollectionKind {
  return typeof v === 'string' && v in COLLECTION_KINDS
}

export type CollectionItem = {
  id: string
  title: string
  /** Autor, director, artista… según el tipo de colección. */
  creator: string
  /** Imagen de referencia: data URL subida por el usuario o un enlace a una imagen; null si no tiene. */
  image: string | null
  /** Enlace externo; si es de YouTube se puede reproducir dentro de la app. */
  link: string
  /** Calificación de 0 (sin calificar) a 5. */
  rating: number
  notes: string
  /** Fecha en que se terminó de leer/ver (YYYY-MM-DD); vacío si no se indicó. */
  finishedAt: string
  /** Estilo propio de la ficha (ver utils/cardThemes); null usa el de la colección. */
  theme: string | null
  /** Sala del museo (id de MuseumCategory); vacío si no tiene. */
  category: string
  /** Ficha técnica de la pieza del museo (id de MUSEUM_FIELDS → valor). */
  details: Record<string, string>
  createdAt: number
}

export type CollectionItemInput = Pick<CollectionItem, 'title' | 'creator' | 'image' | 'link' | 'rating' | 'notes' | 'finishedAt'> &
  Partial<Pick<CollectionItem, 'category' | 'details'>>

export type Collection = {
  id: string
  name: string
  kind: CollectionKind
  color: string
  /** Estilo de ficha por defecto para todos sus elementos; null usa el del tipo de colección. */
  cardTheme: string | null
  /** Configuración del museo (solo para el tipo «museo»). */
  museum: MuseumConfig | null
  items: CollectionItem[]
  createdAt: number
}

export type CollectionInput = Pick<Collection, 'name' | 'kind' | 'color'> & { museum?: MuseumConfig | null }

export const COLLECTION_COLORS = ['#fbe4ec', '#fff3d6', '#e0f5e9', '#e2ecfb', '#f2e6fb', '#fde8e2']

const STORAGE_KEY = 'todo-collections-v1'

const collections = ref<Collection[]>([])
let loaded = false

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const clampRating = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(5, Math.round(v))) : 0)

function cleanDetails(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const text = str(val).trim()
    if (text) out[k] = text
  }
  return out
}

function sanitizeItem(i: Record<string, any>): CollectionItem {
  return {
    id: i.id,
    title: str(i.title) || 'Sin título',
    creator: str(i.creator),
    image: typeof i.image === 'string' && i.image ? i.image : null,
    link: str(i.link),
    rating: clampRating(i.rating),
    notes: str(i.notes),
    finishedAt: str(i.finishedAt),
    theme: str(i.theme) || null,
    category: str(i.category),
    details: cleanDetails(i.details),
    createdAt: typeof i.createdAt === 'number' ? i.createdAt : Date.now(),
  }
}

function sanitize(raw: unknown): Collection[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c): c is Record<string, any> => !!c && typeof c === 'object' && typeof c.id === 'string')
    .map((c) => ({
      id: c.id,
      name: str(c.name) || 'Sin nombre',
      kind: isCollectionKind(c.kind) ? c.kind : 'otro',
      color: str(c.color) || COLLECTION_COLORS[0]!,
      cardTheme: str(c.cardTheme) || null,
      museum: c.kind === 'museo' ? (sanitizeMuseum(c.museum) ?? defaultMuseumConfig()) : null,
      items: Array.isArray(c.items)
        ? c.items.filter((i: any): i is Record<string, any> => !!i && typeof i === 'object' && typeof i.id === 'string').map(sanitizeItem)
        : [],
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
    }))
}

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    collections.value = raw ? sanitize(JSON.parse(raw)) : []
  } catch {
    collections.value = []
  }
}

/** Devuelve false si no se pudo guardar (lo normal: se llenó el espacio por las imágenes). */
function persist(): boolean {
  if (!import.meta.client) return true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections.value))
    return true
  } catch {
    return false
  }
}

function normalizeItem(input: CollectionItemInput): CollectionItemInput {
  return {
    title: input.title.trim(),
    creator: input.creator.trim(),
    image: input.image || null,
    link: input.link.trim(),
    rating: clampRating(input.rating),
    notes: input.notes.trim(),
    finishedAt: input.finishedAt,
    ...(input.category !== undefined && { category: input.category }),
    ...(input.details !== undefined && { details: cleanDetails(input.details) }),
  }
}

export function useCollections() {
  load()

  function getCollection(id: string) {
    return computed(() => collections.value.find((c) => c.id === id) ?? null)
  }

  function addCollection(input: CollectionInput) {
    const name = input.name.trim()
    if (!name) return
    const kind = isCollectionKind(input.kind) ? input.kind : 'otro'
    const collection: Collection = {
      id: uuid(),
      name,
      kind,
      color: input.color || COLLECTION_COLORS[collections.value.length % COLLECTION_COLORS.length]!,
      cardTheme: null,
      museum: kind === 'museo' ? (sanitizeMuseum(input.museum) ?? defaultMuseumConfig()) : null,
      items: [],
      createdAt: Date.now(),
    }
    collections.value.unshift(collection)
    persist()
    return collection.id
  }

  function updateCollection(id: string, input: CollectionInput) {
    const collection = collections.value.find((c) => c.id === id)
    const name = input.name.trim()
    if (!collection || !name) return
    collection.name = name
    if (isCollectionKind(input.kind)) collection.kind = input.kind
    if (input.color) collection.color = input.color
    if (collection.kind === 'museo') {
      if (input.museum) collection.museum = sanitizeMuseum(input.museum)
      collection.museum ??= defaultMuseumConfig()
      // Las piezas de salas que se borraron quedan sin sala.
      const ids = new Set(collection.museum!.categories.map((c) => c.id))
      for (const item of collection.items) if (item.category && !ids.has(item.category)) item.category = ''
    } else collection.museum = null
    persist()
  }

  function deleteCollection(id: string) {
    for (const item of collections.value.find((c) => c.id === id)?.items ?? []) deleteBoard(itemBoardScope(item.id))
    collections.value = collections.value.filter((c) => c.id !== id)
    persist()
  }

  /** Agrega un elemento; si no cabe en el almacenamiento lo deshace y devuelve false. */
  function addItem(collectionId: string, input: CollectionItemInput): boolean {
    const collection = collections.value.find((c) => c.id === collectionId)
    const data = normalizeItem(input)
    if (!collection || !data.title) return false
    const item: CollectionItem = { category: '', details: {}, ...data, id: uuid(), theme: null, createdAt: Date.now() }
    collection.items.unshift(item)
    if (persist()) return true
    collection.items.shift()
    return false
  }

  function updateItem(collectionId: string, itemId: string, input: CollectionItemInput): boolean {
    const item = collections.value.find((c) => c.id === collectionId)?.items.find((i) => i.id === itemId)
    const data = normalizeItem(input)
    if (!item || !data.title) return false
    const previous = { ...item }
    Object.assign(item, data)
    if (persist()) return true
    Object.assign(item, previous)
    return false
  }

  function deleteItem(collectionId: string, itemId: string) {
    const collection = collections.value.find((c) => c.id === collectionId)
    if (!collection) return
    collection.items = collection.items.filter((i) => i.id !== itemId)
    deleteBoard(itemBoardScope(itemId))
    persist()
  }

  function setItemTheme(collectionId: string, itemId: string, theme: string | null) {
    const item = collections.value.find((c) => c.id === collectionId)?.items.find((i) => i.id === itemId)
    if (!item) return
    item.theme = theme
    persist()
  }

  /** Pone el estilo a toda la colección y quita los estilos propios de cada elemento. */
  function setCollectionTheme(collectionId: string, theme: string | null) {
    const collection = collections.value.find((c) => c.id === collectionId)
    if (!collection) return
    collection.cardTheme = theme
    for (const item of collection.items) item.theme = null
    persist()
  }

  return {
    collections,
    getCollection,
    addCollection,
    updateCollection,
    deleteCollection,
    addItem,
    updateItem,
    deleteItem,
    setItemTheme,
    setCollectionTheme,
  }
}
