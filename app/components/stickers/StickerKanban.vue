<script setup lang="ts">
type KanbanItem = { id: string; text: string }
type KanbanColumn = { id: string; title: string; color: string; items: KanbanItem[] }

const props = defineProps<{ data: Record<string, any> }>()
const emit = defineEmits<{ update: [data: Record<string, any>]; remove: [] }>()

/** Columnas fijas: es un kanban chiquito para "máximo 3 prioridades" de la semana, con un color por etapa. */
const COLUMN_DEFS = [
  { id: 'pendiente', title: 'Pendiente', color: '#f4dede' },
  { id: 'proceso', title: 'En proceso', color: '#f6f3da' },
  { id: 'hecho', title: 'Hecho', color: '#e4eddd' },
]
const MAX_ITEMS = 3

const columns = computed<KanbanColumn[]>(() => {
  const saved: KanbanColumn[] | undefined = props.data.columns
  return COLUMN_DEFS.map((c) => ({ id: c.id, title: c.title, color: c.color, items: saved?.find((s) => s.id === c.id)?.items ?? [] }))
})

const totalItems = computed(() => columns.value.reduce((n, c) => n + c.items.length, 0))
const atLimit = computed(() => totalItems.value >= MAX_ITEMS)

function setColumns(next: KanbanColumn[]) {
  emit('update', { columns: next })
}

function addItem(columnId: string) {
  if (atLimit.value) return
  setColumns(columns.value.map((c) => (c.id === columnId ? { ...c, items: [...c.items, { id: uuid(), text: '' }] } : c)))
}

function updateText(columnId: string, itemId: string, text: string) {
  setColumns(columns.value.map((c) => (c.id === columnId ? { ...c, items: c.items.map((it) => (it.id === itemId ? { ...it, text } : it)) } : c)))
}

function removeItem(columnId: string, itemId: string) {
  setColumns(columns.value.map((c) => (c.id === columnId ? { ...c, items: c.items.filter((it) => it.id !== itemId) } : c)))
}

function moveItem(columnId: string, itemId: string, dir: 1 | -1) {
  const idx = columns.value.findIndex((c) => c.id === columnId)
  const target = columns.value[idx + dir]
  if (!target) return
  const item = columns.value[idx]!.items.find((it) => it.id === itemId)
  if (!item) return
  setColumns(
    columns.value.map((c) => {
      if (c.id === columnId) return { ...c, items: c.items.filter((it) => it.id !== itemId) }
      if (c.id === target.id) return { ...c, items: [...c.items, item] }
      return c
    }),
  )
}
</script>

<template>
  <div class="relative w-full h-full rounded-xl2 p-2.5 group flex flex-col" :class="data.color !== 'transparent' && 'shadow-sm'" :style="{ backgroundColor: data.color || '#ffffff' }">
    <button
      type="button"
      class="absolute top-1 right-1 z-[2] w-6 h-6 rounded-full flex items-center justify-center text-black/30 hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
      @click="emit('remove')"
    >
      <AppIcon name="x" :size="14" />
    </button>
    <p class="text-[11px] font-semibold text-black/60 mb-1.5 text-center">Prioridades de la semana (máx. {{ MAX_ITEMS }})</p>

    <div class="flex-1 min-h-0 grid grid-cols-3 gap-1.5">
      <div v-for="(col, ci) in columns" :key="col.id" class="min-h-0 flex flex-col rounded-lg p-1.5 gap-1" :style="{ backgroundColor: col.color }">
        <p class="text-[10px] font-bold uppercase tracking-wide text-black/50 text-center truncate">{{ col.title }}</p>

        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
          <div v-for="item in col.items" :key="item.id" class="bg-white/80 rounded-md px-1 py-0.5 flex items-center gap-0.5 shadow-sm">
            <button
              v-if="ci > 0"
              type="button"
              class="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-black/30 hover:text-black/60"
              title="Mover a la columna anterior"
              @click="moveItem(col.id, item.id, -1)"
            >
              <AppIcon name="arrow-left" :size="10" />
            </button>
            <input
              :value="item.text"
              type="text"
              placeholder="..."
              class="min-w-0 flex-1 bg-transparent outline-none text-[10.5px] text-black/70"
              @input="updateText(col.id, item.id, ($event.target as HTMLInputElement).value)"
            />
            <button
              v-if="ci < columns.length - 1"
              type="button"
              class="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-black/30 hover:text-black/60 rotate-180"
              title="Mover a la columna siguiente"
              @click="moveItem(col.id, item.id, 1)"
            >
              <AppIcon name="arrow-left" :size="10" />
            </button>
            <button type="button" class="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-black/25 hover:text-danger" title="Quitar" @click="removeItem(col.id, item.id)">
              <AppIcon name="x" :size="10" />
            </button>
          </div>
        </div>

        <button
          v-if="!atLimit"
          type="button"
          class="text-[10px] text-black/35 hover:text-black/60 flex items-center justify-center gap-0.5 py-0.5"
          @click="addItem(col.id)"
        >
          <AppIcon name="plus" :size="10" /> agregar
        </button>
      </div>
    </div>
  </div>
</template>
