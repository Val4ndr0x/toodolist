<script setup lang="ts">
import type { SearchResult } from '~/composables/useGlobalSearch'

const { open, search } = useGlobalSearch()
const router = useRouter()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const results = computed(() => (open.value ? search(query.value) : []))

/** Resultados agrupados por sección, conservando el orden de relevancia del primero de cada grupo. */
const groups = computed(() => {
  const map = new Map<string, { item: SearchResult; index: number }[]>()
  results.value.forEach((item) => {
    if (!map.has(item.group)) map.set(item.group, [])
    map.get(item.group)!.push({ item, index: 0 })
  })
  let i = 0
  return Array.from(map, ([group, items]) => ({ group, items: items.map((x) => ({ ...x, index: i++ })) }))
})
const flat = computed(() => groups.value.flatMap((g) => g.items.map((x) => x.item)))

watch(query, () => {
  activeIndex.value = 0
})

watch(open, (isOpen) => {
  if (!isOpen) return
  query.value = ''
  activeIndex.value = 0
  nextTick(() => inputRef.value?.focus())
})

function pick(item: SearchResult | undefined) {
  if (!item) return
  open.value = false
  router.push(item.to)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, flat.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    pick(flat.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
  }
}

watch(activeIndex, (i) => {
  nextTick(() => listRef.value?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.scrollIntoView({ block: 'nearest' }))
})

function onGlobalKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    // En el tablero Ctrl+K abre su propia paleta para agregar elementos.
    if (!open.value && document.querySelector('[data-board-canvas]')) return
    e.preventDefault()
    open.value = !open.value
    return
  }
  // "/" abre la búsqueda si no se está escribiendo en otro campo.
  const target = e.target as HTMLElement | null
  const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  if (e.key === '/' && !typing && !open.value) {
    e.preventDefault()
    open.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/60 flex items-start justify-center pt-[10vh] z-[85]" @click.self="open = false">
    <div class="w-full max-w-lg mx-4 bg-surface rounded-xl2 border border-border shadow-xl flex flex-col max-h-[75vh] overflow-hidden" role="dialog" aria-label="Buscar en toda la app">
      <div class="relative shrink-0 p-3 border-b border-border">
        <AppIcon name="search" :size="16" class="absolute left-6 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Buscar tareas, clientes, libros, gastos…"
          class="w-full pl-8 pr-3 py-2.5 rounded-xl2 bg-surface-soft text-sm text-ink placeholder-muted outline-none"
          @keydown="onKeydown"
        />
      </div>

      <div ref="listRef" class="flex-1 overflow-y-auto p-1.5">
        <p v-if="!flat.length" class="text-sm text-muted text-center py-8">Nada coincide con «{{ query }}»</p>
        <section v-for="g in groups" :key="g.group" class="mb-1">
          <p class="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{{ g.group }}</p>
          <button
            v-for="{ item, index } in g.items"
            :key="item.id"
            type="button"
            :data-index="index"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
            :class="index === activeIndex ? 'bg-accent-soft text-accent-deep' : 'hover:bg-surface-soft text-ink'"
            @mousemove="activeIndex = index"
            @click="pick(item)"
          >
            <span class="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center shrink-0 overflow-hidden">
              <img v-if="item.image" :src="item.image" alt="" class="w-full h-full object-cover" />
              <span v-else class="text-base leading-none">{{ item.emoji ?? '✨' }}</span>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium leading-tight truncate">{{ item.label }}</span>
              <span v-if="item.subtitle" class="block text-[11px] leading-tight truncate" :class="index === activeIndex ? 'text-accent-deep/70' : 'text-muted'">{{ item.subtitle }}</span>
            </span>
          </button>
        </section>
      </div>

      <div class="shrink-0 px-3 py-2 border-t border-border text-[11px] text-muted hidden sm:flex items-center gap-3">
        <span>↑↓ moverse</span>
        <span>Enter abrir</span>
        <span>Esc cerrar</span>
        <span class="ml-auto">Ctrl K o / para abrir</span>
      </div>
    </div>
  </div>
</template>
