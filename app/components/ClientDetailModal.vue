<script setup lang="ts">
import type { Client } from '~/composables/useClients'
import { amountDue, amountPaid, PAYMENT_LABELS, PAYMENT_METHODS } from '~/composables/useClients'
import { todayISO } from '~/composables/useFinance'

const props = defineProps<{ client: Client }>()
const emit = defineEmits<{ close: []; edit: [id: string] }>()

const formattedDate = computed(() => {
  if (!props.client.deliveryDate) return 'Sin fecha'
  const d = new Date(`${props.client.deliveryDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 'Sin fecha'
  return d.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
})

const money = (n: number) => `$${n.toLocaleString('es')}`

// --- Vínculo con tareas: las tareas cuyo responsable es este cliente ---
const { lists, addTask, toggleTask } = useLists()
const clientTasks = computed(() => {
  const name = props.client.name.trim().toLowerCase()
  return lists.value.flatMap((l) =>
    l.tasks.filter((t) => t.assignee?.toLowerCase() === name && (!t.completed || (t.completedAt ?? 0) > Date.now() - 86400_000)).map((task) => ({ task, listId: l.id, listName: l.name })),
  )
})
const newTask = ref('')
const taskListId = ref(lists.value[0]?.id ?? '')
function submitTask() {
  if (!newTask.value.trim() || !taskListId.value) return
  addTask(taskListId.value, newTask.value, props.client.name)
  newTask.value = ''
}

// --- Vínculo con finanzas: lo cobrado se registra como ingreso del cliente ---
const { clientIncome, addTransaction } = useFinance()
const registered = computed(() => clientIncome(props.client.id))
const toRegister = computed(() => Math.max(0, amountPaid(props.client) - registered.value))
function registerPayment() {
  if (!toRegister.value) return
  addTransaction({
    type: 'ingreso',
    amount: toRegister.value,
    category: 'Ventas',
    note: `${props.client.name}${props.client.order ? ` · ${props.client.order}` : ''}`.slice(0, 120),
    date: todayISO(),
    method: props.client.paymentMethod,
    clientId: props.client.id,
  })
}
const paymentChip = computed(() =>
  props.client.paymentStatus === 'pagado'
    ? 'bg-emerald-600/85 text-white'
    : props.client.paymentStatus === 'abono'
      ? 'bg-amber-500/85 text-white'
      : 'bg-rose-500/80 text-white',
)
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="emit('close')">
    <div class="w-full sm:max-w-sm bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] overflow-hidden max-h-[90vh] flex flex-col">
      <div class="relative px-5 pt-5 pb-8" :style="{ backgroundColor: client.color }">
        <button
          type="button"
          class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-black/40 hover:bg-black/10"
          @click="emit('close')"
        >
          <AppIcon name="x" :size="18" />
        </button>

        <p class="text-[11px] font-bold tracking-[0.2em] text-black/45 uppercase mb-4">Ficha de cliente</p>

        <div class="flex items-center gap-4">
          <div class="w-20 h-20 shrink-0 rounded-2xl bg-white/70 border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
            <img v-if="client.sticker" :src="client.sticker" :alt="client.name" class="w-14 h-14 object-contain" />
            <AppIcon v-else name="user" :size="34" class="text-black/40" />
          </div>
          <div class="min-w-0">
            <p class="text-lg font-bold text-black/80 leading-tight line-clamp-2">{{ client.name }}</p>
            <span v-if="client.category" class="inline-block mt-1.5 mr-1.5 px-2.5 py-0.5 rounded-full bg-white/70 text-[11px] font-semibold text-black/55">{{ client.category }}</span>
            <span
              class="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              :class="client.delivered ? 'bg-emerald-600/85 text-white' : 'bg-white/70 text-black/55'"
            >
              {{ client.delivered ? '✓ Entregado' : 'Pendiente' }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-[11px] font-bold tracking-[0.15em] text-black/35 dark:text-muted uppercase">Pedido</span>
          <p class="text-sm text-black/75 dark:text-ink leading-snug">{{ client.order || 'Sin detalle del pedido' }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-[11px] font-bold tracking-[0.15em] text-black/35 dark:text-muted uppercase flex items-center gap-1">
              <AppIcon name="calendar" :size="12" /> Entrega
            </span>
            <p class="text-sm text-black/75 dark:text-ink">{{ formattedDate }}</p>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-[11px] font-bold tracking-[0.15em] text-black/35 dark:text-muted uppercase flex items-center gap-1">
              <AppIcon name="coin" :size="12" /> Precio total
            </span>
            <p class="text-sm text-black/75 dark:text-ink">{{ money(client.price) }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2 rounded-xl2 border border-black/10 dark:border-border p-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold tracking-[0.15em] text-black/35 dark:text-muted uppercase">Pago</span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" :class="paymentChip">{{ PAYMENT_LABELS[client.paymentStatus] }}</span>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm text-black/75 dark:text-ink">
            <p>Pagado: <strong>{{ money(amountPaid(client)) }}</strong></p>
            <p>Falta: <strong>{{ money(amountDue(client)) }}</strong></p>
          </div>
          <p v-if="client.paymentMethod && client.paymentStatus !== 'no_pagado'" class="text-sm text-black/75 dark:text-ink">
            Método: <strong>{{ PAYMENT_METHODS[client.paymentMethod].emoji }} {{ PAYMENT_METHODS[client.paymentMethod].label }}</strong>
          </p>
          <div v-if="amountPaid(client) > 0" class="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-black/5 dark:border-border text-xs">
            <span class="text-black/50 dark:text-muted">
              En finanzas: {{ money(registered) }}
            </span>
            <button
              v-if="toRegister > 0"
              type="button"
              class="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
              @click="registerPayment"
            >
              + Registrar {{ money(toRegister) }} como ingreso
            </button>
            <span v-else class="text-emerald-600 font-semibold">✓ Registrado</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[11px] font-bold tracking-[0.15em] text-black/35 dark:text-muted uppercase flex items-center gap-1">
            <AppIcon name="checklist" :size="12" /> Tareas de {{ client.name }}
          </span>
          <p v-if="!clientTasks.length" class="text-xs text-black/45 dark:text-muted">Ninguna tarea tiene a este cliente como responsable.</p>
          <div v-for="r in clientTasks" :key="r.task.id" class="flex items-center gap-2 text-sm">
            <button
              type="button"
              class="w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px]"
              :class="r.task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-black/25 dark:border-border'"
              :aria-pressed="r.task.completed"
              @click="toggleTask(r.listId, r.task.id)"
            >
              <span v-if="r.task.completed">✓</span>
            </button>
            <NuxtLink :to="`/list/${r.listId}`" class="flex-1 min-w-0 truncate hover:underline" :class="r.task.completed ? 'line-through text-black/35 dark:text-muted' : 'text-black/75 dark:text-ink'">
              {{ r.task.text }}
            </NuxtLink>
            <span class="text-[11px] text-black/40 dark:text-muted shrink-0 truncate max-w-[6rem]">{{ r.task.dueDate ?? r.listName }}</span>
          </div>
          <form v-if="lists.length" class="flex gap-1.5" @submit.prevent="submitTask">
            <input
              v-model="newTask"
              type="text"
              maxlength="120"
              placeholder="Nueva tarea para este cliente…"
              class="flex-1 min-w-0 bg-white dark:bg-surface-soft text-sm text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-xl px-3 py-1.5 outline-none border border-black/10 dark:border-border"
            />
            <select v-if="lists.length > 1" v-model="taskListId" class="max-w-[7rem] bg-white dark:bg-surface-soft text-xs text-black/70 dark:text-ink rounded-xl px-2 outline-none border border-black/10 dark:border-border">
              <option v-for="l in lists" :key="l.id" :value="l.id">{{ l.name }}</option>
            </select>
            <button type="submit" class="px-3 rounded-xl bg-[#f4a8c4] text-white font-semibold">+</button>
          </form>
        </div>
      </div>

      <div class="flex gap-2 justify-end px-5 pb-5 pt-1 border-t border-black/5 dark:border-border">
        <button type="button" class="px-4 py-2 rounded-lg text-black/50 dark:text-muted hover:text-black/80 dark:hover:text-ink" @click="emit('close')">
          Cerrar
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5] transition-colors"
          @click="emit('edit', client.id)"
        >
          <AppIcon name="edit" :size="15" /> Editar
        </button>
      </div>
    </div>
  </div>
</template>
