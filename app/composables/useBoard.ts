import { type BoardPatternId, isBoardPattern } from '~/utils/boardPatterns'

export type BoardItemType = 'sticker' | 'image' | 'title' | 'banner' | 'date' | 'mood' | 'todo' | 'checklist' | 'note' | 'sleep' | 'stars' | 'drawing' | 'panel' | 'calendar' | 'text' | 'kanban' | 'list' | 'book' | 'client'

export type BoardRefKind = 'list' | 'book' | 'client'

export type BoardItem = {
  id: string
  type: BoardItemType
  /** URL del sticker predefinido, o data URL de una imagen subida por el usuario (tipos 'sticker'/'image'). */
  src?: string
  label?: string
  /** Contenido del widget (título, nota, lista de tareas, etc.) para los demás tipos. */
  data?: Record<string, any>
  /** Id de la lista, libro o cliente al que apunta el elemento (tipos 'list'/'book'/'client'). */
  refId?: string
  /** Giro en grados (stickers e imágenes). */
  rotation?: number
  /** Escala del contenido de widgets y tarjetas (1 = tamaño natural); crece al agrandar un grupo. */
  scale?: number
  /** Grupo armado por el usuario (se guarda): al tocar uno se selecciona todo el grupo. */
  userGroup?: string
  /** Solo mientras se coloca una plantilla: todos sus elementos comparten grupo y se mueven juntos. No se guarda. */
  groupId?: string
  /** Posición en coordenadas del lienzo (px, sin escalar por el zoom). */
  x: number
  y: number
  /** Tamaño en coordenadas del lienzo. */
  width: number
  height: number
}

const STORAGE_KEY = 'todo-board-v1'
const LINKS_STORAGE_KEY = 'todo-board-links-v1'
const BG_STORAGE_KEY = 'todo-board-bg-v1'
const PATTERN_STORAGE_KEY = 'todo-board-pattern-v1'
const PATTERN_OPACITY_STORAGE_KEY = 'todo-board-pattern-opacity-v1'
const DEFAULT_BOARD_COLOR = '#131316'
const DEFAULT_BOARD_PATTERN: BoardPatternId = 'dots'
/** Opacidad de los puntos/renglones/cuadrícula (0 a 1). */
const DEFAULT_PATTERN_OPACITY = 0.15
const WIDGET_TYPES: BoardItemType[] = ['title', 'banner', 'date', 'mood', 'todo', 'checklist', 'note', 'sleep', 'stars', 'drawing', 'panel', 'calendar', 'text', 'kanban']

const REF_TYPES: BoardItemType[] = ['list', 'book', 'client']

export function isWidgetType(type: BoardItemType) {
  return WIDGET_TYPES.includes(type)
}

export function isRefType(type: BoardItemType) {
  return REF_TYPES.includes(type)
}

export type BoardLink = { id: string; from: string; to: string }

function storageKeys(scope: string | null) {
  const suffix = scope ? `:${scope}` : ''
  return {
    items: `${STORAGE_KEY}${suffix}`,
    links: `${LINKS_STORAGE_KEY}${suffix}`,
    bg: `${BG_STORAGE_KEY}${suffix}`,
    pattern: `${PATTERN_STORAGE_KEY}${suffix}`,
    patternOpacity: `${PATTERN_OPACITY_STORAGE_KEY}${suffix}`,
  }
}

/** Crea un tablero independiente. `scope` null es el tablero principal (claves de siempre); otro valor guarda en sus propias claves. */
function createBoardStore(scope: string | null, defaultColor = DEFAULT_BOARD_COLOR) {
  const keys = storageKeys(scope)

  const items = ref<BoardItem[]>([])
  const links = ref<BoardLink[]>([])
  let linksLoaded = false
  const boardColor = ref<string>(defaultColor)
  const boardPattern = ref<BoardPatternId>(DEFAULT_BOARD_PATTERN)
  const patternOpacity = ref(DEFAULT_PATTERN_OPACITY)
  let loaded = false
  let bgLoaded = false
  let patternLoaded = false
  let patternOpacityLoaded = false
  /** Plantilla que se está acomodando (sus elementos se mueven en bloque hasta confirmarla). */
  const editingGroup = ref<string | null>(null)

  // --- deshacer / rehacer ---
  type BoardSnapshot = { items: BoardItem[]; links: BoardLink[]; boardColor: string; boardPattern: BoardPatternId; patternOpacity: number }
  const MAX_HISTORY = 60
  /** Cambios seguidos del mismo tipo (p. ej. escribir letra por letra) se fusionan en un solo paso si ocurren dentro de esta ventana. */
  const COALESCE_MS = 800
  const undoStack = ref<BoardSnapshot[]>([])
  const redoStack = ref<BoardSnapshot[]>([])
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  let lastHistoryKey: string | null = null
  let lastHistoryTime = 0

  function cloneSnapshot(): BoardSnapshot {
    return {
      items: JSON.parse(JSON.stringify(items.value)),
      links: JSON.parse(JSON.stringify(links.value)),
      boardColor: boardColor.value,
      boardPattern: boardPattern.value,
      patternOpacity: patternOpacity.value,
    }
  }

  /** Guarda el estado actual como punto al que volver. Pasa una `key` para fusionar cambios seguidos (misma tecla = mismo paso). */
  function recordHistory(key?: string) {
    const now = Date.now()
    if (key && key === lastHistoryKey && now - lastHistoryTime < COALESCE_MS) {
      lastHistoryTime = now
      return
    }
    undoStack.value.push(cloneSnapshot())
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
    lastHistoryKey = key ?? null
    lastHistoryTime = now
  }

  function applySnapshot(snap: BoardSnapshot) {
    items.value = snap.items
    links.value = snap.links
    boardColor.value = snap.boardColor
    boardPattern.value = snap.boardPattern
    patternOpacity.value = snap.patternOpacity
    persist()
    persistLinks()
    persistBoardColor()
    persistBoardPattern()
    persistPatternOpacity()
    lastHistoryKey = null
  }

  function undo() {
    if (!undoStack.value.length) return
    const current = cloneSnapshot()
    const prev = undoStack.value.pop()!
    redoStack.value.push(current)
    applySnapshot(prev)
  }

  function redo() {
    if (!redoStack.value.length) return
    const current = cloneSnapshot()
    const next = redoStack.value.pop()!
    undoStack.value.push(current)
    applySnapshot(next)
  }

  function sanitize(raw: unknown): BoardItem[] {
    if (!Array.isArray(raw)) return []
    return raw
      .filter((i): i is Record<string, any> => !!i && typeof i === 'object' && typeof i.id === 'string')
      .map((i) => {
        const type: BoardItemType = ['sticker', 'image', ...WIDGET_TYPES, ...REF_TYPES].includes(i.type) ? i.type : 'image'
        // Los tableros guardados antes de tener ancho/alto independientes usaban un único "size" cuadrado.
        const legacySize = typeof i.size === 'number' && i.size > 0 ? i.size : undefined
        return {
          id: i.id,
          type,
          src: typeof i.src === 'string' ? i.src : undefined,
          label: typeof i.label === 'string' ? i.label : undefined,
          data: i.data && typeof i.data === 'object' ? i.data : undefined,
          refId: typeof i.refId === 'string' ? i.refId : undefined,
          scale: typeof i.scale === 'number' && i.scale > 0 ? i.scale : undefined,
          userGroup: typeof i.userGroup === 'string' ? i.userGroup : undefined,
          rotation: typeof i.rotation === 'number' && Number.isFinite(i.rotation) ? i.rotation : 0,
          x: typeof i.x === 'number' ? i.x : 0,
          y: typeof i.y === 'number' ? i.y : 0,
          width: typeof i.width === 'number' && i.width > 0 ? i.width : legacySize ?? 140,
          height: typeof i.height === 'number' && i.height > 0 ? i.height : legacySize ?? 140,
        }
      })
      .filter((i) => (isWidgetType(i.type) ? true : isRefType(i.type) ? !!i.refId : !!i.src)) as BoardItem[]
  }

  function load() {
    if (loaded || !import.meta.client) return
    loaded = true
    try {
      const raw = localStorage.getItem(keys.items)
      items.value = raw ? sanitize(JSON.parse(raw)) : []
    } catch {
      items.value = []
    }
  }

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(keys.items, JSON.stringify(items.value, (key, value) => (key === 'groupId' ? undefined : value)))
    } catch {
      // ignore write failures (e.g. private browsing, cupo lleno)
    }
  }

  function loadLinks() {
    if (linksLoaded || !import.meta.client) return
    linksLoaded = true
    try {
      const raw = JSON.parse(localStorage.getItem(keys.links) ?? '[]')
      links.value = Array.isArray(raw)
        ? raw.filter(
            (l): l is BoardLink => !!l && typeof l.id === 'string' && typeof l.from === 'string' && typeof l.to === 'string',
          )
        : []
    } catch {
      links.value = []
    }
  }

  function persistLinks() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(keys.links, JSON.stringify(links.value))
    } catch {
      // ignore write failures (e.g. private browsing, cupo lleno)
    }
  }

  function loadBoardColor() {
    if (bgLoaded || !import.meta.client) return
    bgLoaded = true
    try {
      const raw = localStorage.getItem(keys.bg)
      boardColor.value = typeof raw === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : defaultColor
    } catch {
      boardColor.value = defaultColor
    }
  }

  function persistBoardColor() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(keys.bg, boardColor.value)
    } catch {
      // ignore write failures (e.g. private browsing, cupo lleno)
    }
  }

  function loadBoardPattern() {
    if (patternLoaded || !import.meta.client) return
    patternLoaded = true
    try {
      const raw = localStorage.getItem(keys.pattern)
      boardPattern.value = isBoardPattern(raw) ? raw : DEFAULT_BOARD_PATTERN
    } catch {
      boardPattern.value = DEFAULT_BOARD_PATTERN
    }
  }

  function persistBoardPattern() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(keys.pattern, boardPattern.value)
    } catch {
      // ignore write failures (e.g. private browsing, cupo lleno)
    }
  }

  function loadPatternOpacity() {
    if (patternOpacityLoaded || !import.meta.client) return
    patternOpacityLoaded = true
    try {
      const raw = Number.parseFloat(localStorage.getItem(keys.patternOpacity) ?? '')
      patternOpacity.value = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : DEFAULT_PATTERN_OPACITY
    } catch {
      patternOpacity.value = DEFAULT_PATTERN_OPACITY
    }
  }

  function persistPatternOpacity() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(keys.patternOpacity, String(patternOpacity.value))
    } catch {
      // ignore write failures (e.g. private browsing, cupo lleno)
    }
  }

  load()
  loadLinks()
  loadBoardColor()
  loadBoardPattern()
  loadPatternOpacity()

  function setBoardColor(color: string) {
    recordHistory('board-color')
    boardColor.value = color
    persistBoardColor()
  }

  function setBoardPattern(pattern: BoardPatternId) {
    recordHistory('board-pattern')
    boardPattern.value = pattern
    persistBoardPattern()
  }

  /** Deslizar la barra cuenta como un solo paso para deshacer. */
  function setPatternOpacity(value: number) {
    recordHistory('pattern-opacity')
    patternOpacity.value = Math.min(1, Math.max(0, value))
    persistPatternOpacity()
  }

  function addItem(input: Omit<BoardItem, 'id'>) {
    recordHistory()
    const item: BoardItem = { id: uuid(), ...input }
    items.value.push(item)
    persist()
    return item.id
  }

  /** Agrega varios elementos de golpe (una plantilla) como un solo grupo y lo deja en modo de edición en bloque. */
  function addGroup(inputs: Omit<BoardItem, 'id' | 'groupId'>[]) {
    recordHistory()
    const groupId = uuid()
    for (const input of inputs) items.value.push({ id: uuid(), ...input, groupId })
    editingGroup.value = groupId
    persist()
    return groupId
  }

  function moveGroup(groupId: string, dx: number, dy: number) {
    recordHistory(`moveGroup:${groupId}`)
    for (const item of items.value) {
      if (item.groupId !== groupId) continue
      item.x += dx
      item.y += dy
    }
    persist()
  }

  function moveItems(ids: string[], dx: number, dy: number) {
    recordHistory(`moveItems:${ids.slice().sort().join(',')}`)
    const set = new Set(ids)
    for (const item of items.value) {
      if (!set.has(item.id)) continue
      item.x += dx
      item.y += dy
    }
    persist()
  }

  /** Escala posiciones y tamaños respecto al punto (ox, oy); el contenido de widgets y tarjetas crece con ellos. */
  function scaleItems(ids: string[], factor: number, ox: number, oy: number) {
    recordHistory(`scaleItems:${ids.slice().sort().join(',')}`)
    const set = new Set(ids)
    for (const item of items.value) {
      if (!set.has(item.id)) continue
      item.x = ox + (item.x - ox) * factor
      item.y = oy + (item.y - oy) * factor
      item.width *= factor
      item.height *= factor
      if (isWidgetType(item.type) || isRefType(item.type)) item.scale = Math.min(8, Math.max(0.1, (item.scale ?? 1) * factor))
    }
    persist()
  }

  function groupItems(ids: string[]) {
    recordHistory()
    const userGroup = uuid()
    const set = new Set(ids)
    for (const item of items.value) if (set.has(item.id)) item.userGroup = userGroup
    persist()
  }

  function ungroupItems(ids: string[]) {
    recordHistory()
    const set = new Set(ids)
    for (const item of items.value) if (set.has(item.id)) delete item.userGroup
    persist()
  }

  /** Sale del modo de edición en bloque: la plantilla queda como grupo guardado (se mueve y escala junta hasta desagrupar). */
  function ungroup(groupId: string) {
    recordHistory()
    const members = items.value.filter((i) => i.groupId === groupId)
    for (const item of members) {
      if (members.length > 1) item.userGroup = groupId
      delete item.groupId
    }
    if (editingGroup.value === groupId) editingGroup.value = null
    persist()
  }

  function removeGroup(groupId: string) {
    recordHistory()
    const ids = new Set(items.value.filter((i) => i.groupId === groupId).map((i) => i.id))
    items.value = items.value.filter((i) => !ids.has(i.id))
    if (editingGroup.value === groupId) editingGroup.value = null
    persist()
    if (links.value.some((l) => ids.has(l.from) || ids.has(l.to))) {
      links.value = links.value.filter((l) => !ids.has(l.from) && !ids.has(l.to))
      persistLinks()
    }
  }

  function moveItem(id: string, x: number, y: number) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    recordHistory(`move:${id}`)
    item.x = x
    item.y = y
    persist()
  }

  function resizeItem(id: string, width: number, height: number) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    recordHistory(`resize:${id}`)
    item.width = Math.max(60, width)
    item.height = Math.max(48, height)
    persist()
  }

  function updateItemData(id: string, data: Record<string, any>) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    recordHistory(`data:${id}`)
    item.data = { ...item.data, ...data }
    persist()
  }

  function rotateItem(id: string, rotation: number) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    recordHistory(`rotate:${id}`)
    item.rotation = ((Math.round(rotation) % 360) + 360) % 360
    persist()
  }

  function removeItem(id: string) {
    recordHistory()
    items.value = items.value.filter((i) => i.id !== id)
    persist()
    if (links.value.some((l) => l.from === id || l.to === id)) {
      links.value = links.value.filter((l) => l.from !== id && l.to !== id)
      persistLinks()
    }
  }

  /** Une dos elementos; si ya estaban unidos, quita la unión. */
  function toggleLink(a: string, b: string) {
    if (a === b) return
    recordHistory()
    const existing = links.value.find((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a))
    links.value = existing ? links.value.filter((l) => l.id !== existing.id) : [...links.value, { id: uuid(), from: a, to: b }]
    persistLinks()
  }

  function removeLink(id: string) {
    recordHistory()
    links.value = links.value.filter((l) => l.id !== id)
    persistLinks()
  }

  return {
    items,
    links,
    addItem,
    addGroup,
    moveGroup,
    moveItems,
    scaleItems,
    groupItems,
    ungroupItems,
    ungroup,
    removeGroup,
    editingGroup,
    moveItem,
    resizeItem,
    rotateItem,
    updateItemData,
    removeItem,
    toggleLink,
    removeLink,
    boardColor,
    setBoardColor,
    boardPattern,
    setBoardPattern,
    patternOpacity,
    setPatternOpacity,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}

type BoardStore = ReturnType<typeof createBoardStore>
const stores = new Map<string, BoardStore>()

/**
 * Tablero principal (sin `scope`) o uno propio, p. ej. el de un elemento de colección.
 * `defaultColor` solo se usa si ese tablero aún no tiene color guardado.
 */
export function useBoard(scope: string | null = null, options: { defaultColor?: string } = {}) {
  const id = scope ?? ''
  let store = stores.get(id)
  if (!store) {
    store = createBoardStore(scope, options.defaultColor)
    stores.set(id, store)
  }
  return store
}

/** Borra por completo un tablero con ámbito (al eliminar el elemento al que pertenece). */
export function deleteBoard(scope: string) {
  stores.delete(scope)
  if (!import.meta.client) return
  try {
    for (const key of Object.values(storageKeys(scope))) localStorage.removeItem(key)
  } catch {
    // ignore blocked storage
  }
}

/** Cuántos elementos tiene un tablero con ámbito, sin cargarlo. */
export function boardItemCount(scope: string): number {
  if (!import.meta.client) return 0
  try {
    const raw = JSON.parse(localStorage.getItem(storageKeys(scope).items) ?? '[]')
    return Array.isArray(raw) ? raw.length : 0
  } catch {
    return 0
  }
}
