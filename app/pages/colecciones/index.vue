<script setup lang="ts">
import type { Collection, CollectionInput } from '~/composables/useCollections'

const router = useRouter()
const { collections, addCollection, updateCollection, deleteCollection } = useCollections()

const search = ref('')
const showModal = ref(false)
const editing = ref<Collection | null>(null)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return collections.value
  return collections.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.items.some((i) => i.title.toLowerCase().includes(q) || i.creator.toLowerCase().includes(q)),
  )
})

const totalItems = computed(() => collections.value.reduce((n, c) => n + c.items.length, 0))

function openCreate() {
  editing.value = null
  showModal.value = true
}

function openEdit(id: string) {
  editing.value = collections.value.find((c) => c.id === id) ?? null
  showModal.value = true
}

function onSave(input: CollectionInput) {
  if (editing.value) {
    updateCollection(editing.value.id, input)
    closeModal()
    return
  }
  const id = addCollection(input)
  closeModal()
  if (id) router.push(`/colecciones/${id}`)
}

function closeModal() {
  showModal.value = false
  editing.value = null
}
</script>

<template>
  <div class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0">
      <AppHeader title="Colecciones" searchable search-placeholder="Buscar colecciones..." v-model:search-model="search" />

      <div class="hero-panel mx-3 sm:mx-6 mb-6 rounded-[28px] p-4 sm:p-6">
        <p class="mb-4 px-0.5 text-sm font-medium text-black/55 dark:text-ink/70">
          🗂️ {{ collections.length }} {{ collections.length === 1 ? 'colección' : 'colecciones' }}
          <span v-if="totalItems"> · {{ totalItems }} {{ totalItems === 1 ? 'elemento' : 'elementos' }} guardados</span>
        </p>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <button
            type="button"
            class="group flex flex-col items-center justify-center gap-3 min-h-[210px] rounded-[22px] bg-white/50 dark:bg-surface-soft/50 border-2 border-dashed border-black/15 dark:border-border hover:border-black/30 dark:hover:border-accent/50 hover:bg-white/70 dark:hover:bg-surface-soft/80 transition-colors"
            @click="openCreate"
          >
            <span class="w-12 h-12 rounded-full bg-white dark:bg-surface-soft flex items-center justify-center text-black/60 dark:text-ink shadow-sm group-hover:scale-105 transition-transform">
              <AppIcon name="plus" :size="22" />
            </span>
            <span class="text-black/60 dark:text-muted font-semibold text-center px-2">Nueva colección</span>
          </button>

          <CollectionCard
            v-for="c in visible"
            :key="c.id"
            :collection="c"
            @open="router.push(`/colecciones/${$event}`)"
            @edit="openEdit"
            @delete="deleteCollection"
          />
        </div>

        <p v-if="!collections.length" class="text-center text-black/45 dark:text-muted text-sm pt-8 pb-2">
          Crea una colección para guardar los libros que has leído, las películas o series que has visto… ✨
        </p>
        <p v-else-if="!visible.length && search" class="text-center text-black/45 dark:text-muted text-sm py-8">
          No se encontraron colecciones para "{{ search }}"
        </p>
      </div>
    </div>

    <FloatingAddButton label="Nueva colección" @click="openCreate" />

    <CollectionModal v-if="showModal" :collection="editing" @close="closeModal" @save="onSave" />
  </div>
</template>

<style>
.hero-panel {
  background: linear-gradient(135deg, #fdeef4 0%, #fef6e7 45%, #eaf6f0 100%);
}

.dark .hero-panel {
  background: linear-gradient(135deg, #1c1c21 0%, #201f26 55%, #1a1e24 100%);
}
</style>
