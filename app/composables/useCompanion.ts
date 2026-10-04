import { toDateKey, fromDateKey } from '~/utils/calendarDate'
import { RECIPES, recipeEffect, recipeProgress } from '~/utils/cafeRecipes'

export type CompanionCharacter = {
  id: string
  label: string
  sprite: string
  frames: number
  frameWidth: number
  frameHeight: number
  available: boolean
}

export const COMPANION_CHARACTERS: CompanionCharacter[] = [
  {
    id: 'mapache',
    label: 'Mapachín',
    sprite: '/sprints/mapachin/mapache-sprite.png',
    frames: 8,
    frameWidth: 193,
    frameHeight: 178,
    available: true,
  },
  { id: 'proximo-1', label: 'Próximamente', sprite: '', frames: 1, frameWidth: 1, frameHeight: 1, available: false },
  { id: 'proximo-2', label: 'Próximamente', sprite: '', frames: 1, frameWidth: 1, frameHeight: 1, available: false },
]

/** Hojas de animación de Mapachín (fondo transparente, frames iguales en una fila). */
const anim = (name: string, frames: number, w: number, h: number): CompanionCharacter => ({
  id: name, label: name, sprite: `/sprints/mapachin/${name}.png`, frames, frameWidth: w / frames, frameHeight: h, available: true,
})
export const MAPACHIN_ANIMS = {
  welcome: anim('welcome-mapachin', 7, 2170, 296),
  punch: anim('punch-mapachin', 9, 2610, 254),
  abandoned: anim('mapachin-abandoned', 9, 2295, 236),
}

export type CompanionItem = {
  id: string
  label: string
  emoji: string
  kind: 'food' | 'drink'
  cost: number
  restore: number
  xp: number
}

export const COMPANION_ITEMS: CompanionItem[] = [
  { id: 'agua', label: 'Agua', emoji: '💧', kind: 'drink', cost: 3, restore: 20, xp: 3 },
  { id: 'jugo', label: 'Jugo', emoji: '🧃', kind: 'drink', cost: 8, restore: 40, xp: 10 },
  { id: 'batido', label: 'Batido', emoji: '🥤', kind: 'drink', cost: 15, restore: 70, xp: 22 },
  { id: 'manzana', label: 'Manzana', emoji: '🍎', kind: 'food', cost: 5, restore: 15, xp: 5 },
  { id: 'carne', label: 'Carne', emoji: '🍖', kind: 'food', cost: 12, restore: 40, xp: 15 },
  { id: 'pastel', label: 'Pastel', emoji: '🍰', kind: 'food', cost: 20, restore: 60, xp: 30 },
]

export type ClothingSlot = 'hat' | 'face' | 'neck' | 'hand'

export type CompanionClothing = {
  id: string
  label: string
  emoji: string
  slot: ClothingSlot
  cost: number
}

export const CLOTHING_SLOTS: { id: ClothingSlot; label: string }[] = [
  { id: 'hat', label: 'Cabeza' },
  { id: 'face', label: 'Cara' },
  { id: 'neck', label: 'Cuello' },
  { id: 'hand', label: 'Mano' },
]

export const COMPANION_CLOTHES: CompanionClothing[] = [
  { id: 'gorra', label: 'Gorra', emoji: '🧢', slot: 'hat', cost: 25 },
  { id: 'sombrero', label: 'Sombrero', emoji: '🎩', slot: 'hat', cost: 40 },
  { id: 'corona', label: 'Corona', emoji: '👑', slot: 'hat', cost: 120 },
  { id: 'gafas', label: 'Gafas', emoji: '👓', slot: 'face', cost: 30 },
  { id: 'sol', label: 'Gafas de sol', emoji: '🕶️', slot: 'face', cost: 45 },
  { id: 'bufanda', label: 'Bufanda', emoji: '🧣', slot: 'neck', cost: 35 },
  { id: 'corbata', label: 'Corbatín', emoji: '🎀', slot: 'neck', cost: 30 },
  { id: 'medalla', label: 'Medalla', emoji: '🏅', slot: 'neck', cost: 80 },
  { id: 'paraguas', label: 'Paraguas', emoji: '🌂', slot: 'hand', cost: 50 },
  { id: 'varita', label: 'Varita', emoji: '🪄', slot: 'hand', cost: 90 },
]

/** Puntos ganados por cada tarea completada. */
export const POINTS_PER_TASK = 5
/** Minutos que tarda en bajar 1 punto de hambre/sed. */
const DECAY_MINUTES = 6

type CompanionData = {
  userName: string
  companionName: string
  characterId: string
  xp: number
  level: number
  streak: number
  longestStreak: number
  lastCompletionDateKey: string | null
  points: number
  hunger: number
  thirst: number
  needsUpdatedAt: number
  totalCompleted: number
  ownedClothes: string[]
  equipped: Partial<Record<ClothingSlot, string>>
}

const STORAGE_KEY = 'todo-companion-v1'
const BONUS_KEY = 'todo-companion-bonus-160'
const GIFT_KEY = 'todo-companion-gift-5000'

const userName = ref('')
const companionName = ref('')
const characterId = ref<string | null>(null)
const xp = ref(0)
const level = ref(1)
const streak = ref(0)
const longestStreak = ref(0)
const lastCompletionDateKey = ref<string | null>(null)
/** Monedas iniciales al crear el compañero. */
const STARTING_POINTS = 500
const points = ref(STARTING_POINTS)
/** 0–100: saciedad de comida. */
const hunger = ref(80)
/** 0–100: saciedad de bebida. */
const thirst = ref(80)
const needsUpdatedAt = ref(Date.now())
/** Tareas completadas de por vida (no baja si se borran tareas); alimenta las recetas del café. */
const totalCompleted = ref(0)
const ownedClothes = ref<string[]>([])
const equipped = ref<Partial<Record<ClothingSlot, string>>>({})
/** Transitorio (no se persiste): nivel recién alcanzado, para mostrar una celebración. */
const lastLevelUp = ref<number | null>(null)
let loaded = false

/** XP necesaria para pasar del nivel `level` al siguiente. */
export function xpThreshold(lvl: number) {
  return 50 + (lvl - 1) * 25
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/** Baja hambre/sed según el tiempo transcurrido desde la última actualización. */
function applyDecay() {
  const now = Date.now()
  const steps = Math.floor((now - needsUpdatedAt.value) / (DECAY_MINUTES * 60000))
  if (steps > 0) {
    hunger.value = clamp(hunger.value - steps)
    thirst.value = clamp(thirst.value - steps)
    needsUpdatedAt.value += steps * DECAY_MINUTES * 60000
  }
}

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as Partial<CompanionData>
      if (typeof data.userName === 'string') userName.value = data.userName
      if (typeof data.companionName === 'string') companionName.value = data.companionName
      if (typeof data.characterId === 'string') characterId.value = data.characterId
      xp.value = typeof data.xp === 'number' ? data.xp : 0
      level.value = typeof data.level === 'number' && data.level >= 1 ? data.level : 1
      streak.value = typeof data.streak === 'number' ? data.streak : 0
      longestStreak.value = typeof data.longestStreak === 'number' ? data.longestStreak : 0
      lastCompletionDateKey.value = typeof data.lastCompletionDateKey === 'string' ? data.lastCompletionDateKey : null
      points.value = typeof data.points === 'number' ? data.points : STARTING_POINTS
      hunger.value = typeof data.hunger === 'number' ? clamp(data.hunger) : 80
      thirst.value = typeof data.thirst === 'number' ? clamp(data.thirst) : 80
      needsUpdatedAt.value = typeof data.needsUpdatedAt === 'number' ? data.needsUpdatedAt : Date.now()
      totalCompleted.value = typeof data.totalCompleted === 'number' ? data.totalCompleted : 0
      // La ropa aún no está disponible: se descartan prendas guardadas antes para que no se vean puestas.
      ownedClothes.value = []
      equipped.value = {}
      applyDecay()
      // Regalo único de 160 monedas (la marca evita repetirlo en cada carga).
      if (localStorage.getItem(BONUS_KEY) !== '1') {
        points.value += 160
        localStorage.setItem(BONUS_KEY, '1')
        persist()
      }
      // Regalo único de 5000 monedas para todos.
      if (localStorage.getItem(GIFT_KEY) !== '1') {
        points.value += 5000
        localStorage.setItem(GIFT_KEY, '1')
        persist()
      }
    }
  } catch {
    // ignore corrupted storage
  }
}

function persist() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        userName: userName.value,
        companionName: companionName.value,
        characterId: characterId.value,
        xp: xp.value,
        level: level.value,
        streak: streak.value,
        longestStreak: longestStreak.value,
        lastCompletionDateKey: lastCompletionDateKey.value,
        points: points.value,
        hunger: hunger.value,
        thirst: thirst.value,
        needsUpdatedAt: needsUpdatedAt.value,
        totalCompleted: totalCompleted.value,
        ownedClothes: ownedClothes.value,
        equipped: equipped.value,
      }),
    )
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

export function useCompanion() {
  load()

  const character = computed(() => COMPANION_CHARACTERS.find((c) => c.id === characterId.value) ?? null)

  const hasCompanion = computed(
    () => !!characterId.value && !!companionName.value.trim() && !!userName.value.trim(),
  )

  function completeSetup(newCharacterId: string, newCompanionName: string, newUserName: string) {
    characterId.value = newCharacterId
    companionName.value = newCompanionName.trim() || 'Mapachín'
    userName.value = newUserName.trim() || 'Amigo'
    persist()
  }

  function renameCompanion(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    companionName.value = trimmed
    persist()
  }

  function renameUser(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    userName.value = trimmed
    persist()
  }

  /** Otorga XP y actualiza la racha al completar una tarea. Solo llamar en la transición false→true. */
  function awardTaskCompletion() {
    const todayKey = toDateKey(new Date())
    if (lastCompletionDateKey.value !== todayKey) {
      const diffDays = lastCompletionDateKey.value
        ? Math.round((fromDateKey(todayKey).getTime() - fromDateKey(lastCompletionDateKey.value).getTime()) / 86400000)
        : null
      streak.value = diffDays === 1 ? streak.value + 1 : 1
      longestStreak.value = Math.max(longestStreak.value, streak.value)
      lastCompletionDateKey.value = todayKey
    }

    applyDecay()
    const base = 10 + Math.min(streak.value, 10)
    // Bien alimentado (comida y bebida ≥ 50): +20% XP. Con hambre o sed crítica: -50%.
    const mood = hunger.value >= 50 && thirst.value >= 50 ? 1.2 : hunger.value < 15 || thirst.value < 15 ? 0.5 : 1
    addXp(Math.max(1, Math.round(base * mood)))
    points.value += POINTS_PER_TASK
    totalCompleted.value += 1
    useSound().play('ding')

    persist()
    useRewards().onTaskCompleted()
  }

  /** Vuelve la mascota al nivel 1 con 0 XP. Conserva monedas, racha y tareas completadas. */
  function resetLevel() {
    level.value = 1
    xp.value = 0
    lastLevelUp.value = null
    persist()
  }

  /** Premio extra (enfoque, cofre…): suma XP y monedas sin tocar la racha. */
  function awardBonus(bonusXp: number, bonusPoints = 0) {
    if (bonusXp > 0) addXp(bonusXp)
    if (bonusPoints > 0) points.value += bonusPoints
    persist()
  }

  function addXp(amount: number) {
    xp.value += amount
    let leveledUp = false
    while (xp.value >= xpThreshold(level.value)) {
      xp.value -= xpThreshold(level.value)
      level.value += 1
      leveledUp = true
    }
    if (leveledUp) {
      lastLevelUp.value = level.value
      useSound().play('levelup', 0.35)
    }
  }

  /** Recetas del café ya desbloqueadas, convertidas en comida/bebida para el compañero. */
  const recipeItems = computed<CompanionItem[]>(() =>
    RECIPES.filter((r) => recipeProgress(r, { tasks: totalCompleted.value, streak: longestStreak.value, level: level.value }).unlocked).map((r) => ({
      id: `receta-${r.id}`,
      label: r.label,
      emoji: r.emoji,
      ...recipeEffect(r),
    })),
  )

  /** Gasta puntos para darle comida o bebida al compañero. Devuelve false si no alcanzan. */
  function feed(itemId: string) {
    const item = COMPANION_ITEMS.find((i) => i.id === itemId) ?? recipeItems.value.find((i) => i.id === itemId)
    if (!item || points.value < item.cost) return false
    applyDecay()
    points.value -= item.cost
    if (item.kind === 'food') hunger.value = clamp(hunger.value + item.restore)
    else thirst.value = clamp(thirst.value + item.restore)
    addXp(item.xp)
    useSound().play('pop')
    persist()
    return true
  }

  /** Compra una prenda con puntos y la equipa. */
  function buyClothing(id: string) {
    const item = COMPANION_CLOTHES.find((c) => c.id === id)
    if (!item || ownedClothes.value.includes(id) || points.value < item.cost) return false
    points.value -= item.cost
    ownedClothes.value = [...ownedClothes.value, id]
    equipped.value = { ...equipped.value, [item.slot]: id }
    persist()
    return true
  }

  /** Equipa la prenda (si ya la tiene) o la quita si ya estaba puesta. */
  function toggleClothing(id: string) {
    const item = COMPANION_CLOTHES.find((c) => c.id === id)
    if (!item || !ownedClothes.value.includes(id)) return
    const next = { ...equipped.value }
    if (next[item.slot] === id) delete next[item.slot]
    else next[item.slot] = id
    equipped.value = next
    persist()
  }

  /** Gasta puntos si alcanzan; devuelve false si no. */
  function spendPoints(amount: number) {
    if (points.value < amount) return false
    points.value -= amount
    persist()
    return true
  }

  /** Sube el contador de por vida al menos hasta `n` (para partidas anteriores a este contador). */
  function raiseTotalCompleted(n: number) {
    if (totalCompleted.value >= n) return
    totalCompleted.value = n
    persist()
  }

  function refreshNeeds() {
    applyDecay()
  }

  function clearLevelUp() {
    lastLevelUp.value = null
  }

  return {
    userName,
    companionName,
    characterId,
    character,
    characters: COMPANION_CHARACTERS,
    hasCompanion,
    completeSetup,
    renameCompanion,
    renameUser,
    xp,
    level,
    streak,
    longestStreak,
    lastLevelUp,
    points,
    hunger,
    thirst,
    items: COMPANION_ITEMS,
    recipeItems,
    feed,
    spendPoints,
    totalCompleted,
    raiseTotalCompleted,
    clothes: COMPANION_CLOTHES,
    ownedClothes,
    equipped,
    buyClothing,
    toggleClothing,
    refreshNeeds,
    awardTaskCompletion,
    awardBonus,
    resetLevel,
    lastCompletionDateKey,
    clearLevelUp,
  }
}
