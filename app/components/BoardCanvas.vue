<script setup lang="ts">
import { useBoard, isWidgetType, isRefType, type BoardItem, type BoardItemType, type BoardRefKind } from '~/composables/useBoard'
import { BOARD_PATTERNS, boardPatternImage, BOARD_PATTERN_UNIT } from '~/utils/boardPatterns'
import type { StickerType } from '~/composables/useBooks'
import StickerPicker from '~/components/StickerPicker.vue'
import BoardLinkPicker from '~/components/BoardLinkPicker.vue'
import BoardTemplatePicker from '~/components/BoardTemplatePicker.vue'
import { BOARD_TEMPLATES, type BoardTemplate } from '~/utils/boardTemplates'
import BoardCommandPalette from '~/components/BoardCommandPalette.vue'
import {
  STICKER_OPTIONS,
  BANNER_OPTIONS,
  BUSINESS_OPTIONS,
  BOARD_ONLY_OPTIONS,
  TRACKER_OPTIONS,
  LANGUAGE_OPTIONS,
  DECOR_OPTIONS,
  STICKER_IMAGE_OPTIONS,
  type StickerOption,
} from '~/utils/stickerOptions'
import BoardRefCard from '~/components/BoardRefCard.vue'
import ColorPickerPopover from '~/components/ColorPickerPopover.vue'
import BoardPatternPicker from '~/components/BoardPatternPicker.vue'
import FontPickerPopover from '~/components/FontPickerPopover.vue'
import StickerTitle from '~/components/stickers/StickerTitle.vue'
import StickerBanner from '~/components/stickers/StickerBanner.vue'
import StickerDate from '~/components/stickers/StickerDate.vue'
import StickerMood from '~/components/stickers/StickerMood.vue'
import StickerTodo from '~/components/stickers/StickerTodo.vue'
import StickerChecklist from '~/components/stickers/StickerChecklist.vue'
import StickerNote from '~/components/stickers/StickerNote.vue'
import StickerSleep from '~/components/stickers/StickerSleep.vue'
import StickerStars from '~/components/stickers/StickerStars.vue'
import StickerDraw from '~/components/stickers/StickerDraw.vue'
import StickerPanel from '~/components/stickers/StickerPanel.vue'
import StickerCalendar from '~/components/stickers/StickerCalendar.vue'
import StickerText from '~/components/stickers/StickerText.vue'
import StickerKanban from '~/components/stickers/StickerKanban.vue'

/** Sin `boardScope` es el tablero principal; con él, un tablero propio (p. ej. el de un libro o película de una colección). */
const props = defineProps<{ boardScope?: string | null; defaultColor?: string }>()

const { items, links, addItem, addGroup, moveItems, scaleItems, groupItems: makeGroup, ungroupItems, ungroup, removeGroup, editingGroup, moveItem, resizeItem, rotateItem, updateItemData, removeItem, toggleLink, removeLink, boardColor, setBoardColor, boardPattern, setBoardPattern, patternOpacity, setPatternOpacity, undo, redo, canUndo, canRedo } = useBoard(props.boardScope ?? null, { defaultColor: props.defaultColor })
const router = useRouter()
const { lists } = useLists()
const { books } = useBooks()
const { clients } = useClients()

const REF_DEFAULT_SIZE: Record<BoardRefKind, { width: number; height: number }> = {
  list: { width: 220, height: 110 },
  book: { width: 140, height: 190 },
  client: { width: 220, height: 120 },
}

function refExists(item: BoardItem) {
  if (!isRefType(item.type)) return true
  if (item.type === 'list') return lists.value.some((l) => l.id === item.refId)
  if (item.type === 'book') return books.value.some((b) => b.id === item.refId)
  return clients.value.some((c) => c.id === item.refId)
}

// Un elemento que apunta a algo ya eliminado se oculta (y sus uniones con él).
const visibleItems = computed(() => items.value.filter(refExists))
const isRotatable = (item: BoardItem) => item.type === 'sticker' || item.type === 'image'

const componentMap: Partial<Record<BoardItemType, unknown>> = {
  title: StickerTitle,
  banner: StickerBanner,
  date: StickerDate,
  mood: StickerMood,
  todo: StickerTodo,
  checklist: StickerChecklist,
  note: StickerNote,
  sleep: StickerSleep,
  stars: StickerStars,
  drawing: StickerDraw,
  panel: StickerPanel,
  calendar: StickerCalendar,
  text: StickerText,
  kanban: StickerKanban,
}

const WIDGET_DEFAULT_SIZE: Partial<Record<BoardItemType, { width: number; height: number }>> = {
  title: { width: 260, height: 90 },
  banner: { width: 260, height: 70 },
  date: { width: 240, height: 70 },
  mood: { width: 260, height: 130 },
  todo: { width: 260, height: 200 },
  checklist: { width: 260, height: 220 },
  note: { width: 260, height: 200 },
  sleep: { width: 260, height: 160 },
  stars: { width: 240, height: 110 },
  drawing: { width: 320, height: 240 },
  panel: { width: 260, height: 200 },
  calendar: { width: 460, height: 400 },
  text: { width: 220, height: 48 },
  kanban: { width: 340, height: 230 },
}

const WIDGET_DEFAULT_COLOR: Partial<Record<BoardItemType, string>> = {
  title: '#ffffff',
  banner: '#f4c6cf',
  date: '#dce8da',
  mood: '#dcdaf0',
  todo: '#ffffff',
  checklist: '#f3e3d3',
  note: '#eef0d9',
  sleep: '#ffffff',
  stars: '#ffffff',
  drawing: '#1f2937',
  panel: '#e7dcf0',
  calendar: '#ffffff',
  kanban: '#ffffff',
}

const BOARD_COLOR_PRESETS = ['#131316', '#1a1a2e', '#10151c', '#1f1320', '#0d1b1e', '#14201c', '#fdf6ec', '#f7ece2', '#eef2f7', '#fbe9ef', '#eaf2e9', '#ffffff']
const STICKER_COLOR_PRESETS = ['#ffffff', '#eef0d9', '#dbe7f5', '#e6dbf0', '#dce8da', '#dcdaf0', '#f3e3d3', '#fbe3ea', '#fde2c8', '#d9f0ea', '#f0d9e0', '#d9d9f0']

const wrapperRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)

// El punteado del fondo debe verse oscuro sobre fondos claros y blanco sobre fondos oscuros.
function isLightColor(hex: string) {
  const m = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex)
  if (!m) return false
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

const bareInk = computed(() => (isLightColor(boardColor.value) ? '#1c1c22' : '#f4f4f6'))

const gridDotColor = computed(() => (isLightColor(boardColor.value) ? `rgba(0,0,0,${patternOpacity.value})` : `rgba(255,255,255,${patternOpacity.value})`))

const showPatternPicker = ref(false)
const boardPatternStyle = computed(() => {
  const image = boardPatternImage(boardPattern.value, gridDotColor.value)
  if (image === 'none') return {}
  return {
    backgroundImage: image,
    backgroundSize: `${BOARD_PATTERN_UNIT * zoom.value}px ${BOARD_PATTERN_UNIT * zoom.value}px`,
    backgroundPosition: `${panX.value}px ${panY.value}px`,
  }
})

const selectedId = ref<string | null>(null)
/** Selección múltiple (2 o más): se mueve, agrupa y escala en bloque. Con 1 solo elemento se usa selectedId. */
const multiIds = ref<string[]>([])
/** Modo "seleccionar": en táctil sustituye a Shift (tocar suma/quita elementos, arrastrar el fondo dibuja un recuadro). */
const selectMode = ref(false)
const marquee = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
const multiSet = computed(() => new Set(multiIds.value))
const isSelected = (item: BoardItem) => selectedId.value === item.id || multiSet.value.has(item.id)
const selectionIds = computed(() => (multiIds.value.length ? multiIds.value : selectedId.value ? [selectedId.value] : []))

/** Si un elemento pertenece a un grupo del usuario, arrastra con él a todos sus compañeros. */
function expandGroups(ids: string[]) {
  const groups = new Set(items.value.filter((i) => ids.includes(i.id) && i.userGroup).map((i) => i.userGroup))
  const out = new Set(ids)
  for (const i of visibleItems.value) if (i.userGroup && groups.has(i.userGroup)) out.add(i.id)
  return [...out]
}

function setSelection(ids: string[]) {
  const valid = ids.filter((id) => visibleItems.value.some((i) => i.id === id))
  selectedId.value = valid.length === 1 ? valid[0]! : null
  multiIds.value = valid.length >= 2 ? valid : []
}

function clearSelection() {
  selectedId.value = null
  multiIds.value = []
}

function toggleSelect(item: BoardItem) {
  const members = expandGroups([item.id])
  const current = selectionIds.value
  setSelection(current.includes(item.id) ? current.filter((id) => !members.includes(id)) : [...new Set([...current, ...members])])
}

const allSameGroup = computed(() => {
  const sel = items.value.filter((i) => multiSet.value.has(i.id))
  return sel.length > 0 && !!sel[0]!.userGroup && sel.every((i) => i.userGroup === sel[0]!.userGroup)
})
const anyGrouped = computed(() => items.value.some((i) => multiSet.value.has(i.id) && i.userGroup))

function groupSelection() {
  makeGroup(multiIds.value)
}
function ungroupSelection() {
  ungroupItems(multiIds.value)
}
function deleteSelection() {
  for (const id of [...multiIds.value]) removeItem(id)
  clearSelection()
}
const showStickerPicker = ref(false)
const showLinkPicker = ref(false)
const showTemplatePicker = ref(false)
const showCommandPalette = ref(false)
/** Elemento desde el que se está armando una unión; el siguiente que se toque queda unido con él. */
const connectFrom = ref<string | null>(null)
const colorPickerTarget = ref<'board' | string | null>(null)

const fontPickerTarget = ref<string | null>(null)
const fontPickerValue = computed(() => items.value.find((i) => i.id === fontPickerTarget.value)?.data?.font ?? 'default')

const colorPickerValue = computed(() => {
  if (!colorPickerTarget.value) return '#ffffff'
  if (colorPickerTarget.value === 'board') return boardColor.value
  const item = items.value.find((i) => i.id === colorPickerTarget.value)
  return item?.data?.color ?? WIDGET_DEFAULT_COLOR[item?.type as BoardItemType] ?? '#ffffff'
})

const colorPickerPresets = computed(() => (colorPickerTarget.value === 'board' ? BOARD_COLOR_PRESETS : STICKER_COLOR_PRESETS))
const colorPickerTitle = computed(() => (colorPickerTarget.value === 'board' ? 'Color del tablero' : 'Color del sticker'))

function openBoardColorPicker() {
  colorPickerTarget.value = 'board'
}

function openItemColorPicker(id: string) {
  colorPickerTarget.value = id
}

function onColorUpdate(color: string) {
  if (!colorPickerTarget.value) return
  if (colorPickerTarget.value === 'board') setBoardColor(color)
  else updateItemData(colorPickerTarget.value, { color })
}

const livePositions = reactive<Record<string, { x: number; y: number }>>({})
const liveSizes = reactive<Record<string, { width: number; height: number }>>({})
const liveRotations = reactive<Record<string, number>>({})
const liveScales = reactive<Record<string, number>>({})

function livePosOf(item: BoardItem) {
  return livePositions[item.id] ?? item
}

function liveSizeOf(item: BoardItem) {
  return liveSizes[item.id] ?? item
}

const linkLines = computed(() => {
  const byId = new Map(visibleItems.value.map((i) => [i.id, i]))
  const result: { id: string; from: string; to: string; x1: number; y1: number; x2: number; y2: number }[] = []
  for (const link of links.value) {
    const a = byId.get(link.from)
    const b = byId.get(link.to)
    if (!a || !b) continue
    const pa = livePosOf(a)
    const sa = liveSizeOf(a)
    const pb = livePosOf(b)
    const sb = liveSizeOf(b)
    result.push({
      id: link.id,
      from: link.from,
      to: link.to,
      x1: pa.x + sa.width / 2,
      y1: pa.y + sa.height / 2,
      x2: pb.x + sb.width / 2,
      y2: pb.y + sb.height / 2,
    })
  }
  return result
})

// Los botones de quitar unión solo aparecen cuando se está conectando o hay un extremo seleccionado.
function showLinkRemove(line: { from: string; to: string }) {
  return !!connectFrom.value || selectedId.value === line.from || selectedId.value === line.to
}

function startConnect(id: string) {
  connectFrom.value = connectFrom.value === id ? null : id
}

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}

function zoomAt(clientX: number, clientY: number, newZoomRaw: number) {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  const cx = clientX - rect.left
  const cy = clientY - rect.top
  const newZoom = clampZoom(newZoomRaw)
  const boardX = (cx - panX.value) / zoom.value
  const boardY = (cy - panY.value) / zoom.value
  panX.value = cx - boardX * newZoom
  panY.value = cy - boardY * newZoom
  zoom.value = newZoom
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const factor = Math.exp(-e.deltaY * 0.0015)
  zoomAt(e.clientX, e.clientY, zoom.value * factor)
}

function zoomButton(factor: number) {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom.value * factor)
}

function resetView() {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
}

function viewportCenterBoard() {
  if (!wrapperRef.value) return { x: 0, y: 0 }
  const rect = wrapperRef.value.getBoundingClientRect()
  return {
    x: (rect.width / 2 - panX.value) / zoom.value,
    y: (rect.height / 2 - panY.value) / zoom.value,
  }
}

// --- pan (un dedo/click) sobre el lienzo vacío ---
const TAP_SLOP = 6
let panState: { pointerId: number; startClientX: number; startClientY: number; startPanX: number; startPanY: number; moved: boolean; onTap?: () => void } | null = null

/** Empieza a mover el tablero con este puntero. `onTap` se ejecuta si el gesto fue un toque sin arrastre. */
function startPan(e: PointerEvent, onTap?: () => void) {
  panState = { pointerId: e.pointerId, startClientX: e.clientX, startClientY: e.clientY, startPanX: panX.value, startPanY: panY.value, moved: false, onTap }
  window.addEventListener('pointermove', onWrapperPointerMove)
  window.addEventListener('pointerup', onWrapperPointerUp)
  window.addEventListener('pointercancel', onWrapperPointerUp)
}

/** En táctil, un objeto sin seleccionar no se arrastra: tocarlo lo selecciona, y arrastrar sobre él mueve el tablero. */
const isTouchOnUnselected = (e: PointerEvent, item: BoardItem) => e.pointerType === 'touch' && !isSelected(item)

function onWrapperPointerDown(e: PointerEvent) {
  // El segundo dedo lo atiende el pellizco (onPointerCapture); aquí solo entra el primero.
  if (touchPts.size >= 2) return
  connectFrom.value = null
  if (e.shiftKey || selectMode.value) {
    startMarquee(e)
    return
  }
  clearSelection()
  startPan(e)
}

function onWrapperPointerMove(e: PointerEvent) {
  if (!panState || e.pointerId !== panState.pointerId) return
  if (!panState.moved && Math.hypot(e.clientX - panState.startClientX, e.clientY - panState.startClientY) > TAP_SLOP) panState.moved = true
  panX.value = panState.startPanX + (e.clientX - panState.startClientX)
  panY.value = panState.startPanY + (e.clientY - panState.startClientY)
}

function onWrapperPointerUp(e: PointerEvent) {
  if (panState && e.pointerId !== panState.pointerId) return
  const tap = panState && !panState.moved && e.type === 'pointerup' ? panState.onTap : undefined
  panState = null
  tap?.()
  window.removeEventListener('pointermove', onWrapperPointerMove)
  window.removeEventListener('pointerup', onWrapperPointerUp)
  window.removeEventListener('pointercancel', onWrapperPointerUp)
}

// --- recuadro de selección (Shift + arrastrar, o modo "seleccionar") ---
let marqueeBase: string[] = []

function startMarquee(e: PointerEvent) {
  const rect = wrapperRef.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  marquee.value = { x1: x, y1: y, x2: x, y2: y }
  marqueeBase = e.shiftKey || selectMode.value ? [...selectionIds.value] : []
  window.addEventListener('pointermove', onMarqueeMove)
  window.addEventListener('pointerup', onMarqueeUp)
  window.addEventListener('pointercancel', onMarqueeUp)
}

function onMarqueeMove(e: PointerEvent) {
  const rect = wrapperRef.value?.getBoundingClientRect()
  if (!rect || !marquee.value) return
  marquee.value = { ...marquee.value, x2: e.clientX - rect.left, y2: e.clientY - rect.top }
}

function onMarqueeUp() {
  const m = marquee.value
  marquee.value = null
  window.removeEventListener('pointermove', onMarqueeMove)
  window.removeEventListener('pointerup', onMarqueeUp)
  window.removeEventListener('pointercancel', onMarqueeUp)
  if (!m) return
  const left = (Math.min(m.x1, m.x2) - panX.value) / zoom.value
  const right = (Math.max(m.x1, m.x2) - panX.value) / zoom.value
  const top = (Math.min(m.y1, m.y2) - panY.value) / zoom.value
  const bottom = (Math.max(m.y1, m.y2) - panY.value) / zoom.value
  const hit = visibleItems.value.filter((i) => i.x < right && i.x + i.width > left && i.y < bottom && i.y + i.height > top).map((i) => i.id)
  setSelection(expandGroups([...new Set([...marqueeBase, ...hit])]))
}

// --- escalar en bloque: pellizco con dos dedos, o la esquina del grupo ---
let scaleGesture: { ids: string[]; ox: number; oy: number; snap: Map<string, { x: number; y: number; w: number; h: number; s: number }>; factor: number } | null = null

function beginScale(ids: string[], ox: number, oy: number) {
  const snap = new Map<string, { x: number; y: number; w: number; h: number; s: number }>()
  for (const i of items.value) if (ids.includes(i.id)) snap.set(i.id, { x: i.x, y: i.y, w: i.width, h: i.height, s: i.scale ?? 1 })
  scaleGesture = { ids, ox, oy, snap, factor: 1 }
}

function previewScale(rawFactor: number) {
  if (!scaleGesture) return
  const f = Math.min(5, Math.max(0.2, rawFactor))
  scaleGesture.factor = f
  const { ox, oy } = scaleGesture
  for (const [id, s] of scaleGesture.snap) {
    livePositions[id] = { x: ox + (s.x - ox) * f, y: oy + (s.y - oy) * f }
    liveSizes[id] = { width: s.w * f, height: s.h * f }
    liveScales[id] = s.s * f
  }
}

function endScale(commit: boolean) {
  if (!scaleGesture) return
  const { ids, ox, oy, factor } = scaleGesture
  for (const id of ids) {
    delete livePositions[id]
    delete liveSizes[id]
    delete liveScales[id]
  }
  scaleGesture = null
  if (commit && Math.abs(factor - 1) > 0.001) scaleItems(ids, factor, ox, oy)
}

const contentScale = (item: BoardItem) => Math.max(0.1, liveScales[item.id] ?? item.scale ?? 1)
/** El widget se dibuja a su tamaño natural y se escala entero, para que texto y controles crezcan junto con el grupo. */
function contentStyle(item: BoardItem) {
  const s = contentScale(item)
  const size = liveSizeOf(item)
  return { width: `${size.width / s}px`, height: `${size.height / s}px`, transform: s !== 1 ? `scale(${s})` : undefined, transformOrigin: '0 0' }
}

/** Cuánto vale el punto de pantalla dentro de coordenadas del tablero. */
function toBoardPoint(clientX: number, clientY: number) {
  const rect = wrapperRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return { x: (clientX - rect.left - panX.value) / zoom.value, y: (clientY - rect.top - panY.value) / zoom.value }
}

// --- pellizco táctil: escala el grupo/selección si ocurre sobre él; si no, hace zoom al tablero ---
const touchPts = new Map<number, { x: number; y: number }>()
let pinch: { mode: 'board' | 'items'; startDist: number; startZoom: number; startMidX: number; startMidY: number } | null = null

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Interrumpe cualquier arrastre en curso para que el pellizco tome el control sin saltos. */
function cancelGestures() {
  cancelLongPress()
  if (dragState) {
    delete livePositions[dragState.id]
    dragState = null
    window.removeEventListener('pointermove', onItemPointerMove)
    window.removeEventListener('pointerup', onItemPointerUp)
  }
  if (groupDrag) {
    for (const id of groupDrag.starts.keys()) delete livePositions[id]
    groupDrag = null
    window.removeEventListener('pointermove', onGroupPointerMove)
    window.removeEventListener('pointerup', onGroupPointerUp)
    window.removeEventListener('pointercancel', onGroupPointerUp)
  }
  if (resizeState) {
    delete liveSizes[resizeState.id]
    resizeState = null
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', onResizeEnd)
  }
  if (groupResize) {
    endScale(false)
    groupResize = null
    window.removeEventListener('pointermove', onGroupResizeMove)
    window.removeEventListener('pointerup', onGroupResizeEnd)
    window.removeEventListener('pointercancel', onGroupResizeEnd)
  }
  if (panState) onWrapperPointerUp({ pointerId: panState.pointerId } as PointerEvent)
  if (marquee.value) {
    marquee.value = null
    window.removeEventListener('pointermove', onMarqueeMove)
    window.removeEventListener('pointerup', onMarqueeUp)
    window.removeEventListener('pointercancel', onMarqueeUp)
  }
}

/** Clic derecho o del medio + arrastrar: siempre mueve el tablero (nunca un elemento), sin menú contextual ni autoscroll del navegador. */
function onPointerCapture(e: PointerEvent) {
  if (e.button === 2 || e.button === 1) {
    e.preventDefault()
    e.stopPropagation()
    startPan(e)
    return
  }
  if (e.pointerType !== 'touch') return
  touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (touchPts.size < 2) return
  e.stopPropagation()
  e.preventDefault()
  if (touchPts.size > 2 || pinch) return
  cancelGestures()
  const [a, b] = [...touchPts.values()] as [{ x: number; y: number }, { x: number; y: number }]
  const midX = (a.x + b.x) / 2
  const midY = (a.y + b.y) / 2
  pinch = { mode: 'board', startDist: distance(a, b) || 1, startZoom: zoom.value, startMidX: midX, startMidY: midY }

  const bounds = selectionBounds()
  const mid = toBoardPoint(midX, midY)
  const M = 24 / zoom.value
  if (bounds && mid.x >= bounds.minX - M && mid.x <= bounds.maxX + M && mid.y >= bounds.minY - M && mid.y <= bounds.maxY + M) {
    pinch.mode = 'items'
    beginScale(boxIds.value.length ? boxIds.value : selectionIds.value, (bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2)
  }
}

function onPointerTouchMove(e: PointerEvent) {
  if (!touchPts.has(e.pointerId)) return
  touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (!pinch || touchPts.size < 2) return
  const [a, b] = [...touchPts.values()] as [{ x: number; y: number }, { x: number; y: number }]
  const ratio = distance(a, b) / pinch.startDist
  if (pinch.mode === 'items') previewScale(ratio)
  else zoomAt(pinch.startMidX, pinch.startMidY, pinch.startZoom * ratio)
}

function onPointerTouchEnd(e: PointerEvent) {
  if (!touchPts.delete(e.pointerId)) return
  if (pinch && touchPts.size < 2) {
    if (pinch.mode === 'items') endScale(e.type !== 'pointercancel')
    pinch = null
  }
}

// --- arrastrar un elemento ---
let dragState: { id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null = null

function finishConnect(item: BoardItem) {
  if (connectFrom.value && connectFrom.value !== item.id) toggleLink(connectFrom.value, item.id)
  connectFrom.value = null
  setSelection([item.id])
}

/** Shift/Ctrl/Cmd o el modo seleccionar suman o quitan el elemento de la selección en vez de moverlo. */
function handleSelectClick(e: PointerEvent, item: BoardItem) {
  if (!(selectMode.value || e.shiftKey || e.ctrlKey || e.metaKey)) return false
  e.stopPropagation()
  e.preventDefault()
  toggleSelect(item)
  return true
}

function onItemPointerDown(e: PointerEvent, item: BoardItem) {
  e.stopPropagation()
  e.preventDefault()
  if (connectFrom.value) {
    finishConnect(item)
    return
  }
  if (handleSelectClick(e, item)) return
  if (isTouchOnUnselected(e, item)) {
    startPan(e, () => setSelection(expandGroups([item.id])))
    return
  }
  // Un elemento de un grupo (o ya seleccionado junto a otros) arrastra a todo el bloque.
  const block = multiSet.value.has(item.id) ? multiIds.value : expandGroups([item.id])
  if (block.length >= 2) {
    setSelection(block)
    startGroupDrag(e, block)
    return
  }
  setSelection([item.id])
  dragState = { id: item.id, startClientX: e.clientX, startClientY: e.clientY, startX: item.x, startY: item.y }
  window.addEventListener('pointermove', onItemPointerMove)
  window.addEventListener('pointerup', onItemPointerUp)
}

// Los widgets (notas, listas, etc.) tienen controles interactivos adentro (inputs, botones):
// solo se seleccionan al hacer pointerdown sobre ellos, y se arrastran desde su manija dedicada.
// Los stickers/imágenes no tienen contenido interactivo, así que toda la caja arrastra.
function onContainerPointerDown(e: PointerEvent, item: BoardItem) {
  if (isWidgetType(item.type)) {
    e.stopPropagation()
    if (connectFrom.value) {
      finishConnect(item)
      return
    }
    if (handleSelectClick(e, item)) return
    if (isTouchOnUnselected(e, item)) {
      startPan(e, () => setSelection(expandGroups([item.id])))
      return
    }
    if (!multiSet.value.has(item.id)) setSelection(expandGroups([item.id]))
    // Como en Canva: arrastrar en cualquier parte del widget lo mueve, también sobre su texto mientras no se esté
    // escribiendo en él (un clic sin mover entra a editar). Solo el campo que ya tiene el cursor y el área de dibujo
    // reservan el arrastre para seleccionar texto o dibujar (ahí se mueve con pulsación larga o con la manija).
    const field = textField(e.target)
    armLongPress(e, item, !isTextLike(e.target) || (!!field && !isEditing(field)))
    return
  }
  onItemPointerDown(e, item)
}

const textField = (target: EventTarget | null) =>
  ((target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]') as HTMLElement | null) ?? null

/** El campo ya tenía el cursor antes de presionar (en pointerdown el foco todavía no cambió). */
const isEditing = (field: HTMLElement) => field === document.activeElement || field.contains(document.activeElement)

const isTextLike = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return !!el?.closest?.('input, textarea, select, [contenteditable="true"]') || (!!el?.closest?.('svg') && !el?.closest?.('button'))
}

/** Widget sin seleccionar: el primer toque sobre su texto o dibujo solo lo selecciona (y lo arrastra), no lo edita ni dibuja. */
function onContainerCapture(e: PointerEvent, item: BoardItem) {
  if (!isWidgetType(item.type) || isSelected(item)) return
  if (connectFrom.value || selectMode.value || e.shiftKey || e.ctrlKey || e.metaKey) return
  if (!isTextLike(e.target)) return
  e.stopPropagation()
  e.preventDefault()
  if (isTouchOnUnselected(e, item)) {
    startPan(e, () => setSelection(expandGroups([item.id])))
    return
  }
  if (!multiSet.value.has(item.id)) setSelection(expandGroups([item.id]))
  armLongPress(e, item, true)
}

// Arrastrar un widget: al mover el dedo/cursor unos px (como en Canva), o al mantener presionado sin moverlo
// (para widgets ya seleccionados, cuyo texto se edita). Mueve el elemento, o todo su grupo/selección.
const LONG_PRESS_MS = 450
const LONG_PRESS_SLOP = 8
let longPress: { timer: ReturnType<typeof setTimeout> | null; pointerId: number; x: number; y: number; item: BoardItem; immediate: boolean } | null = null
/** Tras un long-press táctil el navegador quiere abrir su menú contextual; se suprime mientras se arrastra. */
let suppressContextMenu = false

function armLongPress(e: PointerEvent, item: BoardItem, immediate = false) {
  cancelLongPress()
  longPress = {
    pointerId: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    item,
    immediate,
    timer: immediate ? null : setTimeout(() => fireLongPress(false), LONG_PRESS_MS),
  }
  window.addEventListener('pointermove', onLongPressMove)
  window.addEventListener('pointerup', onLongPressEnd)
  window.addEventListener('pointercancel', onLongPressEnd)
}

function cancelLongPress() {
  if (!longPress) return
  if (longPress.timer) clearTimeout(longPress.timer)
  longPress = null
  window.removeEventListener('pointermove', onLongPressMove)
  window.removeEventListener('pointerup', onLongPressEnd)
  window.removeEventListener('pointercancel', onLongPressEnd)
}

function onLongPressMove(e: PointerEvent) {
  if (!longPress || e.pointerId !== longPress.pointerId) return
  if (Math.hypot(e.clientX - longPress.x, e.clientY - longPress.y) <= LONG_PRESS_SLOP) return
  // Con la pulsación larga, moverse antes de tiempo significa que se está escribiendo o seleccionando texto.
  if (longPress.immediate) fireLongPress(true)
  else cancelLongPress()
}

function onLongPressEnd(e: PointerEvent) {
  if (longPress && e.pointerId === longPress.pointerId) cancelLongPress()
}

function fireLongPress(immediate: boolean) {
  if (!longPress) return
  const { x, y, item } = longPress
  cancelLongPress()
  if (dragState || groupDrag || pinch) return
  const fake = { clientX: x, clientY: y, stopPropagation() {}, preventDefault() {} } as PointerEvent
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  window.getSelection()?.removeAllRanges()
  if (immediate) {
    // El clic que sigue a un arrastre no debe activar el botón sobre el que se empezó.
    const swallow = (ev: Event) => {
      ev.stopPropagation()
      ev.preventDefault()
    }
    window.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 400)
  } else navigator.vibrate?.(15)
  suppressContextMenu = true
  window.addEventListener('pointerup', () => setTimeout(() => (suppressContextMenu = false), 400), { once: true })
  const block = multiSet.value.has(item.id) ? multiIds.value : expandGroups([item.id])
  if (block.length >= 2) {
    setSelection(block)
    startGroupDrag(fake, block)
    return
  }
  setSelection([item.id])
  dragState = { id: item.id, startClientX: x, startClientY: y, startX: item.x, startY: item.y }
  window.addEventListener('pointermove', onItemPointerMove)
  window.addEventListener('pointerup', onItemPointerUp)
}

function onItemContextMenu(e: Event) {
  if (suppressContextMenu) e.preventDefault()
}

function onItemPointerMove(e: PointerEvent) {
  if (!dragState) return
  const dx = (e.clientX - dragState.startClientX) / zoom.value
  const dy = (e.clientY - dragState.startClientY) / zoom.value
  livePositions[dragState.id] = { x: dragState.startX + dx, y: dragState.startY + dy }
}

function onItemPointerUp() {
  if (dragState) {
    const pos = livePositions[dragState.id]
    if (pos) moveItem(dragState.id, pos.x, pos.y)
    delete livePositions[dragState.id]
  }
  dragState = null
  window.removeEventListener('pointermove', onItemPointerMove)
  window.removeEventListener('pointerup', onItemPointerUp)
}

// --- redimensionar un elemento ---
// Los stickers/imágenes mantienen proporción cuadrada al redimensionar; los widgets
// (notas, listas, etc.) se redimensionan libremente en ancho y alto.
let resizeState: { id: string; startClientX: number; startClientY: number; startWidth: number; startHeight: number; locked: boolean } | null = null

function onResizeStart(e: PointerEvent, item: BoardItem) {
  e.stopPropagation()
  e.preventDefault()
  resizeState = {
    id: item.id,
    startClientX: e.clientX,
    startClientY: e.clientY,
    startWidth: item.width,
    startHeight: item.height,
    locked: !isWidgetType(item.type),
  }
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd)
}

function onResizeMove(e: PointerEvent) {
  if (!resizeState) return
  const dx = (e.clientX - resizeState.startClientX) / zoom.value
  const dy = (e.clientY - resizeState.startClientY) / zoom.value
  if (resizeState.locked) {
    const d = Math.max(dx, dy)
    liveSizes[resizeState.id] = {
      width: Math.max(40, resizeState.startWidth + d),
      height: Math.max(40, resizeState.startHeight + d),
    }
  } else {
    liveSizes[resizeState.id] = {
      width: Math.max(160, resizeState.startWidth + dx),
      height: Math.max(60, resizeState.startHeight + dy),
    }
  }
}

function onResizeEnd() {
  if (resizeState) {
    const size = liveSizes[resizeState.id]
    if (size) resizeItem(resizeState.id, size.width, size.height)
    delete liveSizes[resizeState.id]
  }
  resizeState = null
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
}

function itemStyle(item: BoardItem) {
  const pos = livePositions[item.id] ?? item
  const size = liveSizes[item.id] ?? item
  const rotation = liveRotations[item.id] ?? item.rotation ?? 0
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
  }
}

// --- rotar un sticker o imagen arrastrando la manija de arriba ---
let rotateState: { id: string; centerX: number; centerY: number } | null = null

function angleTo(e: PointerEvent) {
  if (!rotateState) return 0
  const deg = (Math.atan2(e.clientY - rotateState.centerY, e.clientX - rotateState.centerX) * 180) / Math.PI + 90
  let angle = ((Math.round(deg) % 360) + 360) % 360
  // Imán suave a los ángulos "rectos" para poder dejar la imagen derecha sin esfuerzo.
  for (const target of [0, 45, 90, 135, 180, 225, 270, 315, 360]) {
    if (Math.abs(angle - target) <= 4) angle = target % 360
  }
  return angle
}

function onRotateStart(e: PointerEvent, item: BoardItem) {
  e.stopPropagation()
  e.preventDefault()
  const el = wrapperRef.value?.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`)
  if (!el) return
  const rect = el.getBoundingClientRect()
  rotateState = { id: item.id, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 }
  window.addEventListener('pointermove', onRotateMove)
  window.addEventListener('pointerup', onRotateEnd)
}

function onRotateMove(e: PointerEvent) {
  if (!rotateState) return
  liveRotations[rotateState.id] = angleTo(e)
}

function onRotateEnd() {
  if (rotateState) {
    const angle = liveRotations[rotateState.id]
    if (angle !== undefined) rotateItem(rotateState.id, angle)
    delete liveRotations[rotateState.id]
  }
  rotateState = null
  window.removeEventListener('pointermove', onRotateMove)
  window.removeEventListener('pointerup', onRotateEnd)
}

function rotateBy(item: BoardItem, deg: number) {
  rotateItem(item.id, (item.rotation ?? 0) + deg)
}

// --- agregar y abrir listas, libros y clientes existentes ---
function onPickRef(kind: BoardRefKind, id: string) {
  const center = viewportCenterBoard()
  const size = REF_DEFAULT_SIZE[kind]
  const offset = items.value.length % 6 * 18
  addItem({
    type: kind,
    refId: id,
    x: center.x - size.width / 2 + offset,
    y: center.y - size.height / 2 + offset,
    width: size.width,
    height: size.height,
  })
  showLinkPicker.value = false
}

function openRef(item: BoardItem) {
  if (!item.refId) return
  if (item.type === 'list') router.push(`/list/${item.refId}`)
  else if (item.type === 'book') router.push(`/books/${item.refId}`)
  else if (item.type === 'client') router.push('/clientes')
}

// --- plantillas: se agregan en bloque y se acomodan juntas antes de soltarlas ---
function onPickTemplate(template: BoardTemplate) {
  const specs = template.build()
  const minX = Math.min(...specs.map((i) => i.x))
  const minY = Math.min(...specs.map((i) => i.y))
  const maxX = Math.max(...specs.map((i) => i.x + i.width))
  const maxY = Math.max(...specs.map((i) => i.y + i.height))
  let center = viewportCenterBoard()

  // Si no cabe en pantalla, se aleja el zoom para verla completa.
  if (wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect()
    const fit = Math.min((rect.width * 0.9) / (maxX - minX), (rect.height * 0.78) / (maxY - minY))
    if (fit < zoom.value) {
      zoom.value = clampZoom(fit)
      panX.value = rect.width / 2 - center.x * zoom.value
      panY.value = rect.height / 2 - center.y * zoom.value
      center = viewportCenterBoard()
    }
  }

  const dx = center.x - (minX + maxX) / 2
  const dy = center.y - (minY + maxY) / 2
  addGroup(specs.map((i) => ({ ...i, x: i.x + dx, y: i.y + dy })))
  selectedId.value = null
  connectFrom.value = null
  showTemplatePicker.value = false
}

const templateItems = computed(() => (editingGroup.value ? visibleItems.value.filter((i) => i.groupId === editingGroup.value) : []))
/** Elementos que forman el bloque con caja: la plantilla que se acomoda o la selección múltiple. */
const boxItems = computed(() => (editingGroup.value ? templateItems.value : visibleItems.value.filter((i) => multiSet.value.has(i.id))))
const boxIds = computed(() => boxItems.value.map((i) => i.id))

function boundsOf(list: BoardItem[]) {
  if (!list.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const item of list) {
    const pos = livePosOf(item)
    const size = liveSizeOf(item)
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + size.width)
    maxY = Math.max(maxY, pos.y + size.height)
  }
  return { minX, minY, maxX, maxY }
}

const groupBounds = computed(() => boundsOf(boxItems.value))
const GROUP_PAD = 14

const groupBox = computed(() => {
  const b = groupBounds.value
  if (!b) return null
  return { left: b.minX - GROUP_PAD, top: b.minY - GROUP_PAD, width: b.maxX - b.minX + GROUP_PAD * 2, height: b.maxY - b.minY + GROUP_PAD * 2 }
})

/** Caja de lo seleccionado (bloque, o el único elemento) para saber si un pellizco cae sobre él. */
function selectionBounds() {
  return boundsOf(visibleItems.value.filter((i) => (boxIds.value.length ? boxIds.value : selectionIds.value).includes(i.id)))
}

let groupDrag: { ids: string[]; startClientX: number; startClientY: number; starts: Map<string, { x: number; y: number }>; dx: number; dy: number } | null = null

function startGroupDrag(e: PointerEvent, ids: string[]) {
  e.stopPropagation()
  e.preventDefault()
  groupDrag = {
    ids,
    startClientX: e.clientX,
    startClientY: e.clientY,
    starts: new Map(items.value.filter((i) => ids.includes(i.id)).map((i) => [i.id, { x: i.x, y: i.y }])),
    dx: 0,
    dy: 0,
  }
  window.addEventListener('pointermove', onGroupPointerMove)
  window.addEventListener('pointerup', onGroupPointerUp)
  window.addEventListener('pointercancel', onGroupPointerUp)
}

function onGroupPointerDown(e: PointerEvent) {
  selectedId.value = null
  startGroupDrag(e, boxIds.value)
}

function onGroupPointerMove(e: PointerEvent) {
  if (!groupDrag) return
  groupDrag.dx = (e.clientX - groupDrag.startClientX) / zoom.value
  groupDrag.dy = (e.clientY - groupDrag.startClientY) / zoom.value
  for (const [id, start] of groupDrag.starts) livePositions[id] = { x: start.x + groupDrag.dx, y: start.y + groupDrag.dy }
}

function onGroupPointerUp() {
  if (groupDrag) {
    if (groupDrag.dx || groupDrag.dy) moveItems(groupDrag.ids, groupDrag.dx, groupDrag.dy)
    for (const id of groupDrag.starts.keys()) delete livePositions[id]
  }
  groupDrag = null
  window.removeEventListener('pointermove', onGroupPointerMove)
  window.removeEventListener('pointerup', onGroupPointerUp)
  window.removeEventListener('pointercancel', onGroupPointerUp)
}

// Esquina del bloque: arrastrarla lo agranda o lo achica todo en proporción, desde su esquina superior izquierda.
let groupResize: { startClientX: number; startClientY: number; width: number; height: number } | null = null

function onGroupResizeStart(e: PointerEvent) {
  e.stopPropagation()
  e.preventDefault()
  const b = groupBounds.value
  if (!b) return
  groupResize = { startClientX: e.clientX, startClientY: e.clientY, width: Math.max(1, b.maxX - b.minX), height: Math.max(1, b.maxY - b.minY) }
  beginScale(boxIds.value, b.minX, b.minY)
  window.addEventListener('pointermove', onGroupResizeMove)
  window.addEventListener('pointerup', onGroupResizeEnd)
  window.addEventListener('pointercancel', onGroupResizeEnd)
}

function onGroupResizeMove(e: PointerEvent) {
  if (!groupResize) return
  const dx = (e.clientX - groupResize.startClientX) / zoom.value
  const dy = (e.clientY - groupResize.startClientY) / zoom.value
  previewScale(Math.max((groupResize.width + dx) / groupResize.width, (groupResize.height + dy) / groupResize.height))
}

function onGroupResizeEnd() {
  endScale(true)
  groupResize = null
  window.removeEventListener('pointermove', onGroupResizeMove)
  window.removeEventListener('pointerup', onGroupResizeEnd)
  window.removeEventListener('pointercancel', onGroupResizeEnd)
}

function finishTemplate() {
  if (!editingGroup.value) return
  const ids = boxIds.value
  ungroup(editingGroup.value)
  // Queda seleccionada como bloque para poder moverla o escalarla enseguida.
  setSelection(ids)
}

function discardTemplate() {
  if (editingGroup.value) removeGroup(editingGroup.value)
}

// --- agregar sticker, nota, lista, etc. ---
function onPick(type: StickerType | BoardItemType, data: Record<string, any>) {
  const center = viewportCenterBoard()
  if (type === 'image') {
    addItem({ type: 'image', src: data.src, label: data.label, x: center.x - 60, y: center.y - 60, width: 120, height: 120 })
  } else {
    const size = WIDGET_DEFAULT_SIZE[type as BoardItemType] ?? { width: 260, height: 180 }
    addItem({
      type: type as BoardItemType,
      data,
      x: center.x - size.width / 2,
      y: center.y - size.height / 2,
      width: size.width,
      height: size.height,
    })
  }
  showStickerPicker.value = false
}

// --- paleta de comandos (Ctrl+K): busca entre todos los stickers, widgets y plantillas para agregarlos ---
type PaletteItem = { id: string; label: string; subtitle?: string; emoji?: string; image?: string }

const paletteActions: Record<string, () => void> = {}
const paletteItems: PaletteItem[] = (() => {
  const items: PaletteItem[] = []
  const pushOption = (opt: StickerOption, subtitle: string) => {
    const id = `s:${items.length}`
    items.push({ id, label: opt.label, subtitle, emoji: opt.emoji, image: opt.image })
    paletteActions[id] = () => onPick(opt.type, opt.data)
  }
  STICKER_OPTIONS.forEach((o) => pushOption(o, 'Elementos'))
  BANNER_OPTIONS.forEach((o) => pushOption(o, 'Encabezados de sección'))
  BUSINESS_OPTIONS.forEach((o) => pushOption(o, 'Negocio'))
  BOARD_ONLY_OPTIONS.forEach((o) => pushOption(o, 'Tablero'))
  TRACKER_OPTIONS.forEach((o) => pushOption(o, 'Seguimiento del día'))
  LANGUAGE_OPTIONS.forEach((o) => pushOption(o, 'Estudio de idiomas'))
  DECOR_OPTIONS.forEach((o) => pushOption(o, 'Decoración scrapbook'))
  STICKER_IMAGE_OPTIONS.forEach((o) => pushOption(o, o.category))
  BOARD_TEMPLATES.forEach((t) => {
    const id = `t:${t.id}`
    items.push({ id, label: `${t.emoji} ${t.label}`, subtitle: `Plantilla · ${t.blurb}` })
    paletteActions[id] = () => onPickTemplate(t)
  })
  return items
})()

function onPalettePick(id: string) {
  paletteActions[id]?.()
  showCommandPalette.value = false
}

// --- agregar imagen propia ---
function openFilePicker() {
  fileInputRef.value?.click()
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  files.forEach((file, i) => {
    if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_BYTES) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const center = viewportCenterBoard()
      addItem({ type: 'image', src: reader.result, label: file.name, x: center.x - 80 + i * 20, y: center.y - 80 + i * 20, width: 160, height: 160 })
    }
    reader.readAsDataURL(file)
  })
  input.value = ''
}

// --- pegar imagen desde el portapapeles (Ctrl+V) ---
function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  const imageFiles: File[] = []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }
  if (!imageFiles.length) return
  e.preventDefault()
  imageFiles.forEach((file, i) => {
    if (file.size > MAX_IMAGE_BYTES) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const center = viewportCenterBoard()
      addItem({ type: 'image', src: reader.result, label: file.name || 'Imagen pegada', x: center.x - 80 + i * 20, y: center.y - 80 + i * 20, width: 160, height: 160 })
    }
    reader.readAsDataURL(file)
  })
}

// --- atajo de teclado "T": agrega un campo de texto donde está el mouse ---
const lastPointerClient = { x: 0, y: 0 }
function trackPointerPosition(e: PointerEvent) {
  lastPointerClient.x = e.clientX
  lastPointerClient.y = e.clientY
}

function boardPointFromClient(clientX: number, clientY: number) {
  if (!wrapperRef.value) return { x: 0, y: 0 }
  const rect = wrapperRef.value.getBoundingClientRect()
  return {
    x: (clientX - rect.left - panX.value) / zoom.value,
    y: (clientY - rect.top - panY.value) / zoom.value,
  }
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function anyOverlayOpen() {
  return (
    showStickerPicker.value ||
    showLinkPicker.value ||
    showTemplatePicker.value ||
    showPatternPicker.value ||
    showCommandPalette.value ||
    !!colorPickerTarget.value ||
    !!fontPickerTarget.value ||
    !!editingGroup.value
  )
}

function handleUndo() {
  clearSelection()
  connectFrom.value = null
  undo()
}

function handleRedo() {
  clearSelection()
  connectFrom.value = null
  redo()
}

function onKeyDown(e: KeyboardEvent) {
  const ctrlOrCmd = e.ctrlKey || e.metaKey
  const key = e.key.toLowerCase()

  if (ctrlOrCmd && (key === 'z' || key === 'y') && !isTypingTarget(e.target)) {
    e.preventDefault()
    if (key === 'y' || (key === 'z' && e.shiftKey)) handleRedo()
    else handleUndo()
    return
  }

  if (ctrlOrCmd && key === 'k') {
    e.preventDefault()
    if (showCommandPalette.value) {
      showCommandPalette.value = false
    } else if (!anyOverlayOpen()) {
      showCommandPalette.value = true
    }
    return
  }

  if (key !== 't' || ctrlOrCmd || e.altKey) return
  if (isTypingTarget(e.target) || anyOverlayOpen()) return
  e.preventDefault()
  const point = boardPointFromClient(lastPointerClient.x, lastPointerClient.y)
  const size = WIDGET_DEFAULT_SIZE.text!
  const id = addItem({ type: 'text', data: {}, x: point.x - size.width / 2, y: point.y - size.height / 2, width: size.width, height: size.height })
  setSelection([id])
  nextTick(() => {
    wrapperRef.value?.querySelector<HTMLTextAreaElement>(`[data-item-id="${id}"] textarea`)?.focus()
  })
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerTouchMove)
  window.addEventListener('pointerup', onPointerTouchEnd)
  window.addEventListener('pointercancel', onPointerTouchEnd)
  window.addEventListener('paste', onPaste)
  window.addEventListener('pointermove', trackPointerPosition)
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  cancelLongPress()
  window.removeEventListener('pointermove', onPointerTouchMove)
  window.removeEventListener('pointerup', onPointerTouchEnd)
  window.removeEventListener('pointercancel', onPointerTouchEnd)
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('pointermove', trackPointerPosition)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('pointermove', onMarqueeMove)
  window.removeEventListener('pointerup', onMarqueeUp)
  window.removeEventListener('pointercancel', onMarqueeUp)
  window.removeEventListener('pointermove', onGroupResizeMove)
  window.removeEventListener('pointerup', onGroupResizeEnd)
  window.removeEventListener('pointercancel', onGroupResizeEnd)
  window.removeEventListener('pointermove', onWrapperPointerMove)
  window.removeEventListener('pointerup', onWrapperPointerUp)
  window.removeEventListener('pointercancel', onWrapperPointerUp)
  window.removeEventListener('pointermove', onItemPointerMove)
  window.removeEventListener('pointerup', onItemPointerUp)
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
  window.removeEventListener('pointermove', onRotateMove)
  window.removeEventListener('pointerup', onRotateEnd)
  window.removeEventListener('pointermove', onGroupPointerMove)
  window.removeEventListener('pointerup', onGroupPointerUp)
  window.removeEventListener('pointercancel', onGroupPointerUp)
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative w-full h-full overflow-hidden touch-none select-none"
    :style="{ backgroundColor: boardColor }"
    @pointerdown.capture="onPointerCapture"
    @pointerdown="onWrapperPointerDown"
    @wheel="onWheel"
    @contextmenu.prevent
  >
    <div class="absolute inset-0" :style="boardPatternStyle" />

    <div class="absolute top-0 left-0" :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }">
      <svg class="absolute top-0 left-0 overflow-visible pointer-events-none" width="1" height="1">
        <line
          v-for="line in linkLines"
          :key="line.id"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="#ee8fb5"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="1 7"
        />
        <line
          v-for="line in linkLines"
          :key="`${line.id}-solid`"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="#ee8fb5"
          stroke-opacity="0.55"
          stroke-width="1.5"
        />
      </svg>

      <button
        v-for="line in linkLines.filter(showLinkRemove)"
        :key="`${line.id}-x`"
        type="button"
        class="absolute z-30 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/55 hover:text-danger"
        :style="{ left: `${(line.x1 + line.x2) / 2}px`, top: `${(line.y1 + line.y2) / 2}px` }"
        title="Quitar unión"
        @pointerdown.stop
        @click="removeLink(line.id)"
      >
        <AppIcon name="x" :size="12" />
      </button>

      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="absolute"
        :data-item-id="item.id"
        :class="[isSelected(item) ? 'z-20' : 'z-0', isWidgetType(item.type) ? '' : 'cursor-grab active:cursor-grabbing']"
        :style="itemStyle(item)"
        @pointerdown.capture="onContainerCapture($event, item)"
        @pointerdown="onContainerPointerDown($event, item)"
        @contextmenu="onItemContextMenu"
      >
        <img
          v-if="!isWidgetType(item.type) && !isRefType(item.type)"
          :src="item.src"
          :alt="item.label || 'Elemento'"
          class="w-full h-full object-contain pointer-events-none drop-shadow-md"
          draggable="false"
        />
        <div v-else :style="contentStyle(item)">
          <BoardRefCard
            v-if="isRefType(item.type)"
            :kind="item.type as BoardRefKind"
            :ref-id="item.refId ?? ''"
            class="pointer-events-none"
          />
          <component
            :is="componentMap[item.type]"
            v-else
            :data="item.data ?? {}"
            class="h-full"
            :class="item.data?.bare ? 'widget-bare' : ''"
            :style="{ fontFamily: fontFamilyFor(item.data?.font), '--bare-ink': bareInk }"
            @update="(d: Record<string, any>) => updateItemData(item.id, d)"
            @remove="removeItem(item.id)"
          />
        </div>

        <div
          v-if="isSelected(item) || connectFrom === item.id"
          class="absolute inset-0 rounded-md ring-2 pointer-events-none"
          :class="connectFrom === item.id ? 'ring-amber-300' : 'ring-accent'"
        />

        <button
          v-if="isWidgetType(item.type) && selectedId === item.id"
          type="button"
          class="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50 cursor-grab active:cursor-grabbing touch-none"
          title="Mover"
          @pointerdown="onItemPointerDown($event, item)"
        >
          <AppIcon name="move" :size="14" />
        </button>

        <button
          v-if="!isWidgetType(item.type) && selectedId === item.id"
          type="button"
          class="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50"
          @pointerdown.stop
          @click="removeItem(item.id)"
        >
          <AppIcon name="x" :size="14" />
        </button>

        <button
          v-if="isWidgetType(item.type) && selectedId === item.id"
          type="button"
          class="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50"
          title="Color"
          @pointerdown.stop
          @click="openItemColorPicker(item.id)"
        >
          <AppIcon name="palette" :size="14" />
        </button>

        <button
          v-if="isWidgetType(item.type) && selectedId === item.id"
          type="button"
          class="absolute -top-3 right-[3.25rem] w-7 h-7 rounded-full shadow border border-border flex items-center justify-center"
          :class="item.data?.bare ? 'bg-accent text-white' : 'bg-white text-black/50'"
          :title="item.data?.bare ? 'Mostrar fondo' : 'Quitar fondo (solo texto)'"
          @pointerdown.stop
          @click="updateItemData(item.id, { bare: !item.data?.bare })"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="3" /></svg>
        </button>

        <button
          v-if="isWidgetType(item.type) && selectedId === item.id"
          type="button"
          class="absolute -top-3 right-5 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50 text-xs font-bold"
          title="Tipo de letra"
          @pointerdown.stop
          @click="fontPickerTarget = item.id"
        >
          Aa
        </button>

        <button
          v-if="selectedId === item.id"
          type="button"
          class="absolute -bottom-3 -left-3 w-7 h-7 rounded-full shadow border border-border flex items-center justify-center"
          :class="connectFrom === item.id ? 'bg-amber-300 text-black/70' : 'bg-white text-black/50'"
          title="Conectar con otro elemento"
          @pointerdown.stop
          @click="startConnect(item.id)"
        >
          <AppIcon name="link" :size="14" />
        </button>

        <button
          v-if="selectedId === item.id && isRefType(item.type)"
          type="button"
          class="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50"
          title="Abrir"
          @pointerdown.stop
          @click="openRef(item)"
        >
          <AppIcon name="arrow-left" :size="14" class="rotate-180" />
        </button>

        <template v-if="selectedId === item.id && isRotatable(item)">
          <div class="absolute left-1/2 -top-8 w-px h-5 bg-accent pointer-events-none" />
          <button
            type="button"
            class="absolute left-1/2 -top-11 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/55 cursor-grab active:cursor-grabbing touch-none"
            title="Arrastra para rotar (doble clic: enderezar)"
            @pointerdown="onRotateStart($event, item)"
            @dblclick.stop="rotateItem(item.id, 0)"
          >
            <AppIcon name="rotate" :size="14" />
          </button>
          <button
            type="button"
            class="absolute -top-3 right-6 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50 text-[10px] font-bold"
            title="Girar 90°"
            @pointerdown.stop
            @click="rotateBy(item, 90)"
          >
            90°
          </button>
        </template>

        <div
          v-if="selectedId === item.id"
          class="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent border-2 border-white cursor-nwse-resize"
          @pointerdown="onResizeStart($event, item)"
        />
      </div>

      <div
        v-if="groupBox"
        class="absolute z-40 rounded-2xl border-2 border-dashed border-accent"
        :class="editingGroup ? 'bg-accent/5 cursor-move touch-none' : 'pointer-events-none'"
        :style="{ left: `${groupBox.left}px`, top: `${groupBox.top}px`, width: `${groupBox.width}px`, height: `${groupBox.height}px` }"
        @pointerdown="editingGroup && onGroupPointerDown($event)"
      >
        <template v-if="!editingGroup">
          <button
            type="button"
            class="pointer-events-auto absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-black/50 cursor-grab active:cursor-grabbing touch-none"
            title="Mover todo el grupo"
            @pointerdown="startGroupDrag($event, boxIds)"
          >
            <AppIcon name="move" :size="14" />
          </button>
        </template>
        <div
          class="pointer-events-auto absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-accent border-2 border-white cursor-nwse-resize touch-none"
          title="Arrastra para agrandar o achicar todo"
          @pointerdown="onGroupResizeStart"
        />
      </div>
    </div>

    <div
      v-if="marquee"
      class="absolute z-30 border border-accent bg-accent/10 pointer-events-none"
      :style="{ left: `${Math.min(marquee.x1, marquee.x2)}px`, top: `${Math.min(marquee.y1, marquee.y2)}px`, width: `${Math.abs(marquee.x2 - marquee.x1)}px`, height: `${Math.abs(marquee.y2 - marquee.y1)}px` }"
    />

    <div
      v-if="!editingGroup && multiIds.length >= 2"
      class="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-surface/95 backdrop-blur border border-accent rounded-full pl-4 pr-1.5 py-1.5 shadow-lg max-w-[calc(100%-1.5rem)]"
      @pointerdown.stop
    >
      <span class="text-xs font-semibold text-ink whitespace-nowrap">{{ multiIds.length }} elementos</span>
      <button v-if="!allSameGroup" type="button" class="h-8 px-3 rounded-full bg-accent text-white text-xs font-bold" @click="groupSelection">Agrupar</button>
      <button v-if="anyGrouped" type="button" class="h-8 px-3 rounded-full bg-surface-soft text-ink text-xs font-bold" @click="ungroupSelection">Desagrupar</button>
      <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-surface-soft" title="Borrar selección" @click="deleteSelection">
        <AppIcon name="trash" :size="15" />
      </button>
      <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" title="Quitar selección" @click="clearSelection">
        <AppIcon name="x" :size="15" />
      </button>
    </div>

    <div
      v-if="editingGroup && groupBox"
      class="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-surface/95 backdrop-blur border border-accent rounded-full pl-4 pr-1.5 py-1.5 shadow-lg max-w-[calc(100%-1.5rem)]"
      @pointerdown.stop
    >
      <span class="text-xs font-semibold text-ink hidden sm:inline">Arrastra para mover · pellizca o usa la esquina para cambiar el tamaño</span>
      <span class="text-xs font-semibold text-ink sm:hidden">Mueve · pellizca para escalar</span>
      <button type="button" class="h-8 px-3 rounded-full bg-accent text-white text-xs font-bold" @click="finishTemplate">Listo ✓</button>
      <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-surface-soft" title="Quitar la plantilla" @click="discardTemplate">
        <AppIcon name="trash" :size="15" />
      </button>
    </div>

    <div
      v-if="connectFrom"
      class="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-300 text-black/75 text-xs font-semibold rounded-full px-4 py-2 shadow-lg pointer-events-none"
    >
      Toca otro elemento para unirlo (o toca el fondo para cancelar)
    </div>

    <div v-if="!visibleItems.length" class="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
      <p class="text-muted text-sm text-center max-w-xs">
        Este tablero está vacío.<br />
        Arrastra para moverte, usa la rueda (o pellizca) para hacer zoom, y agrega stickers, notas, listas de tareas o imágenes.
      </p>
    </div>

    <div
      class="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface/95 backdrop-blur border border-border rounded-full px-2 py-1.5 shadow-lg z-30"
      @pointerdown.stop
    >
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" title="Alejar" @click="zoomButton(1 / 1.25)">
        <AppIcon name="zoom-out" :size="17" />
      </button>
      <span class="text-xs text-muted w-10 text-center tabular-nums">{{ Math.round(zoom * 100) }}%</span>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" title="Acercar" @click="zoomButton(1.25)">
        <AppIcon name="zoom-in" :size="17" />
      </button>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" title="Restablecer vista" @click="resetView">
        <AppIcon name="target" :size="16" />
      </button>

      <div class="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
        title="Deshacer (Ctrl+Z)"
        :disabled="!canUndo"
        @click="handleUndo"
      >
        <AppIcon name="undo" :size="17" />
      </button>
      <button
        type="button"
        class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
        title="Rehacer (Ctrl+Y)"
        :disabled="!canRedo"
        @click="handleRedo"
      >
        <AppIcon name="redo" :size="17" />
      </button>

      <div class="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        :class="selectMode ? 'bg-accent text-white' : 'text-muted hover:text-ink hover:bg-surface-soft'"
        title="Seleccionar varios (o Shift + clic / arrastrar)"
        @click="selectMode = !selectMode"
      >
        <AppIcon name="select" :size="17" />
      </button>

      <div class="w-px h-6 bg-border mx-1" />

      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" title="Color de fondo" @click="openBoardColorPicker">
        <AppIcon name="palette" :size="17" />
      </button>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft" title="Patrón de fondo (puntos, renglones, cuadrícula...)" @click="showPatternPicker = true">
        <AppIcon name="paper" :size="17" />
      </button>

      <div class="w-px h-6 bg-border mx-1" />

      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-accent-deep bg-accent-soft hover:bg-accent hover:text-white transition-colors" title="Agregar sticker, nota o lista" @click="showStickerPicker = true">
        <AppIcon name="sticker" :size="17" />
      </button>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-accent-deep bg-accent-soft hover:bg-accent hover:text-white transition-colors" title="Plantillas" @click="showTemplatePicker = true">
        <AppIcon name="template" :size="17" />
      </button>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-accent-deep bg-accent-soft hover:bg-accent hover:text-white transition-colors" title="Agregar una lista, libro o cliente existente" @click="showLinkPicker = true">
        <AppIcon name="nodes" :size="17" />
      </button>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-accent-deep bg-accent-soft hover:bg-accent hover:text-white transition-colors" title="Agregar imagen" @click="openFilePicker">
        <AppIcon name="image" :size="17" />
      </button>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center text-accent-deep bg-accent-soft hover:bg-accent hover:text-white transition-colors" title="Buscar y agregar (Ctrl+K)" @click="showCommandPalette = true">
        <AppIcon name="search" :size="17" />
      </button>
    </div>

    <input ref="fileInputRef" type="file" accept="image/*" multiple class="hidden" @change="onFilesSelected" />

    <div v-if="showStickerPicker" @pointerdown.stop>
      <StickerPicker board @close="showStickerPicker = false" @pick="onPick" />
    </div>

    <div v-if="showTemplatePicker" @pointerdown.stop>
      <BoardTemplatePicker @close="showTemplatePicker = false" @pick="onPickTemplate" />
    </div>

    <div v-if="showLinkPicker" @pointerdown.stop>
      <BoardLinkPicker @close="showLinkPicker = false" @pick="onPickRef" />
    </div>

    <div v-if="showCommandPalette" @pointerdown.stop>
      <BoardCommandPalette :items="paletteItems" @close="showCommandPalette = false" @pick="onPalettePick" />
    </div>

    <div v-if="fontPickerTarget" @pointerdown.stop>
      <FontPickerPopover
        :model-value="fontPickerValue"
        @update:model-value="(font: string) => updateItemData(fontPickerTarget!, { font })"
        @close="fontPickerTarget = null"
      />
    </div>

    <div v-if="colorPickerTarget" @pointerdown.stop>
      <ColorPickerPopover
        :title="colorPickerTitle"
        :model-value="colorPickerValue"
        :presets="colorPickerPresets"
        @update:model-value="onColorUpdate"
        @close="colorPickerTarget = null"
      />
    </div>

    <div v-if="showPatternPicker" @pointerdown.stop>
      <BoardPatternPicker
        :model-value="boardPattern"
        :preview-color="gridDotColor"
        :preview-bg="boardColor"
        :opacity="patternOpacity"
        @pick="(p) => { setBoardPattern(p); showPatternPicker = false }"
        @opacity="setPatternOpacity"
        @close="showPatternPicker = false"
      />
    </div>
  </div>
</template>

<style>
/* Widget sin fondo: solo queda el texto, con un color legible sobre el tablero. */
.widget-bare,
.widget-bare .sticky-note {
  background: transparent !important;
  box-shadow: none !important;
  clip-path: none !important;
}
.widget-bare .sticky-note-fold,
.widget-bare > span.pointer-events-none {
  display: none !important;
}
.widget-bare :is(input, textarea, p, span:not(.pointer-events-none)) {
  color: var(--bare-ink) !important;
}
.widget-bare :is(input, textarea)::placeholder {
  color: var(--bare-ink) !important;
  opacity: 0.4;
}
</style>
