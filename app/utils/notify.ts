/** Evento que escucha el plugin de recordatorios para navegar al tocar una notificación. */
export const NAVIGATE_EVENT = 'app:navigate'

/**
 * Muestra una notificación del sistema si hay permiso. En Android el constructor `Notification`
 * no existe dentro de una PWA, así que se recurre al service worker.
 */
export function notify(title: string, body: string, tag: string, to?: string) {
  if (!import.meta.client || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, tag, icon: `${useRuntimeConfig().app.baseURL}icons/icon-192.png` })
    n.onclick = () => {
      window.focus()
      if (to) window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: to }))
      n.close()
    }
  } catch {
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { body, tag }))
      .catch(() => {})
  }
}

/** Pide permiso para notificaciones (solo si aún no se respondió). */
export async function requestNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!import.meta.client || !('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}
