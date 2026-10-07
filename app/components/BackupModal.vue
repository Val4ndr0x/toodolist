<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const { exportData, importData } = useBackup()

const fileInput = ref<HTMLInputElement | null>(null)
const status = ref<{ type: 'ok' | 'error'; message: string } | null>(null)

function onExport() {
  exportData()
  status.value = { type: 'ok', message: 'Respaldo descargado ✓' }
}

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!confirm('Importar un respaldo reemplazará los datos actuales con los del archivo. ¿Continuar?')) {
    ;(e.target as HTMLInputElement).value = ''
    return
  }
  const result = await importData(file)
  if (result.ok) {
    status.value = { type: 'ok', message: 'Datos importados. Recargando...' }
    setTimeout(() => location.reload(), 800)
  } else {
    status.value = { type: 'error', message: result.error ?? 'Error al importar.' }
  }
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" @click.self="emit('close')">
    <div class="w-full sm:max-w-sm bg-[#fff8f3] dark:bg-surface rounded-t-[26px] sm:rounded-[26px] p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-black/80 dark:text-ink">Nube y respaldo</h2>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-black/40 dark:text-muted hover:bg-black/5 dark:hover:bg-surface-soft" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <CloudSyncPanel />

      <p class="text-sm text-black/55 dark:text-muted">
        Además puedes guardar un archivo de respaldo. Sin sesión iniciada, tus datos viven solo en este navegador.
      </p>

      <button
        type="button"
        class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#f4a8c4] text-white font-semibold hover:bg-[#ef8fb5] transition-colors"
        @click="onExport"
      >
        <AppIcon name="cloud" :size="18" />
        Exportar respaldo
      </button>

      <button
        type="button"
        class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-surface-soft text-black/70 dark:text-ink font-semibold border border-black/10 dark:border-border hover:bg-black/5 dark:hover:bg-surface transition-colors"
        @click="pickFile"
      >
        Importar respaldo
      </button>
      <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="onFileChange" />

      <p v-if="status" :class="status.type === 'ok' ? 'text-emerald-600' : 'text-danger'" class="text-sm text-center">
        {{ status.message }}
      </p>
    </div>
  </div>
</template>
