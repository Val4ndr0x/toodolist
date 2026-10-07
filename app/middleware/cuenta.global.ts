/**
 * Al abrir la app sin sesión se muestra la pantalla de inicio de sesión, salvo que la persona
 * haya elegido "Continuar sin cuenta". También lleva ahí al volver del enlace de recuperar contraseña.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || to.path === '/cuenta') return
  const { session, authSkipped, recovery } = useCloudSync()
  if (recovery.value) return navigateTo('/cuenta')
  if (!session.value && !authSkipped.value) {
    return navigateTo({ path: '/cuenta', query: to.fullPath === '/' ? {} : { next: to.fullPath } })
  }
})
