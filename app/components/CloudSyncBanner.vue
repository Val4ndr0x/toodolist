<script setup lang="ts">
const { remoteChanges, firstSyncChoice, useCloudData, useLocalData } = useCloudSync()

const { exportData } = useBackup()
const busy = ref(false)
const exported = ref(false)

function backupFirst() {
  exportData()
  exported.value = true
}

const remoteDate = computed(() =>
  firstSyncChoice.value
    ? new Date(firstSyncChoice.value.remoteUpdatedAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
    : '',
)

async function chooseCloud() {
  busy.value = true
  try {
    await useCloudData()
  } catch {
    busy.value = false
    alert('No se pudieron bajar los datos de la nube. Revisa tu conexión e inténtalo de nuevo.')
  }
}

async function chooseLocal() {
  if (!confirm('Los datos de la nube se reemplazarán por los de este dispositivo. ¿Continuar?')) return
  busy.value = true
  await useLocalData()
  busy.value = false
}

function reload() {
  location.reload()
}
</script>

<template>
  <!-- Cambios hechos en otro dispositivo mientras esta pestaña estaba abierta -->
  <div
    v-if="remoteChanges && !firstSyncChoice"
    class="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm bg-surface border border-accent shadow-lg rounded-xl2 p-3.5 flex items-center gap-3"
  >
    <AppIcon name="cloud" :size="20" class="text-accent shrink-0" />
    <p class="flex-1 text-sm text-ink">Hay cambios de otro dispositivo. Actualiza para verlos antes de seguir editando.</p>
    <button type="button" class="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold shrink-0" @click="reload">Actualizar</button>
  </div>

  <!-- Primer inicio de sesión en un dispositivo que ya tenía datos -->
  <div v-if="firstSyncChoice" class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[90] px-0 sm:px-4">
    <div class="w-full sm:max-w-sm bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] p-5 flex flex-col gap-3">
      <h2 class="text-lg font-bold text-black/80 dark:text-ink">¿Qué datos quieres usar? ☁️</h2>
      <p class="text-sm text-black/60 dark:text-muted">
        Tu cuenta ya tiene datos guardados en la nube y este dispositivo también tiene los suyos. Elige cuáles conservar.
      </p>
      <button
        type="button"
        class="text-left px-4 py-3 rounded-xl bg-[#f4a8c4] text-white hover:bg-[#ef8fb5] disabled:opacity-60"
        :disabled="busy"
        @click="chooseCloud"
      >
        <span class="block font-semibold">Usar los datos de la nube</span>
        <span class="block text-xs opacity-90">{{ firstSyncChoice.remoteSections }} secciones · último cambio {{ remoteDate }}. Reemplaza lo de este dispositivo.</span>
      </button>
      <button
        type="button"
        class="text-left px-4 py-3 rounded-xl bg-white dark:bg-surface-soft text-black/75 dark:text-ink border border-black/10 dark:border-border hover:bg-black/5 disabled:opacity-60"
        :disabled="busy"
        @click="chooseLocal"
      >
        <span class="block font-semibold">Usar los datos de este dispositivo</span>
        <span class="block text-xs text-black/50 dark:text-muted">{{ firstSyncChoice.localSections }} secciones. Se suben y reemplazan esas secciones en la nube.</span>
      </button>
      <button type="button" class="text-xs text-black/55 dark:text-muted hover:underline self-start" @click="backupFirst">
        {{ exported ? '✓ Respaldo de este dispositivo descargado' : 'Descargar primero un respaldo de este dispositivo' }}
      </button>
    </div>
  </div>
</template>
