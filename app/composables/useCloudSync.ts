import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Sincronización con Supabase. Cada clave `todo-*` de localStorage (una por sección: listas,
 * finanzas, libros…) es una fila de la tabla `app_data`. Si dos dispositivos cambian la misma
 * sección, gana la versión más reciente.
 *
 * Los cambios de la nube solo se aplican al arrancar la app (antes de que las secciones lean
 * localStorage); durante la sesión se avisa con un banner para recargar, porque aplicar datos
 * por debajo de los composables haría que su siguiente guardado los pisara.
 */

const PREFIX = 'todo-'
const TABLE = 'app_data'
/** Fuera del prefijo `todo-` a propósito: no se sincroniza ni entra en los respaldos. */
const META_KEY = 'cloud-sync-meta'

type KeyMeta = { changedAt: number; syncedAt: number }
type Meta = { userId: string | null; keys: Record<string, KeyMeta> }
type RemoteRow = { key: string; value?: string; updated_at: string }

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'offline' | 'error'
/** Primer inicio de sesión en un dispositivo que ya tiene datos y la nube también: hay que elegir. */
export type FirstSyncChoice = { localSections: number; remoteSections: number; remoteUpdatedAt: number }

let client: SupabaseClient | null = null
let meta: Meta = { userId: null, keys: {} }
let rawSetItem: ((key: string, value: string) => void) | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pushing: Promise<void> | null = null
let starting: Promise<void> | null = null
/** Solo se aplican datos de la nube mientras arranca la app; luego las secciones ya los leyeron. */
let applyAllowed = true

const session = ref<Session | null>(null)
const status = ref<SyncStatus>('off')
const lastSyncAt = ref<number | null>(null)
const errorMessage = ref('')
const remoteChanges = ref(false)
const firstSyncChoice = ref<FirstSyncChoice | null>(null)

function getClient() {
  if (client) return client
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  client = createClient(supabaseUrl as string, supabaseKey as string, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}

function loadMeta() {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY) ?? 'null')
    if (raw && typeof raw === 'object') meta = { userId: typeof raw.userId === 'string' ? raw.userId : null, keys: raw.keys && typeof raw.keys === 'object' ? raw.keys : {} }
  } catch {
    meta = { userId: null, keys: {} }
  }
}

function saveMeta() {
  try {
    ;(rawSetItem ?? ((k: string, v: string) => localStorage.setItem(k, v)))(META_KEY, JSON.stringify(meta))
  } catch {
    // sin espacio: se reintentará en el siguiente cambio
  }
}

function localKeys() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) keys.push(k)
  }
  return keys
}

const isDirty = (k: string) => {
  const m = meta.keys[k]
  return !m || m.changedAt > m.syncedAt
}

/** Escribe sin marcar la clave como cambiada localmente (para datos que vienen de la nube). */
function applyRemote(key: string, value: string, remoteMs: number) {
  try {
    ;(rawSetItem ?? localStorage.setItem.bind(localStorage))(key, value)
    meta.keys[key] = { changedAt: remoteMs, syncedAt: remoteMs }
    return true
  } catch {
    return false
  }
}

/** Intercepta las escrituras de la app en localStorage para saber qué secciones cambiaron. */
function installHook() {
  if (rawSetItem) return
  const proto = Storage.prototype
  const original = proto.setItem
  rawSetItem = (key, value) => original.call(localStorage, key, value)
  proto.setItem = function (key: string, value: string) {
    original.call(this, key, value)
    if (this === window.localStorage && key.startsWith(PREFIX)) {
      const prev = meta.keys[key]
      meta.keys[key] = { changedAt: Date.now(), syncedAt: prev?.syncedAt ?? 0 }
      saveMeta()
      schedulePush()
    }
  }
}

function setError(e: unknown) {
  if (!navigator.onLine) {
    status.value = 'offline'
    return
  }
  status.value = 'error'
  errorMessage.value = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as any).message) : 'Error de conexión'
}

const signedIn = () => !!session.value && meta.userId === session.value.user.id

function schedulePush(delay = 1500) {
  if (!signedIn()) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void push(), delay)
}

/** Sube las secciones con cambios locales. */
async function push() {
  // Con cambios de otro dispositivo sin aplicar, subir ahora podría pisarlos con datos viejos.
  if (!signedIn() || remoteChanges.value) return
  if (pushing) return pushing
  pushing = (async () => {
    const dirty = localKeys().filter(isDirty)
    if (!dirty.length) {
      if (status.value === 'syncing' || status.value === 'offline') status.value = 'idle'
      return
    }
    if (!navigator.onLine) {
      status.value = 'offline'
      return
    }
    status.value = 'syncing'
    try {
      const userId = session.value!.user.id
      // De a pocas filas: algunas secciones (libros con imágenes) pesan varios MB.
      for (let i = 0; i < dirty.length; i += 4) {
        const batch = dirty.slice(i, i + 4).map((key) => {
          const changedAt = meta.keys[key]?.changedAt || Date.now()
          return { key, changedAt, row: { user_id: userId, key, value: localStorage.getItem(key) ?? '', updated_at: new Date(changedAt).toISOString() } }
        })
        const { error } = await getClient().from(TABLE).upsert(batch.map((b) => b.row), { onConflict: 'user_id,key' })
        if (error) throw error
        for (const b of batch) {
          // Si volvió a cambiar mientras subía, sigue pendiente.
          const m = meta.keys[b.key]
          if (m && m.changedAt === b.changedAt) m.syncedAt = b.changedAt
        }
        saveMeta()
      }
      status.value = 'idle'
      lastSyncAt.value = Date.now()
      errorMessage.value = ''
    } catch (e) {
      setError(e)
    }
  })().finally(() => {
    pushing = null
    if (signedIn() && localKeys().some(isDirty) && status.value === 'idle') schedulePush()
  })
  return pushing
}

async function fetchRemoteIndex() {
  const { data, error } = await getClient().from(TABLE).select('key, updated_at')
  if (error) throw error
  return (data ?? []) as RemoteRow[]
}

async function fetchValues(keys: string[]) {
  const out: RemoteRow[] = []
  for (let i = 0; i < keys.length; i += 4) {
    const { data, error } = await getClient().from(TABLE).select('key, value, updated_at').in('key', keys.slice(i, i + 4))
    if (error) throw error
    out.push(...((data ?? []) as RemoteRow[]))
  }
  return out
}

/** Secciones de la nube más nuevas que la copia local (y sin cambios locales más recientes). */
function newerRemote(index: RemoteRow[]) {
  return index.filter((r) => {
    const remoteMs = Date.parse(r.updated_at)
    const m = meta.keys[r.key]
    if (!m) return true
    if (remoteMs <= m.syncedAt) return false
    return !(isDirty(r.key) && m.changedAt > remoteMs)
  })
}

/** Baja y aplica lo nuevo de la nube. Solo debe llamarse antes de que las secciones lean sus datos. */
async function pullAndApply() {
  const index = await fetchRemoteIndex()
  const newer = newerRemote(index)
  if (newer.length) {
    const rows = await fetchValues(newer.map((r) => r.key))
    if (!applyAllowed) return 0
    for (const r of rows) {
      if (typeof r.value === 'string') applyRemote(r.key, r.value, Date.parse(r.updated_at))
    }
    saveMeta()
  }
  return newer.length
}

/** Durante la sesión: solo averigua si hay cambios de otro dispositivo, sin aplicarlos. */
async function checkRemote() {
  if (!signedIn() || !navigator.onLine) return
  try {
    remoteChanges.value = newerRemote(await fetchRemoteIndex()).length > 0
    if (!remoteChanges.value) await push()
  } catch (e) {
    setError(e)
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))])
}

/** Arranque de la app (plugin): aplica lo de la nube antes de que cualquier sección cargue. */
async function init() {
  if (!import.meta.client) return
  loadMeta()
  installHook()
  const supabase = getClient()
  const { data } = await withTimeout(supabase.auth.getSession(), 3000) ?? { data: { session: null } }
  session.value = data.session
  supabase.auth.onAuthStateChange((event, s) => {
    session.value = s
    if (!s) status.value = 'off'
    // Al volver del enlace de confirmación del correo la sesión llega por aquí.
    if (event === 'SIGNED_IN' && s && meta.userId !== s.user.id) setTimeout(() => void ensureStarted(), 0)
  })

  window.addEventListener('online', () => void checkRemote())
  window.addEventListener('offline', () => {
    if (signedIn()) status.value = 'offline'
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkRemote()
    // Al salir de la app se sube lo pendiente de inmediato.
    else void push()
  })

  if (!signedIn()) {
    applyAllowed = false
    return
  }
  status.value = 'syncing'
  try {
    const applied = await withTimeout(pullAndApply(), 5000)
    applyAllowed = false
    // Si no alcanzó a bajar a tiempo, se avisa con el banner en lugar de aplicar tarde.
    if (applied === null) await checkRemote()
    else {
      status.value = 'idle'
      lastSyncAt.value = Date.now()
    }
  } catch (e) {
    applyAllowed = false
    setError(e)
  }
  void push()
}

/** Arranca la sincronización del usuario con sesión una sola vez aunque lo pidan varios a la vez. */
function ensureStarted() {
  if (!session.value || firstSyncChoice.value) return Promise.resolve()
  starting ??= startSyncForUser()
    .catch((e) => setError(e))
    .finally(() => {
      starting = null
    })
  return starting
}

/** Tras iniciar sesión: decide si unir automáticamente o preguntar qué datos conservar. */
async function startSyncForUser() {
  const userId = session.value!.user.id
  if (meta.userId === userId) {
    await checkRemote()
    return
  }
  const index = await fetchRemoteIndex()
  const local = localKeys()
  if (!index.length) {
    // La nube está vacía: se sube todo lo de este dispositivo.
    meta = { userId, keys: Object.fromEntries(local.map((k) => [k, { changedAt: Date.now(), syncedAt: 0 }])) }
    saveMeta()
    await push()
    return
  }
  if (!local.length) {
    await useCloudData()
    return
  }
  firstSyncChoice.value = {
    localSections: local.length,
    remoteSections: index.length,
    remoteUpdatedAt: Math.max(...index.map((r) => Date.parse(r.updated_at))),
  }
}

/** Reemplaza los datos de este dispositivo por los de la nube y recarga. */
async function useCloudData() {
  const userId = session.value!.user.id
  status.value = 'syncing'
  const index = await fetchRemoteIndex()
  const rows = await fetchValues(index.map((r) => r.key))
  const remoteKeys = new Set(rows.map((r) => r.key))
  for (const k of localKeys()) if (!remoteKeys.has(k)) localStorage.removeItem(k)
  meta = { userId, keys: {} }
  for (const r of rows) if (typeof r.value === 'string') applyRemote(r.key, r.value, Date.parse(r.updated_at))
  saveMeta()
  firstSyncChoice.value = null
  location.reload()
}

/** Sube los datos de este dispositivo y reemplaza los de la nube. */
async function useLocalData() {
  const userId = session.value!.user.id
  const now = Date.now()
  meta = { userId, keys: Object.fromEntries(localKeys().map((k) => [k, { changedAt: now, syncedAt: 0 }])) }
  saveMeta()
  firstSyncChoice.value = null
  await push()
}

function authErrorText(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(message)) return 'Primero confirma tu correo con el enlace que te enviamos.'
  if (/already registered/i.test(message)) return 'Ese correo ya tiene cuenta. Inicia sesión.'
  if (/password should be at least/i.test(message)) return 'La contraseña debe tener al menos 6 caracteres.'
  if (/rate limit/i.test(message)) return 'Demasiados intentos. Espera unos minutos.'
  return message
}

export function useCloudSync() {
  async function signIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await getClient().auth.signInWithPassword({ email: email.trim(), password })
    if (error) return authErrorText(error.message)
    session.value = data.session
    await ensureStarted()
    return null
  }

  /** Devuelve un error, 'confirm' si hay que confirmar el correo, o null si ya quedó con sesión. */
  async function signUp(email: string, password: string): Promise<string | null> {
    const { data, error } = await getClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${location.origin}${useRuntimeConfig().app.baseURL}` },
    })
    if (error) return authErrorText(error.message)
    if (!data.session) return 'confirm'
    session.value = data.session
    await ensureStarted()
    return null
  }

  async function signOut() {
    await push()
    await getClient().auth.signOut()
    session.value = null
    meta.userId = null
    saveMeta()
    status.value = 'off'
    remoteChanges.value = false
  }

  async function syncNow() {
    await push()
    await checkRemote()
  }

  return {
    session,
    status,
    lastSyncAt,
    errorMessage,
    remoteChanges,
    firstSyncChoice,
    init,
    signIn,
    signUp,
    signOut,
    syncNow,
    useCloudData,
    useLocalData,
  }
}
