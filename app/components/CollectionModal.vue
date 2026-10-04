<script setup lang="ts">
import type { Collection, CollectionInput, CollectionKind } from '~/composables/useCollections'
import { COLLECTION_COLORS, COLLECTION_KINDS } from '~/composables/useCollections'

const props = defineProps<{ collection?: Collection | null }>()
const emit = defineEmits<{ close: []; save: [input: CollectionInput] }>()

const kind = ref<CollectionKind>(props.collection?.kind ?? 'libros')
const name = ref(props.collection?.name ?? '')
const color = ref(props.collection?.color ?? COLLECTION_COLORS[0]!)
const isEdit = computed(() => !!props.collection)

const namePlaceholder = computed(() =>
  ({
    libros: 'p. ej. Libros que he leído',
    peliculas: 'p. ej. Películas vistas',
    series: 'p. ej. Series terminadas',
    musica: 'p. ej. Mis álbumes favoritos',
    museo: 'p. ej. Salón de la fama de gorras',
    otro: 'p. ej. Lugares visitados',
  })[kind.value],
)

// El museo se arma con su propio cuestionario.
const museumSetup = ref(false)

function submit() {
  if (kind.value === 'museo') {
    museumSetup.value = true
    return
  }
  if (!name.value.trim()) return
  emit('save', { name: name.value, kind: kind.value, color: color.value })
}
</script>

<template>
  <MuseumSetupWizard
    v-if="museumSetup"
    :collection="collection"
    :name="name"
    :color="color"
    @close="museumSetup = false"
    @save="emit('save', $event)"
  />
  <div v-else class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="emit('close')">
    <form
      class="w-full sm:max-w-md bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] p-5 flex flex-col gap-4 max-h-[88vh] overflow-y-auto"
      @submit.prevent="submit"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-black/80 dark:text-ink">{{ isEdit ? 'Editar colección' : 'Nueva colección' }} 🗂️</h2>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-black/40 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-black/60 dark:text-muted">Tipo</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(k, key) in COLLECTION_KINDS"
            :key="key"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            :class="kind === key ? 'bg-[#f4a8c4] text-white shadow-sm' : 'bg-black/5 dark:bg-surface-soft text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink'"
            @click="kind = key"
          >
            {{ k.emoji }} {{ k.label }}
          </button>
        </div>
      </div>

      <label class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
        Nombre
        <input
          v-model="name"
          type="text"
          autofocus
          maxlength="60"
          :placeholder="namePlaceholder"
          class="bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3.5 py-2.5 outline-none border border-black/10 dark:border-border focus:border-black/30 dark:focus:border-accent"
        />
      </label>

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-black/60 dark:text-muted">Color</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in COLLECTION_COLORS"
            :key="c"
            type="button"
            class="w-9 h-9 rounded-full border-2 transition-transform hover:scale-105"
            :class="color === c ? 'border-black/50 dark:border-accent' : 'border-black/10 dark:border-border'"
            :style="{ backgroundColor: c }"
            :title="c"
            @click="color = c"
          />
        </div>
      </div>

      <div class="flex gap-2 justify-end mt-1">
        <button type="button" class="px-4 py-2 rounded-lg text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 rounded-lg bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5] transition-colors">
          <template v-if="kind === 'museo'">{{ isEdit && collection?.museum ? 'Editar museo →' : 'Diseñar mi museo →' }}</template>
          <template v-else>{{ isEdit ? 'Guardar' : 'Crear' }}</template>
        </button>
      </div>
    </form>
  </div>
</template>
