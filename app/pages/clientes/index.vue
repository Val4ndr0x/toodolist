<script setup lang="ts">
import type { Client, PaymentMethod } from '~/composables/useClients'
import { PAYMENT_METHODS } from '~/composables/useClients'

const { clients, categories, addClient, updateClient, deleteClient, toggleDelivered } = useClients()

const search = ref('')
const showModal = ref(false)
const editingClient = ref<Client | null>(null)
const viewingClient = ref<Client | null>(null)

// Desde la búsqueda global o la página Hoy: /clientes?id=… abre la ficha directamente.
const route = useRoute()
watch(
  () => route.query.id,
  (id) => {
    if (typeof id === 'string') viewingClient.value = clients.value.find((c) => c.id === id) ?? null
  },
  { immediate: true },
)

const activeCategory = ref('todos')
const tabs = computed(() => ['todos', ...categories.value])

// Si la categoría activa deja de existir (p. ej. se editó o eliminó el último cliente), vuelve a "todos".
watch(categories, (cats) => {
  if (activeCategory.value !== 'todos' && !cats.includes(activeCategory.value)) activeCategory.value = 'todos'
})

const visibleClients = computed(() => {
  const inCategory = activeCategory.value === 'todos' ? clients.value : clients.value.filter((c) => c.category === activeCategory.value)
  if (!search.value.trim()) return inCategory
  const q = search.value.trim().toLowerCase()
  return inCategory.filter(
    (c) => c.name.toLowerCase().includes(q) || c.order.toLowerCase().includes(q)
  )
})

// Clientes agrupados por método de pago; los que aún no tienen método quedan en "Sin método".
const groups = computed(() => {
  const order: (PaymentMethod | 'none')[] = [...(Object.keys(PAYMENT_METHODS) as PaymentMethod[]), 'none']
  return order
    .map((key) => ({
      key,
      label: key === 'none' ? 'Sin método de pago' : PAYMENT_METHODS[key].label,
      emoji: key === 'none' ? '🕒' : PAYMENT_METHODS[key].emoji,
      clients: visibleClients.value.filter((c) => (c.paymentMethod ?? 'none') === key),
    }))
    .filter((g) => g.clients.length)
})

const pendingCount = computed(() => clients.value.filter((c) => !c.delivered).length)

function openCreate() {
  editingClient.value = null
  showModal.value = true
}

function openEdit(id: string) {
  editingClient.value = clients.value.find((c) => c.id === id) ?? null
  showModal.value = true
}

function openDetail(id: string) {
  viewingClient.value = clients.value.find((c) => c.id === id) ?? null
}

function onEditFromDetail(id: string) {
  viewingClient.value = null
  openEdit(id)
}

function onSave(input: Parameters<typeof addClient>[0]) {
  if (editingClient.value) {
    updateClient(editingClient.value.id, input)
  } else {
    addClient(input)
  }
  showModal.value = false
  editingClient.value = null
}

function onCloseModal() {
  showModal.value = false
  editingClient.value = null
}
</script>

<template>
  <div class="flex">
    <AppSidebar />

    <div class="flex-1 min-w-0">
      <AppHeader title="Clientes" searchable search-placeholder="Buscar clientes..." v-model:search-model="search" />

      <div class="hero-panel mx-3 sm:mx-6 mb-6 rounded-[28px] p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4 px-0.5">
          <p class="text-sm font-medium text-black/55 dark:text-ink/70">
            🎀 {{ clients.length }} {{ clients.length === 1 ? 'cliente' : 'clientes' }}
            <span v-if="pendingCount"> · {{ pendingCount }} pendiente{{ pendingCount === 1 ? '' : 's' }}</span>
          </p>
        </div>

        <div class="flex items-center gap-2 pb-4 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            :class="activeCategory === tab
              ? 'bg-white dark:bg-surface-soft text-black/75 dark:text-ink shadow-sm'
              : 'text-black/45 dark:text-muted hover:text-black/70 dark:hover:text-ink hover:bg-white/50 dark:hover:bg-surface-soft/50'"
            @click="activeCategory = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          <NewClientCard @click="openCreate" />
        </div>

        <section v-for="group in groups" :key="group.key" class="mb-7 last:mb-0">
          <h2 class="flex items-center gap-2 mb-3 px-0.5 text-sm font-bold text-black/65 dark:text-ink/80">
            <span>{{ group.emoji }}</span>
            {{ group.label }}
            <span class="text-xs font-medium text-black/40 dark:text-muted">({{ group.clients.length }})</span>
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <ClientCard
              v-for="client in group.clients"
              :key="client.id"
              :client="client"
              @open="openDetail"
              @delete="deleteClient"
              @toggle-delivered="toggleDelivered"
            />
          </div>
        </section>

        <p v-if="!visibleClients.length && search" class="text-center text-black/45 dark:text-muted text-sm py-8">
          No se encontraron clientes para "{{ search }}"
        </p>
      </div>
    </div>

    <FloatingAddButton @click="openCreate" />

    <ClientModal v-if="showModal" :client="editingClient" @close="onCloseModal" @save="onSave" />

    <ClientDetailModal
      v-if="viewingClient"
      :client="viewingClient"
      @close="viewingClient = null"
      @edit="onEditFromDetail"
    />
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
