import type { BoardItem } from '~/composables/useBoard'

export type TemplateItem = Omit<BoardItem, 'id' | 'groupId'>

export type BoardTemplate = {
  id: string
  label: string
  emoji: string
  blurb: string
  /** Se arma en cada uso para que los elementos internos (tareas, etc.) tengan ids nuevos. Coordenadas relativas. */
  build: () => TemplateItem[]
}

const C = {
  lila: '#e7dcf0',
  azul: '#dbe8f4',
  verde: '#e4eddd',
  amarillo: '#f6f3da',
  rosa: '#f4dede',
  durazno: '#f5e6dc',
  menta: '#d9f0ea',
  crema: '#fdf1d6',
  blanco: '#ffffff',
  rosaSuave: '#f7e7ef',
  lavanda: '#efe8f8',
}

const TAPE = { lila: '#b39ddb', azul: '#8ec5e8', verde: '#7bb892', amarillo: '#f4d35e', rosa: '#f4a9c2', durazno: '#f4b99a', fucsia: '#e58fd8' }

const w = (type: TemplateItem['type'], x: number, y: number, width: number, height: number, data: Record<string, any>): TemplateItem => ({ type, x, y, width, height, data })

const title = (x: number, y: number, width: number, text: string, color = C.blanco) => w('title', x, y, width, 76, { text, color, font: 'dancing' })

const banner = (x: number, y: number, width: number, text: string, variant: string, color: string, decor: string) =>
  w('banner', x, y, width, 76, { text, variant, color, decor })

const panel = (x: number, y: number, width: number, height: number, text: string, color: string, tape = '', lined = true) =>
  w('panel', x, y, width, height, { title: text, color, tape, lined })

const note = (x: number, y: number, width: number, height: number, text: string, color: string, style = '', corners: Record<string, string> = {}) =>
  w('note', x, y, width, height, { title: text, color, value: '', ...(style ? { style } : {}), ...(Object.keys(corners).length ? { corners } : {}) })

const todo = (x: number, y: number, width: number, height: number, text: string, color = C.blanco, count = 5) =>
  w('todo', x, y, width, height, { title: text, color, items: Array.from({ length: count }, () => ({ id: uuid(), text: '', checked: false })) })

const checklist = (x: number, y: number, width: number, height: number, text: string, color: string, labels: string[], checkIcon = '') =>
  w('checklist', x, y, width, height, { title: text, color, checkIcon, items: labels.map((label) => ({ id: uuid(), label, checked: false })) })

const mood = (x: number, y: number, width = 260, height = 130, color = C.lavanda) => w('mood', x, y, width, height, { color, value: null })
const sleep = (x: number, y: number, width = 260, height = 110, color = C.blanco) => w('sleep', x, y, width, height, { color, value: null })
const stars = (x: number, y: number, text: string, width = 260, height = 110, color = C.blanco) => w('stars', x, y, width, height, { title: text, color, value: 0 })
const date = (x: number, y: number, width = 240, color = C.verde) => w('date', x, y, width, 64, { color, value: '' })

const img = (file: string, x: number, y: number, size: number, rotation = 0): TemplateItem => ({
  type: 'image',
  src: `/stickers/${file}.png`,
  label: file,
  x,
  y,
  width: size,
  height: size,
  rotation,
})

const S = (file: string) => `/stickers/${file}.png`

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'mensual',
    label: 'Planificador mensual',
    emoji: '📅',
    blurb: 'Calendario del mes, tareas y notas.',
    build: () => [
      title(0, 0, 300, 'Mi mes'),
      w('calendar', 0, 100, 480, 420, { color: C.blanco, accent: '#c98aa6' }),
      todo(500, 0, 280, 282, 'Por hacer', C.blanco, 6),
      panel(500, 298, 280, 222, 'Notas', C.rosaSuave, TAPE.fucsia),
      img('conejo', 396, -34, 92, 8),
      img('planta', 700, 470, 90, -6),
      img('kawaii', -26, 466, 80, -10),
    ],
  },
  {
    id: 'semanal',
    label: 'Semana',
    emoji: '🗓️',
    blurb: 'Un cuadro por día y un espacio de notas.',
    build: () => {
      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      const colors = [C.lila, C.azul, C.verde, C.amarillo, C.rosa, C.durazno, C.menta]
      const tapes = [TAPE.lila, TAPE.azul, TAPE.verde, TAPE.amarillo, TAPE.rosa, TAPE.durazno, '']
      const cells = days.map((d, i) => panel((i % 4) * 216, i < 4 ? 100 : 346, 200, 230, d, colors[i], tapes[i]))
      return [
        title(0, 0, 420, 'Mi semana'),
        ...cells,
        note(648, 346, 200, 230, 'Notas', C.crema, 'nubes'),
        img('gato', 716, -12, 96, 6),
        img('cafe', 596, 8, 70, -8),
      ]
    },
  },
  {
    id: 'dia',
    label: 'Plan del día',
    emoji: '☀️',
    blurb: 'Horario, prioridades, ánimo y sueño.',
    build: () => [
      title(0, 0, 360, 'Mi día'),
      date(380, 6, 240),
      mood(0, 100, 300, 130),
      sleep(320, 100, 300, 112),
      checklist(0, 246, 300, 340, 'Horario', C.crema, ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']),
      todo(320, 228, 300, 244, 'Prioridades', C.blanco, 5),
      note(320, 488, 300, 160, 'Notas', C.azul, 'nubes'),
      img('contento', 540, -30, 90, 10),
      img('planta', -26, 560, 84, -8),
    ],
  },
  {
    id: 'compras',
    label: 'Lista de compras',
    emoji: '🛒',
    blurb: 'Secciones del súper y notas con flores.',
    build: () => [
      title(0, 0, 700, 'Lista de compras'),
      panel(0, 100, 220, 190, 'Panadería', C.lila, TAPE.lila),
      panel(236, 100, 220, 190, 'Bebidas', C.azul, TAPE.azul),
      panel(472, 100, 220, 190, 'Congelados', C.menta),
      panel(0, 306, 220, 190, 'Despensa', C.amarillo, TAPE.amarillo),
      panel(236, 306, 220, 190, 'Mariscos', C.rosa),
      panel(472, 306, 220, 190, 'Carnes', C.durazno, TAPE.durazno),
      note(712, 100, 240, 396, 'Notas', '#f3efe9', 'tulipanes', { tr: S('planta') }),
      img('pina', -26, -26, 84, -10),
      img('fruta', 620, -18, 78, 8),
    ],
  },
  {
    id: 'viaje',
    label: 'Checklist de viaje',
    emoji: '🧳',
    blurb: 'Ropa, aseo, comida, salud y accesorios.',
    build: () => [
      title(0, 0, 700, 'Lista de viaje'),
      panel(0, 100, 340, 250, 'Ropa', C.lila, TAPE.lila),
      panel(360, 100, 340, 250, 'Aseo', C.azul),
      panel(0, 366, 340, 200, 'Comida', C.verde, TAPE.verde),
      panel(360, 366, 340, 200, 'Varios', C.amarillo),
      panel(0, 582, 340, 200, 'Salud', C.rosa),
      panel(360, 582, 340, 200, 'Accesorios', C.durazno, TAPE.azul),
      img('planta', 300, 320, 86, 10),
      img('hola', 620, -30, 92, 12),
      img('kawaii', -26, 550, 80, -10),
    ],
  },
  {
    id: 'habitos',
    label: 'Rastreador de hábitos',
    emoji: '🌸',
    blurb: 'Rutina diaria con florecitas, ánimo y energía.',
    build: () => [
      title(0, 0, 320, 'Mis hábitos'),
      checklist(0, 100, 320, 340, 'Cada día', C.rosaSuave, ['Tomar agua', 'Ejercicio', 'Leer', 'Meditar', 'Dormir temprano', 'Estudiar', 'Skincare'], '🌸'),
      stars(340, 100, 'Mi energía', 260),
      mood(340, 226, 260, 130),
      sleep(340, 372, 260, 112),
      note(0, 460, 320, 200, 'Reflexión', C.lavanda, 'lavanda'),
      img('paz', 500, -30, 90, 10),
      img('contento', 560, 500, 80, -8),
    ],
  },
  {
    id: 'gratitud',
    label: 'Diario de gratitud',
    emoji: '💗',
    blurb: 'Tres notas ilustradas y un ánimo del día.',
    build: () => [
      title(0, 0, 700, 'Diario de gratitud'),
      note(0, 110, 220, 250, 'Hoy agradezco...', C.crema, 'margaritas', { tr: S('planta') }),
      note(240, 110, 220, 250, 'Algo lindo que pasó', '#fdeef3', 'sakura'),
      note(480, 110, 220, 250, 'Mi mejor momento', C.lavanda, 'lavanda', { tl: S('kawaii') }),
      mood(0, 380, 340, 130),
      note(360, 380, 340, 190, 'Para mañana', C.menta, 'colinas'),
      img('amor', 610, -30, 92, 10),
      img('forma-de-corazon', -24, 336, 70, -12),
    ],
  },
  {
    id: 'estudio',
    label: 'Plan de estudio',
    emoji: '📚',
    blurb: 'Tareas, temas a repasar y foco.',
    build: () => [
      title(0, 0, 340, 'Plan de estudio'),
      date(360, 6, 240),
      todo(0, 100, 300, 284, 'Tareas', C.blanco, 6),
      checklist(320, 100, 300, 284, 'Temas a repasar', C.azul, ['Tema 1', 'Tema 2', 'Tema 3']),
      stars(0, 400, 'Enfoque de hoy', 300),
      note(320, 400, 300, 210, 'Ideas y dudas', C.verde, 'bosque'),
      img('leer', 540, -28, 92, 8),
      img('ser-creativo', -26, 500, 84, -8),
    ],
  },
  {
    id: 'comidas',
    label: 'Menú semanal',
    emoji: '🍽️',
    blurb: 'Desayuno, almuerzo, cena, snacks e ingredientes.',
    build: () => [
      title(0, 0, 560, 'Menú semanal'),
      panel(0, 100, 270, 200, 'Desayuno', C.amarillo, TAPE.amarillo),
      panel(286, 100, 270, 200, 'Almuerzo', C.verde, TAPE.verde),
      panel(572, 100, 270, 200, 'Cena', C.lila, TAPE.lila),
      panel(0, 316, 270, 200, 'Snacks', C.rosa),
      checklist(286, 316, 270, 260, 'Ingredientes', C.crema, ['Frutas', 'Verduras', 'Proteína', 'Lácteos']),
      note(572, 316, 270, 200, 'Recetas', C.durazno, 'hongos'),
      img('torta', 760, -24, 86, 10),
      img('cafe', 470, -12, 74, -8),
      img('fruta', -24, 480, 80, -10),
    ],
  },
  {
    id: 'metas',
    label: 'Metas y sueños',
    emoji: '🌟',
    blurb: 'Metas del mes, del año y tus sueños.',
    build: () => [
      banner(0, 0, 760, 'Mis metas', 'brush', '#f4c6cf', S('kawaii')),
      note(0, 100, 240, 230, 'Este mes', C.lila, 'noche'),
      note(256, 100, 240, 230, 'Este año', C.azul, 'olas'),
      note(512, 100, 240, 230, 'Mis sueños', '#fde2c8', 'colinas'),
      checklist(0, 350, 370, 230, 'Pasos para lograrlo', C.blanco, ['Paso 1', 'Paso 2', 'Paso 3', 'Paso 4'], '⭐'),
      stars(390, 350, 'Motivación', 362),
      note(390, 480, 362, 150, 'Mi afirmación', '#fbe3ea', 'sakura'),
      img('poder-femenino', 680, -34, 92, 10),
      img('forma-de-corazon', -22, 540, 70, -12),
    ],
  },
  {
    id: 'autocuidado',
    label: 'Autocuidado',
    emoji: '🧖‍♀️',
    blurb: 'Rutina suave, afirmaciones y cómo te sientes.',
    build: () => [
      title(0, 0, 340, 'Autocuidado'),
      mood(0, 100, 300, 130),
      sleep(320, 100, 300, 112),
      checklist(0, 246, 300, 300, 'Mi rutina', C.rosaSuave, ['Skincare', 'Tomar agua', 'Estirarme', 'Salir a caminar', 'Desconectarme'], '💗'),
      note(320, 228, 300, 220, 'Afirmaciones', C.lavanda, 'lavanda'),
      panel(320, 470, 300, 140, 'Hoy me siento...', C.rosa, TAPE.rosa),
      img('paz', 520, -30, 90, 10),
      img('planta', -26, 520, 90, -8),
      img('rubor', 540, 560, 76, 8),
    ],
  },
  {
    id: 'fitness',
    label: 'Entrenamiento',
    emoji: '💪',
    blurb: 'Rutina, medidas, agua y energía.',
    build: () => [
      title(0, 0, 420, 'Mi entrenamiento'),
      date(440, 6, 240),
      checklist(0, 100, 320, 300, 'Rutina', C.menta, ['Calentamiento', 'Cardio 20 min', 'Fuerza', 'Estiramientos'], '⭐'),
      panel(340, 100, 340, 140, 'Peso y medidas', C.azul, TAPE.azul),
      panel(340, 256, 340, 144, 'Agua', C.blanco, '', false),
      stars(0, 420, 'Energía', 320),
      note(340, 420, 340, 190, 'Logros', C.crema, 'olas'),
      img('poder-femenino', 600, -34, 92, 10),
      img('ok', -24, 360, 76, -10),
    ],
  },
  {
    id: 'lectura',
    label: 'Mis lecturas',
    emoji: '📖',
    blurb: 'Leyendo ahora, por leer, frases y calificación.',
    build: () => [
      title(0, 0, 420, 'Mis lecturas'),
      panel(0, 100, 300, 150, 'Leyendo ahora', C.lila, TAPE.lila),
      stars(0, 266, 'Calificación', 300),
      checklist(320, 100, 300, 276, 'Por leer', C.crema, ['Libro 1', 'Libro 2', 'Libro 3']),
      note(0, 392, 300, 210, 'Frases favoritas', '#fdeef3', 'sakura'),
      panel(320, 392, 300, 210, 'Notas', C.verde),
      img('leer', 520, -28, 92, 8),
      img('cafe', -24, 560, 78, -8),
      img('gato', 540, 560, 84, 6),
    ],
  },
  {
    id: 'presupuesto',
    label: 'Presupuesto mensual',
    emoji: '💰',
    blurb: 'Ingresos, gastos, ahorro y pagos pendientes.',
    build: () => [
      title(0, 0, 340, 'Presupuesto'),
      panel(0, 100, 300, 200, 'Ingresos', C.verde, TAPE.verde),
      panel(316, 100, 300, 200, 'Gastos fijos', C.rosa),
      panel(632, 100, 300, 200, 'Gastos variables', C.durazno, TAPE.durazno),
      panel(0, 316, 300, 216, 'Ahorro', C.azul, TAPE.azul),
      todo(316, 316, 300, 216, 'Pagos pendientes', C.blanco, 4),
      note(632, 316, 300, 216, 'Meta de ahorro', C.crema, 'colinas'),
      img('mujer-de-negocios', 850, -34, 92, 8),
      img('ok', -24, 470, 74, -10),
    ],
  },
  {
    id: 'fiesta',
    label: 'Organizar un evento',
    emoji: '🎉',
    blurb: 'Invitados, comida, decoración y pendientes.',
    build: () => [
      banner(0, 0, 760, 'Mi fiesta', 'confetti', '#f7b8cf', S('kawaii')),
      date(0, 100, 300),
      panel(0, 184, 300, 230, 'Invitados', C.rosa, TAPE.rosa),
      panel(316, 100, 300, 150, 'Comida', C.amarillo),
      panel(316, 266, 300, 148, 'Decoración', C.lila, TAPE.lila),
      todo(632, 100, 270, 314, 'Por hacer', C.blanco, 7),
      img('torta', -26, -26, 88, -10),
      img('hola', 700, -34, 92, 10),
    ],
  },
  {
    id: 'kanban',
    label: 'Proyecto (por hacer / listo)',
    emoji: '🗂️',
    blurb: 'Tres columnas para avanzar paso a paso.',
    build: () => [
      title(0, 0, 420, 'Mi proyecto'),
      panel(0, 100, 290, 420, 'Por hacer', C.azul, TAPE.azul),
      panel(306, 100, 290, 420, 'En proceso', C.amarillo, TAPE.amarillo),
      panel(612, 100, 290, 420, 'Listo', C.verde, TAPE.verde),
      img('ok', 820, -30, 88, 10),
      img('conejo', -22, 470, 84, -8),
    ],
  },
  {
    id: 'negocio',
    label: 'Semana de mi negocio',
    emoji: '💼',
    blurb: 'Prioridades, agenda, clientes, números clave y revisión de la semana.',
    build: () => [
      title(0, 0, 420, 'Semana de mi negocio'),
      date(440, 6, 240),

      banner(0, 100, 902, 'Prioridades de la semana (máx. 3)', 'brush', C.amarillo, ''),
      todo(0, 186, 290, 260, 'Pendiente', C.rosa, 3),
      todo(306, 186, 290, 260, 'En proceso', C.amarillo, 3),
      todo(612, 186, 290, 260, 'Hecho', C.verde, 3),

      panel(0, 462, 443, 260, 'Reuniones y citas', C.azul, TAPE.azul),
      w('panel', 459, 462, 443, 260, {
        title: 'Clientes y proyectos',
        color: C.lila,
        tape: TAPE.lila,
        lined: true,
        value: 'Cliente o proyecto → siguiente paso\n\n\n',
      }),

      note(0, 738, 443, 240, 'Ideas o por explorar', C.crema, 'nubes'),
      w('panel', 459, 738, 443, 240, {
        title: 'Números clave',
        color: C.menta,
        lined: true,
        value: 'Ventas:\nCotizaciones enviadas:\nGastos:\n',
      }),

      note(0, 994, 443, 220, 'Qué salió bien', C.verde, 'olas'),
      note(459, 994, 443, 220, 'Qué salió mal', C.durazno, 'colinas'),

      img('mujer-de-negocios', 840, -34, 92, 8),
      img('creatividad', -26, 680, 80, -10),
      img('ok', 840, 1030, 80, -8),
    ],
  },
  {
    id: 'ideas',
    label: 'Lluvia de ideas',
    emoji: '💡',
    blurb: 'Seis notas de colores para soltar ideas.',
    build: () => [
      title(0, 0, 500, 'Lluvia de ideas'),
      note(0, 100, 220, 180, '', C.crema),
      note(236, 100, 220, 180, '', C.lila, 'lavanda'),
      note(472, 100, 220, 180, '', C.azul),
      note(0, 296, 220, 180, '', '#fbe3ea', 'sakura'),
      note(236, 296, 220, 180, '', C.verde, 'bosque'),
      note(472, 296, 220, 180, '', '#fde2c8', 'colinas'),
      img('creatividad', 600, -34, 92, 10),
      img('creatividad(1)', -24, 430, 80, -10),
    ],
  },
  {
    id: 'rinconcito',
    label: 'Mi rinconcito (scrapbook)',
    emoji: '🎀',
    blurb: 'Notas ilustradas y muchos stickers lindos.',
    build: () => [
      title(160, 0, 320, 'Mi rinconcito'),
      note(120, 100, 300, 360, 'Hoy', C.lavanda, 'tulipanes', { tl: S('planta'), tr: S('kawaii') }),
      note(440, 120, 240, 200, 'Recuerdos', '#e2ecf9', 'nubes'),
      panel(440, 340, 240, 150, 'Me hace feliz', C.rosa, TAPE.fucsia),
      img('gato', 20, 70, 110, -8),
      img('conejo', 540, -20, 100, 8),
      img('forma-de-corazon', 40, 250, 80, 10),
      img('amor', 10, 380, 90, -6),
      img('contento', 690, 300, 84, 8),
      img('pina', 660, 60, 80, -10),
    ],
  },
]
