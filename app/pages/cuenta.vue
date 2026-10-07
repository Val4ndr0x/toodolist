<script setup lang="ts">
definePageMeta({ bare: true })

type Mode = 'login' | 'signup' | 'reset' | 'newpass'

const route = useRoute()
const router = useRouter()
const { session, status, lastSyncAt, recovery, signIn, signUp, signOut, resetPassword, updatePassword, skipAuth, syncNow } = useCloudSync()
const { character, companionName, userName } = useCompanion()

const initialMode = String(route.query.modo ?? '')
const mode = ref<Mode>(recovery.value ? 'newpass' : initialMode === 'registro' ? 'signup' : 'login')
watch(recovery, (r) => {
  if (r) mode.value = 'newpass'
})

const email = ref('')
const password = ref('')
const password2 = ref('')
const showPassword = ref(false)
const busy = ref(false)
const error = ref('')
/** Mensaje de éxito que reemplaza al formulario (p. ej. "revisa tu correo"). */
const notice = ref<{ title: string; text: string } | null>(null)

/** A dónde volver después de entrar (la middleware manda aquí con ?next=). */
const next = computed(() => {
  const n = String(route.query.next ?? '/')
  return n.startsWith('/') && !n.startsWith('/cuenta') ? n : '/'
})

const TITLES: Record<Mode, { title: string; subtitle: string; button: string }> = {
  login: { title: 'Hola de nuevo', subtitle: 'Inicia sesión para ver tus datos en todos tus dispositivos.', button: 'Iniciar sesión' },
  signup: { title: 'Crea tu cuenta', subtitle: 'Tus listas, finanzas y libros quedarán guardados en la nube.', button: 'Crear cuenta' },
  reset: { title: '¿Olvidaste tu contraseña?', subtitle: 'Escribe tu correo y te enviaremos un enlace para crear una nueva.', button: 'Enviar enlace' },
  newpass: { title: 'Nueva contraseña', subtitle: 'Escribe la contraseña que quieres usar de ahora en adelante.', button: 'Guardar contraseña' },
}
const copy = computed(() => TITLES[mode.value])

const validEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const needsEmail = computed(() => mode.value !== 'newpass')
const needsPassword = computed(() => mode.value !== 'reset')
const needsConfirm = computed(() => mode.value === 'signup' || mode.value === 'newpass')

function switchMode(m: Mode) {
  mode.value = m
  error.value = ''
  notice.value = null
  password.value = ''
  password2.value = ''
}

function validate(): string | null {
  if (needsEmail.value && !validEmail.value) return 'Escribe un correo válido.'
  if (needsPassword.value && password.value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (needsConfirm.value && password.value !== password2.value) return 'Las contraseñas no coinciden.'
  return null
}

async function submit() {
  error.value = validate() ?? ''
  if (error.value) return
  busy.value = true
  try {
    if (mode.value === 'login') {
      const err = await signIn(email.value, password.value)
      if (err) error.value = err
      else router.replace(next.value)
    } else if (mode.value === 'signup') {
      const result = await signUp(email.value, password.value)
      if (result === 'confirm') {
        notice.value = {
          title: 'Revisa tu correo 📬',
          text: `Te enviamos un enlace a ${email.value.trim()}. Ábrelo para confirmar tu cuenta y luego inicia sesión aquí.`,
        }
        mode.value = 'login'
        password.value = ''
        password2.value = ''
      } else if (result) error.value = result
      else router.replace(next.value)
    } else if (mode.value === 'reset') {
      const err = await resetPassword(email.value)
      if (err) error.value = err
      else notice.value = { title: 'Enlace enviado 📬', text: `Si ${email.value.trim()} tiene cuenta, te llegará un correo para crear una contraseña nueva.` }
    } else {
      const err = await updatePassword(password.value)
      if (err) error.value = err
      else {
        notice.value = { title: 'Contraseña actualizada ✓', text: 'Ya puedes seguir usando la app.' }
        setTimeout(() => router.replace('/'), 1200)
      }
    }
  } finally {
    busy.value = false
  }
}

function continueWithoutAccount() {
  skipAuth()
  router.replace(next.value)
}

async function onSignOut() {
  if (!confirm('¿Cerrar sesión? Tus datos se quedan en este dispositivo, pero dejarán de sincronizarse.')) return
  busy.value = true
  await signOut()
  busy.value = false
  switchMode('login')
}

const STATUS_TEXT: Record<string, string> = {
  off: 'Sin sincronizar',
  idle: 'Todo sincronizado',
  syncing: 'Sincronizando…',
  offline: 'Sin conexión: se subirá al volver el internet',
  error: 'Hubo un error al sincronizar',
}
const lastSyncText = computed(() =>
  lastSyncAt.value ? new Date(lastSyncAt.value).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
)

const inputCls =
  'w-full bg-white dark:bg-surface-soft text-black/80 dark:text-ink placeholder-black/30 dark:placeholder-muted rounded-2xl px-4 py-3 outline-none border border-black/10 dark:border-border focus:border-[#f4a8c4] transition-colors'
</script>

<template>
  <div class="auth-bg min-h-screen flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm flex flex-col items-center">
      <div class="flex flex-col items-center gap-2 mb-5 text-center">
        <CompanionSprite v-if="character" :character="character" :size="110" :speed="1" />
        <span v-else class="text-6xl" aria-hidden="true">📋</span>
        <p class="text-sm font-semibold text-black/45 dark:text-muted tracking-wide">Mis Tareas</p>
      </div>

      <!-- Con sesión iniciada -->
      <div v-if="session && mode !== 'newpass'" class="auth-card w-full">
        <h1 class="text-2xl font-bold text-black/80 dark:text-ink">¡Ya entraste{{ userName ? `, ${userName}` : '' }}! ☁️</h1>
        <p class="text-sm text-black/55 dark:text-muted mt-1 break-words">Cuenta: <strong class="text-black/75 dark:text-ink">{{ session.user.email }}</strong></p>
        <p class="flex items-center gap-2 text-sm mt-3">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="{ 'bg-emerald-500': status === 'idle', 'bg-amber-400 animate-pulse': status === 'syncing', 'bg-slate-400': status === 'offline' || status === 'off', 'bg-rose-500': status === 'error' }"
          />
          <span class="text-black/65 dark:text-ink/80">{{ STATUS_TEXT[status] }}<template v-if="status === 'idle' && lastSyncText"> · {{ lastSyncText }}</template></span>
        </p>
        <div class="flex flex-col gap-2 mt-5">
          <button type="button" class="auth-primary" @click="router.replace(next)">Ir a la app</button>
          <button type="button" class="auth-secondary" :disabled="busy" @click="syncNow">Sincronizar ahora</button>
          <button type="button" class="text-sm text-black/45 dark:text-muted hover:text-danger mt-1" :disabled="busy" @click="onSignOut">Cerrar sesión</button>
        </div>
      </div>

      <!-- Formulario -->
      <div v-else class="auth-card w-full">
        <div v-if="mode === 'login' || mode === 'signup'" class="grid grid-cols-2 gap-1 p-1 mb-5 rounded-full bg-black/5 dark:bg-surface-soft" role="tablist">
          <button
            v-for="m in (['login', 'signup'] as const)"
            :key="m"
            type="button"
            role="tab"
            :aria-selected="mode === m"
            class="py-2 rounded-full text-sm font-semibold transition-colors"
            :class="mode === m ? 'bg-white dark:bg-surface text-black/80 dark:text-ink shadow-sm' : 'text-black/45 dark:text-muted'"
            @click="switchMode(m)"
          >
            {{ m === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
          </button>
        </div>

        <h1 class="text-2xl font-bold text-black/80 dark:text-ink">{{ copy.title }}</h1>
        <p class="text-sm text-black/55 dark:text-muted mt-1 mb-5">{{ copy.subtitle }}</p>

        <div v-if="notice" class="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5 mb-4">
          <p class="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">{{ notice.title }}</p>
          <p class="text-sm text-emerald-700/80 dark:text-emerald-200/80 mt-0.5">{{ notice.text }}</p>
        </div>

        <form class="flex flex-col gap-3" novalidate @submit.prevent="submit">
          <label v-if="needsEmail" class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
            Correo
            <input v-model="email" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@ejemplo.com" :class="inputCls" />
          </label>

          <label v-if="needsPassword" class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
            <span class="flex justify-between">
              {{ mode === 'newpass' ? 'Contraseña nueva' : 'Contraseña' }}
              <button v-if="mode === 'login'" type="button" class="text-xs font-semibold text-[#d9779d] hover:underline" @click="switchMode('reset')">
                ¿La olvidaste?
              </button>
            </span>
            <span class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                placeholder="Mínimo 6 caracteres"
                :class="[inputCls, 'pr-12']"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-base text-black/40 dark:text-muted hover:bg-black/5 dark:hover:bg-surface"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </span>
          </label>

          <label v-if="needsConfirm" class="flex flex-col gap-1.5 text-sm font-medium text-black/60 dark:text-muted">
            Repite la contraseña
            <input v-model="password2" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Igual a la de arriba" :class="inputCls" />
          </label>

          <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

          <button type="submit" class="auth-primary mt-1" :disabled="busy">
            {{ busy ? 'Un momento…' : copy.button }}
          </button>

          <button v-if="mode === 'reset'" type="button" class="text-sm text-black/50 dark:text-muted hover:underline" @click="switchMode('login')">
            ← Volver a iniciar sesión
          </button>
        </form>
      </div>

      <button
        v-if="!session && mode !== 'newpass'"
        type="button"
        class="mt-5 text-sm font-medium text-black/50 dark:text-muted hover:text-black/75 dark:hover:text-ink"
        @click="continueWithoutAccount"
      >
        Continuar sin cuenta →
      </button>
      <p v-if="!session && mode !== 'newpass'" class="mt-1.5 text-[11px] text-center text-black/40 dark:text-muted max-w-[18rem]">
        Sin cuenta tus datos se guardan solo en este dispositivo. Puedes entrar después desde el botón de la nube ☁️.
      </p>
      <p v-if="companionName" class="mt-6 text-xs text-black/35 dark:text-muted">{{ companionName }} te está esperando 🐾</p>
    </div>
  </div>
</template>

<style scoped>
.auth-bg {
  background: linear-gradient(160deg, #fdeef4 0%, #fff6e2 50%, #eaf1fb 100%);
}
:global(.dark) .auth-bg {
  background: linear-gradient(160deg, #201f26 0%, #1c1c21 55%, #1a1e24 100%);
}
.auth-card {
  border-radius: 28px;
  padding: 1.5rem;
  background: rgb(255 255 255 / 0.85);
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.08);
  backdrop-filter: blur(8px);
}
:global(.dark) .auth-card {
  background: rgb(var(--c-surface));
  box-shadow: none;
}
.auth-primary {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 1rem;
  background: #f4a8c4;
  color: #fff;
  font-weight: 700;
  transition: background-color 0.15s;
}
.auth-primary:hover {
  background: #ef8fb5;
}
.auth-primary:disabled,
.auth-secondary:disabled {
  opacity: 0.6;
}
.auth-secondary {
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgb(0 0 0 / 0.1);
  color: rgb(0 0 0 / 0.65);
  font-weight: 600;
}
:global(.dark) .auth-secondary {
  border-color: rgb(var(--c-border));
  color: rgb(var(--c-ink));
}
</style>
