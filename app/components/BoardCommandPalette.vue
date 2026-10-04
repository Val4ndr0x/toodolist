<script setup lang="ts">
export type PaletteItem = {
  id: string
  label: string
  subtitle?: string
  emoji?: string
  image?: string
}

const props = defineProps<{ items: PaletteItem[] }>()
const emit = defineEmits<{ pick: [id: string]; close: [] }>()

const search = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const filtered = computed(() => {
  const q = normalize(search.value.trim())
  if (!q) return props.items.slice(0, 60)
  return props.items.filter((it) => normalize(it.label).includes(q) || (it.subtitle && normalize(it.subtitle).includes(q))).slice(0, 60)
})

watch(filtered, () => {
  activeIndex.value = 0
})

function pick(item: PaletteItem) {
  emit('pick', item.id)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = filtered.value[activeIndex.value]
    if (item) pick(item)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-start justify-center pt-[12vh] z-[80]" @click.self="emit('close')">
    <div class="w-full max-w-md mx-4 bg-surface rounded-xl2 border border-border shadow-xl flex flex-col max-h-[70vh] overflow-hidden">
      <div class="relative shrink-0 p-3 border-b border-border">
        <AppIcon name="search" :size="16" class="absolute left-6 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          ref="inputRef"
          v-model="search"
          type="text"
          placeholder="Agregar al tablero..."
          class="w-full pl-8 pr-3 py-2 rounded-xl2 bg-surface-soft text-sm text-ink placeholder-muted outline-none"
          @keydown="onKeydown"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-1.5">
        <p v-if="!filtered.length" class="text-xs text-muted text-center py-6">Sin resultados</p>
        <button
          v-for="(item, i) in filtered"
          :key="item.id"
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
          :class="i === activeIndex ? 'bg-accent-soft text-accent-deep' : 'hover:bg-surface-soft text-ink'"
          @mouseenter="activeIndex = i"
          @click="pick(item)"
        >
          <span class="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="item.image" :src="item.image" :alt="item.label" class="w-full h-full object-contain" />
            <span v-else class="text-base leading-none">{{ item.emoji ?? '✨' }}</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium leading-tight truncate">{{ item.label }}</span>
            <span v-if="item.subtitle" class="block text-[11px] text-muted leading-tight truncate">{{ item.subtitle }}</span>
          </span>
        </button>
      </div>

      <div class="shrink-0 px-3 py-2 border-t border-border text-[11px] text-muted flex items-center gap-3">
        <span>↑↓ moverse</span>
        <span>Enter agregar</span>
        <span>Esc cerrar</span>
      </div>
    </div>
  </div>
</template>
