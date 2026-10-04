<script setup lang="ts">
import type { CollectionInput, CollectionItem } from '~/composables/useCollections'
import { COLLECTION_KINDS } from '~/composables/useCollections'

const route = useRoute()
const router = useRouter()
const { getCollection, updateCollection, deleteItem } = useCollections()

const collection = getCollection(String(route.params.id))

watchEffect(() => {
  if (!collection.value) router.replace('/colecciones')
})

const kind = computed(() => (collection.value ? COLLECTION_KINDS[collection.value.kind] : COLLECTION_KINDS.otro))
const isMuseum = computed(() => collection.value?.kind === 'museo' && !!collection.value.museum)
const itemLabel = computed(() => (isMuseum.value ? collection.value!.museum!.pieceLabel : kind.value.itemLabel))

type SortKey = 'recientes' | 'calificacion' | 'titulo'
const SORTS: Record<SortKey, string> = { recientes: 'Recientes', calificacion: 'Mejor calificados', titulo: 'A–Z' }
const sort = ref<SortKey>('recientes')
const search = ref('')

const visibleItems = computed(() => {
  if (!collection.value) return []
  const q = search.value.trim().toLowerCase()
  const items = q
    ? collection.value.items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.creator.toLowerCase().includes(q) ||
          i.notes.toLowerCase().includes(q) ||
          Object.values(i.details).some((v) => v.toLowerCase().includes(q)),
      )
    : [...collection.value.items]
  if (sort.value === 'calificacion') items.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt)
  else if (sort.value === 'titulo') items.sort((a, b) => a.title.localeCompare(b.title, 'es'))
  else items.sort((a, b) => b.createdAt - a.createdAt)
  return items
})

const showItemModal = ref(false)
const editingItem = ref<CollectionItem | null>(null)
const viewingId = ref<string | null>(null)
const viewingItem = computed(() => collection.value?.items.find((i) => i.id === viewingId.value) ?? null)
const showCollectionModal = ref(false)
/** Sala elegida al agregar desde un pedestal del museo. */
const newItemCategory = ref('')

function openCreate(category = '') {
  editingItem.value = null
  newItemCategory.value = category
  showItemModal.value = true
}

function openEdit(id: string) {
  viewingId.value = null
  editingItem.value = collection.value?.items.find((i) => i.id === id) ?? null
  showItemModal.value = true
}

function onDeleteItem(id: string) {
  if (collection.value) deleteItem(collection.value.id, id)
  viewingId.value = null
}

function onSaveCollection(input: CollectionInput) {
  if (collection.value) updateCollection(collection.value.id, input)
  showCollectionModal.value = false
}
</script>

<template>
  <div v-if="collection" class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0">
      <AppHeader :title="`${kind.emoji} ${collection.name}`" show-back @back="router.push('/colecciones')" />

      <div class="mx-3 sm:mx-6 mb-6 rounded-[28px] p-4 sm:p-6" :style="{ backgroundColor: collection.color }">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <p class="text-sm font-medium text-black/55 mr-auto px-0.5">
            <template v-if="!isMuseum">{{ collection.items.length }} {{ collection.items.length === 1 ? 'elemento' : 'elementos' }}</template>
          </p>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar…"
            class="w-36 sm:w-48 bg-white/70 text-black/80 placeholder-black/35 rounded-full px-3.5 py-1.5 text-sm outline-none border border-black/10 focus:border-black/30"
          />
          <select
            v-model="sort"
            class="bg-white/70 text-black/70 rounded-full px-3 py-1.5 text-sm outline-none border border-black/10 focus:border-black/30"
          >
            <option v-for="(label, key) in SORTS" :key="key" :value="key">{{ label }}</option>
          </select>
          <button
            type="button"
            class="w-8 h-8 rounded-full flex items-center justify-center text-black/50 hover:bg-black/10"
            :title="isMuseum ? 'Editar museo' : 'Editar colección'"
            @click="showCollectionModal = true"
          >
            <AppIcon name="edit" :size="16" />
          </button>
        </div>

        <MuseumHall v-if="isMuseum" :collection="collection" :items="visibleItems" @open="viewingId = $event" @add="openCreate" />

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <button
            type="button"
            class="group flex flex-col items-center justify-center gap-2 min-h-[200px] rounded-[18px] bg-white/45 border-2 border-dashed border-black/15 hover:border-black/30 hover:bg-white/65 transition-colors"
            @click="openCreate()"
          >
            <span class="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black/60 shadow-sm group-hover:scale-105 transition-transform">
              <AppIcon name="plus" :size="20" />
            </span>
            <span class="text-black/55 font-semibold text-sm text-center px-2">Agregar {{ itemLabel }}</span>
          </button>

          <CollectionItemCard v-for="item in visibleItems" :key="item.id" :item="item" :fallback-emoji="kind.emoji" @open="viewingId = $event" />
        </div>

        <p v-if="search && !visibleItems.length" class="text-center text-black/45 text-sm py-8">No hay resultados para "{{ search }}"</p>
      </div>
    </div>

    <FloatingAddButton :label="`Agregar ${itemLabel}`" @click="openCreate()" />

    <CollectionItemWizard
      v-if="showItemModal"
      :collection-id="collection.id"
      :item="editingItem"
      :category="newItemCategory"
      @close="showItemModal = false; editingItem = null"
    />

    <CollectionItemDetail
      v-if="viewingItem"
      :collection-id="collection.id"
      :item-id="viewingItem.id"
      :item-ids="visibleItems.map((i) => i.id)"
      @close="viewingId = null"
      @edit="openEdit"
      @delete="onDeleteItem"
      @navigate="viewingId = $event"
    />

    <MuseumSetupWizard
      v-if="showCollectionModal && isMuseum"
      :collection="collection"
      @close="showCollectionModal = false"
      @save="onSaveCollection"
    />
    <CollectionModal v-else-if="showCollectionModal" :collection="collection" @close="showCollectionModal = false" @save="onSaveCollection" />
  </div>
</template>
