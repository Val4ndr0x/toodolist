<script setup lang="ts">
const { session, status, lastSyncAt, errorMessage, signOut, syncNow } = useCloudSync()

const busy = ref(false)

const STATUS_TEXT: Record<string, string> = {
  off: 'Sin sincronizar',
  idle: 'Sincronizado',
  syncing: 'Sincronizando…',
  offline: 'Sin conexión: se subirá al volver el internet',
  error: 'Error al sincronizar',
}

const lastSyncText = computed(() =>
  lastSyncAt.value ? new Date(lastSyncAt.value).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : null,
)

async function onSignOut() {
  if (!confirm('¿Cerrar sesión? Tus datos se quedan en este dispositivo, pero dejarán de sincronizarse.')) return
  busy.value = true
  await signOut()
  busy.value = false
}

async function onSyncNow() {
  busy.value = true
  await syncNow()
  busy.value = false
}

</script>

<template>
  <section class="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-border p-4">
    <h3 class="text-sm font-bold text-black/75 dark:text-ink flex items-center gap-2">
      <AppIcon name="cloud" :size="16" /> Sincronización en la nube
    </h3>

    <template v-if="session">
      <p class="text-sm text-black/60 dark:text-muted truncate">Cuenta: <strong class="text-black/75 dark:text-ink">{{ session.user.email }}</strong></p>
      <p class="flex items-center gap-2 text-sm">
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :class="{ 'bg-emerald-500': status === 'idle', 'bg-amber-400 animate-pulse': status === 'syncing', 'bg-slate-400': status === 'offline' || status === 'off', 'bg-rose-500': status === 'error' }"
        />
        <span class="text-black/65 dark:text-ink/80">{{ STATUS_TEXT[status] }}<template v-if="status === 'idle' && lastSyncText"> · {{ lastSyncText }}</template></span>
      </p>
      <p v-if="status === 'error' && errorMessage" class="text-xs text-danger break-words">{{ errorMessage }}</p>
      <div class="flex gap-2">
        <button type="button" class="flex-1 px-3 py-2 rounded-xl bg-[#f4a8c4] text-white text-sm font-semibold hover:bg-[#ef8fb5] disabled:opacity-60" :disabled="busy" @click="onSyncNow">
          Sincronizar ahora
        </button>
        <button type="button" class="px-3 py-2 rounded-xl text-sm text-black/55 dark:text-muted hover:text-black/80 dark:hover:text-ink border border-black/10 dark:border-border disabled:opacity-60" :disabled="busy" @click="onSignOut">
          Cerrar sesión
        </button>
      </div>
    </template>

    <template v-else>
      <p class="text-xs text-black/55 dark:text-muted">
        Inicia sesión para tener tus listas, finanzas y libros en todos tus dispositivos. Sin conexión la app sigue funcionando y sincroniza al volver el internet.
      </p>
      <div class="flex gap-2">
        <NuxtLink to="/cuenta" class="flex-1 text-center px-3 py-2.5 rounded-xl bg-[#f4a8c4] text-white text-sm font-semibold hover:bg-[#ef8fb5]">Iniciar sesión</NuxtLink>
        <NuxtLink to="/cuenta?modo=registro" class="flex-1 text-center px-3 py-2.5 rounded-xl text-sm font-semibold text-black/65 dark:text-ink border border-black/10 dark:border-border">Crear cuenta</NuxtLink>
      </div>
    </template>

  </section>
</template>
