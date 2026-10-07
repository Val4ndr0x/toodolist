import { NAVIGATE_EVENT } from '~/utils/notify'

export default defineNuxtPlugin(() => {
  const { checkAlarms } = useCalendar()
  const { checkTaskReminders } = useLists()
  const { applyRecurring } = useFinance()
  const router = useRouter()

  const tick = () => {
    checkAlarms()
    checkTaskReminders()
  }
  tick()
  setInterval(tick, 20000)

  // Los gastos/ingresos fijos se generan al abrir la app y, si queda abierta, al cambiar de día.
  applyRecurring()
  setInterval(() => applyRecurring(), 30 * 60_000)

  window.addEventListener(NAVIGATE_EVENT, (e) => {
    const to = (e as CustomEvent<string>).detail
    if (typeof to === 'string') router.push(to)
  })
})
