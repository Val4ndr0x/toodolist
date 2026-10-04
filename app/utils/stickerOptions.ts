import type { StickerType } from '~/composables/useBooks'
import type { BoardItemType } from '~/composables/useBoard'

export type StickerIcon = 'checklist' | 'sticker' | 'star' | 'cloud' | 'edit'

export type StickerOption = {
  /** Tipos de widget que solo existen en el tablero (p. ej. 'kanban') solo deben usarse en opciones marcadas `boardOnly`. */
  type: StickerType | BoardItemType
  label: string
  data: Record<string, any>
  icon?: StickerIcon
  /** Emoji que se muestra en el selector (para opciones sin icono propio). */
  emoji?: string
  image?: string
  /** Se agrega directamente en modo scrapbook (flotando libre sobre la página). */
  free?: boolean
  rot?: number
}

/** Stickers decorativos que flotan libres: washi, clips, chinchetas, polaroids y sellos. */
export const DECOR_OPTIONS: StickerOption[] = [
  { type: 'washi', label: 'Washi rosa', emoji: '🎀', free: true, rot: -4, data: { color: '#f7b8cf', pattern: 'dots' } },
  { type: 'washi', label: 'Washi menta', emoji: '🍃', free: true, rot: 3, data: { color: '#a9dcc3', pattern: 'stripes' } },
  { type: 'washi', label: 'Washi lila', emoji: '💜', free: true, rot: -2, data: { color: '#cdb8ec', pattern: 'hearts' } },
  { type: 'washi', label: 'Washi amarilla', emoji: '🌼', free: true, rot: 5, data: { color: '#f7e08a', pattern: 'plaid' } },
  { type: 'polaroid', label: 'Polaroid', emoji: '📷', free: true, rot: -3, data: { src: '', caption: '' } },
  { type: 'clip', label: 'Clip', emoji: '📎', free: true, rot: 12, data: { color: '#c98aa6' } },
  { type: 'pin', label: 'Chincheta', emoji: '📌', free: true, rot: 0, data: { color: '#e5566d' } },
  { type: 'stamp', label: 'Sello', emoji: '💮', free: true, rot: -8, data: { index: 0, color: '#d9587b' } },
]

/** Encabezados de sección decorativos (pincelada, corazones, confeti) para poner sobre un checklist. */
export const BANNER_OPTIONS: StickerOption[] = [
  { type: 'banner', label: 'Banner cute', image: '/stickers/conejo.png', data: { text: 'Banner cute', variant: 'brush', color: '#f4c6cf', decor: '/stickers/conejo.png' } },
  { type: 'banner', label: 'Banner corazones', image: '/stickers/forma-de-corazon.png', data: { text: 'Banner corazones', variant: 'hearts', color: '#f4a3c4', decor: '' } },
  { type: 'banner', label: 'Banner confeti', image: '/stickers/kawaii.png', data: { text: 'Banner confeti', variant: 'confetti', color: '#f7b8cf', decor: '/stickers/kawaii.png' } },
  { type: 'banner', label: 'Banner natural', image: '/stickers/planta.png', data: { text: 'Banner natural', variant: 'brush', color: '#f3e3ae', decor: '/stickers/planta.png' } },
]

/** Seguimiento del día: clima, agua, gratitud y hábitos. */
export const TRACKER_OPTIONS: StickerOption[] = [
  { type: 'weather', label: 'Clima', emoji: '🌤️', data: { value: null } },
  { type: 'water', label: 'Agua', emoji: '💧', data: { value: 0 } },
  { type: 'gratitude', label: 'Gratitud', emoji: '💗', data: { lines: ['', '', ''] } },
  {
    type: 'habits',
    label: 'Hábitos',
    emoji: '🌱',
    data: {
      habits: [
        { id: uuid(), name: 'Ejercicio', days: [false, false, false, false, false, false, false] },
        { id: uuid(), name: 'Leer', days: [false, false, false, false, false, false, false] },
      ],
    },
  },
]

/** Estudio de idiomas: práctica de escritura con cuadrícula y lista de vocabulario. */
export const LANGUAGE_OPTIONS: StickerOption[] = [
  { type: 'language', label: 'Práctica de escritura', emoji: '✍️', data: { text: '', date: '', rows: 4, cols: 8, trace: true } },
  {
    type: 'vocab',
    label: 'Vocabulario',
    emoji: '📖',
    data: {
      entries: [
        { id: uuid(), word: '', meaning: '', example: '', kind: null },
        { id: uuid(), word: '', meaning: '', example: '', kind: null },
      ],
    },
  },
]

/** Piezas sueltas para un tablero de negocio: prioridades (kanban), agenda, clientes, números clave y revisión semanal. */
export const BUSINESS_OPTIONS: StickerOption[] = [
  {
    type: 'todo',
    label: 'Pendiente',
    emoji: '📥',
    data: { title: 'Pendiente', color: '#f4dede', items: Array.from({ length: 3 }, () => ({ id: uuid(), text: '', checked: false })) },
  },
  {
    type: 'todo',
    label: 'En proceso',
    emoji: '⏳',
    data: { title: 'En proceso', color: '#f6f3da', items: Array.from({ length: 3 }, () => ({ id: uuid(), text: '', checked: false })) },
  },
  {
    type: 'todo',
    label: 'Hecho',
    emoji: '✅',
    data: { title: 'Hecho', color: '#e4eddd', items: Array.from({ length: 3 }, () => ({ id: uuid(), text: '', checked: false })) },
  },
  {
    type: 'note',
    label: 'Reuniones y citas',
    emoji: '📅',
    data: { title: 'Reuniones y citas', color: '#dbe8f4', value: '', style: 'nubes' },
  },
  {
    type: 'note',
    label: 'Clientes y proyectos',
    emoji: '🧾',
    data: { title: 'Clientes y proyectos', color: '#e7dcf0', value: 'Cliente o proyecto → siguiente paso\n\n\n', style: 'lavanda' },
  },
  {
    type: 'note',
    label: 'Ideas o por explorar',
    emoji: '💡',
    data: { title: 'Ideas o por explorar', color: '#fdf1d6', value: '', style: 'margaritas' },
  },
  {
    type: 'note',
    label: 'Números clave',
    emoji: '📊',
    data: { title: 'Números clave', color: '#d9f0ea', value: 'Ventas:\nCotizaciones enviadas:\nGastos:\n', style: 'bosque' },
  },
  {
    type: 'note',
    label: 'Qué salió bien',
    emoji: '👍',
    data: { title: 'Qué salió bien', color: '#e4eddd', value: '', style: 'olas' },
  },
  {
    type: 'note',
    label: 'Qué salió mal',
    emoji: '👎',
    data: { title: 'Qué salió mal', color: '#f5e6dc', value: '', style: 'colinas' },
  },
]

/** Opciones que usan tipos de widget exclusivos del tablero (no existen en las páginas de libros). */
export const BOARD_ONLY_OPTIONS: StickerOption[] = [
  { type: 'kanban', label: 'Kanban (mini)', emoji: '🗂️', data: {} },
]

export const STICKER_OPTIONS: StickerOption[] = [
  { type: 'drawing', label: 'Plumón (escribir a mano)', icon: 'edit', data: { strokes: [] } },
  { type: 'title', label: 'Título', icon: 'sticker', data: { text: 'Mi página' } },
  { type: 'date', label: 'Fecha', icon: 'sticker', data: { value: '' } },
  { type: 'mood', label: 'Mi estado de ánimo', icon: 'sticker', data: { value: null } },
  { type: 'todo', label: 'Lista de tareas', icon: 'checklist', data: { items: [] } },
  {
    type: 'checklist',
    label: 'Rutina / Checklist',
    icon: 'checklist',
    data: { title: 'Rutina', items: [{ id: uuid(), label: 'Ejercicio', checked: false }] },
  },
  { type: 'note', label: 'Nota', icon: 'sticker', data: { title: '', color: '#fdeec9', value: '' } },
  { type: 'note', label: 'Metas', icon: 'sticker', data: { title: 'Metas', color: '#eef0d9', value: '' } },
  { type: 'note', label: 'Agradecimiento', icon: 'sticker', data: { title: 'Estoy agradecido/a por', color: '#dbe7f5', value: '' } },
  { type: 'note', label: 'Afirmaciones', icon: 'sticker', data: { title: 'Afirmaciones', color: '#e6dbf0', value: '' } },
  { type: 'sleep', label: 'Horas de sueño', icon: 'cloud', data: { value: null } },
  { type: 'stars', label: 'Productividad', icon: 'star', data: { title: 'Productividad', value: 0 } },
]

// Stickers de imagen disponibles en /public/stickers, agrupados por categoría
// para que el selector no se vuelva una grilla gigante al agregar más archivos.
const STICKER_IMAGE_FILES: { file: string; category: string }[] = [
  // Emociones
  { file: 'adorable.png', category: 'Emociones' },
  { file: 'amor.png', category: 'Emociones' },
  { file: 'amor(1).png', category: 'Emociones' },
  { file: 'conmocionado.png', category: 'Emociones' },
  { file: 'contento.png', category: 'Emociones' },
  { file: 'enfadado.png', category: 'Emociones' },
  { file: 'enfadado(1).png', category: 'Emociones' },
  { file: 'enfadado(2).png', category: 'Emociones' },
  { file: 'enfadado(3).png', category: 'Emociones' },
  { file: 'enfermo.png', category: 'Emociones' },
  { file: 'enojado.png', category: 'Emociones' },
  { file: 'heartbrok.png', category: 'Emociones' },
  { file: 'hola.png', category: 'Emociones' },
  { file: 'incredulidad.png', category: 'Emociones' },
  { file: 'kawaii.png', category: 'Emociones' },
  { file: 'linda.png', category: 'Emociones' },
  { file: 'linda(1).png', category: 'Emociones' },
  { file: 'ok.png', category: 'Emociones' },
  { file: 'ok(1).png', category: 'Emociones' },
  { file: 'paz.png', category: 'Emociones' },
  { file: 'perplejo.png', category: 'Emociones' },
  { file: 'rubor.png', category: 'Emociones' },
  { file: 'si.png', category: 'Emociones' },
  { file: 'socarron.png', category: 'Emociones' },
  { file: 'socarron(1).png', category: 'Emociones' },
  { file: 'timido.png', category: 'Emociones' },
  { file: 'triste.png', category: 'Emociones' },
  { file: 'triste(1).png', category: 'Emociones' },
  { file: 'triste(2).png', category: 'Emociones' },

  // Personas
  { file: 'chica.png', category: 'Personas' },
  { file: 'chica(1).png', category: 'Personas' },
  { file: 'chica(2).png', category: 'Personas' },
  { file: 'chica(3).png', category: 'Personas' },
  { file: 'chica(4).png', category: 'Personas' },
  { file: 'chica(5).png', category: 'Personas' },
  { file: 'chica(6).png', category: 'Personas' },
  { file: 'chica(7).png', category: 'Personas' },
  { file: 'muchacha.png', category: 'Personas' },
  { file: 'mujer.png', category: 'Personas' },
  { file: 'mujer-de-negocios.png', category: 'Personas' },
  { file: 'rubio.png', category: 'Personas' },
  { file: 'rubio(1).png', category: 'Personas' },
  { file: 'poder-femenino.png', category: 'Personas' },
  { file: 'los-anteojos.png', category: 'Personas' },

  // Animales
  { file: 'conejo.png', category: 'Animales' },
  { file: 'gato.png', category: 'Animales' },
  { file: 'gato(1).png', category: 'Animales' },
  { file: 'rana.png', category: 'Animales' },

  // Actividades
  { file: 'alejarse.png', category: 'Actividades' },
  { file: 'cantar.png', category: 'Actividades' },
  { file: 'cantar(1).png', category: 'Actividades' },
  { file: 'cantar(2).png', category: 'Actividades' },
  { file: 'creatividad.png', category: 'Actividades' },
  { file: 'creatividad(1).png', category: 'Actividades' },
  { file: 'creatividad(2).png', category: 'Actividades' },
  { file: 'ser-creativo.png', category: 'Actividades' },
  { file: 'leer.png', category: 'Actividades' },
  { file: 'pintura-de-retrato.png', category: 'Actividades' },

  // Comida
  { file: 'cafe.png', category: 'Comida' },
  { file: 'cafe(1).png', category: 'Comida' },
  { file: 'cafe(2).png', category: 'Comida' },
  { file: 'calabaza.png', category: 'Comida' },
  { file: 'fruta.png', category: 'Comida' },
  { file: 'pina.png', category: 'Comida' },
  { file: 'torta.png', category: 'Comida' },

  // Naturaleza y objetos
  { file: 'forma-de-corazon.png', category: 'Naturaleza y objetos' },
  { file: 'planta.png', category: 'Naturaleza y objetos' },
  { file: 'mucho-calor.png', category: 'Naturaleza y objetos' },
]

// Nombres con tilde/ortografía correcta que el nombre de archivo (sin acentos) no puede representar.
const LABEL_FIXES: Record<string, string> = {
  cafe: 'Café',
  pina: 'Piña',
  socarron: 'Socarrón',
  timido: 'Tímido',
  'forma-de-corazon': 'Forma de corazón',
}

function labelFromFile(file: string): string {
  const base = file.replace(/\.png$/i, '')
  const match = base.match(/^(.*)\((\d+)\)$/)
  const key = match ? match[1]! : base
  const words = (LABEL_FIXES[key] ?? key.replace(/-/g, ' ')).trim()
  const label = LABEL_FIXES[key] ?? words.charAt(0).toUpperCase() + words.slice(1)
  return match ? `${label} ${parseInt(match[2]!, 10) + 1}` : label
}

export const STICKER_CATEGORIES: string[] = Array.from(new Set(STICKER_IMAGE_FILES.map((f) => f.category)))

export const STICKER_IMAGE_OPTIONS: (StickerOption & { category: string })[] = STICKER_IMAGE_FILES.map(({ file, category }) => {
  const label = labelFromFile(file)
  return {
    type: 'image',
    label,
    category,
    image: `/stickers/${file}`,
    data: { src: `/stickers/${file}`, label },
  }
})

export const ALL_STICKER_OPTIONS: StickerOption[] = [...STICKER_OPTIONS, ...STICKER_IMAGE_OPTIONS]

export const STICKER_COLOR_PRESETS = [
  '#ffffff', '#fdeec9', '#eef0d9', '#dbe7f5', '#e6dbf0', '#dce8da',
  '#dcdaf0', '#f3e3d3', '#fbe3ea', '#fde2c8', '#d9f0ea', '#f0d9e0',
  '#2a2438', '#1d2a26', '#1b2536', '#33262b',
]
