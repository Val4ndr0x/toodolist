import type { CollectionKind } from '~/composables/useCollections'

/** Estilo visual de la ficha de un elemento de colección (como los estilos de la cafetería). */
export type CardTheme = {
  id: string
  label: string
  emoji: string
  blurb: string
  /** Color base del fondo. */
  bg: string
  /** Capas de background-image que dibujan el patrón (olas, lunares, cuadros…). */
  pattern?: string
  /** Degradado sobre la portada difuminada para que el texto se lea. Puede usar var(--tint), el color de la colección. */
  shade: string
  /** Opacidad de la portada difuminada de fondo. */
  imageOpacity: number
  text: string
  muted: string
  accent: string
  /** Fondo de botones y etiquetas. */
  chip: string
  titleFont: string
  titleShadow?: string
  note: { bg: string; text: string; tape: string }
  /** Borde decorativo interior. */
  frame?: string
  /** Emojis (o letras) que caen lentamente por la ficha. */
  particles?: string[]
  /** Las partículas suben en vez de caer (burbujas, luciérnagas). */
  rise?: boolean
  /** Adornos fijos en las esquinas inferiores. */
  corners?: [string, string]
  /** Adorno colgando arriba. */
  banner?: 'faroles' | 'papel-picado' | 'noren' | 'banderines'
  /** Colores de las banderitas (papel picado o banderines). */
  bannerColors?: string[]
  /** Sello rojo tipo hanko junto al título. */
  seal?: string
}

const darkShade = (bg: string) =>
  `radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--tint) 30%, transparent), transparent 60%), linear-gradient(to bottom, color-mix(in srgb, ${bg} 25%, transparent), color-mix(in srgb, ${bg} 92%, transparent) 70%)`
const lightShade = (bg: string) => `linear-gradient(to bottom, color-mix(in srgb, ${bg} 55%, transparent), color-mix(in srgb, ${bg} 94%, transparent) 65%)`

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'cine', label: 'Cine', emoji: '🎬', blurb: 'Oscuro y elegante, como sala de cine',
    bg: '#16141b', shade: darkShade('#16141b'), imageOpacity: 0.55,
    text: '#ffffff', muted: 'rgba(255,255,255,0.62)', accent: '#f4a8c4', chip: 'rgba(255,255,255,0.12)',
    titleFont: "'Merriweather', serif", titleShadow: '0 2px 20px rgba(0,0,0,0.4)',
    note: { bg: '#fff6b8', text: 'rgba(0,0,0,0.75)', tape: 'rgba(244,168,196,0.75)' },
  },
  {
    id: 'oriental', label: 'Japón tradicional', emoji: '⛩️', blurb: 'Papel washi, olas seigaiha y sello rojo',
    bg: '#f3e7cf',
    pattern:
      'radial-gradient(circle at 50% 100%, transparent 9px, rgba(192,57,43,0.13) 10px 11px, transparent 12px 15px, rgba(192,57,43,0.1) 16px 17px, transparent 18px) 0 0 / 36px 18px, radial-gradient(circle at 50% 100%, transparent 9px, rgba(192,57,43,0.13) 10px 11px, transparent 12px 15px, rgba(192,57,43,0.1) 16px 17px, transparent 18px) 18px 9px / 36px 18px',
    shade: lightShade('#f3e7cf'), imageOpacity: 0.3,
    text: '#3b2418', muted: 'rgba(59,36,24,0.6)', accent: '#c0392b', chip: 'rgba(192,57,43,0.1)',
    titleFont: "'Merriweather', serif",
    note: { bg: '#fffaf0', text: '#3b2418', tape: 'rgba(192,57,43,0.7)' },
    frame: 'inset 0 0 0 7px #f3e7cf, inset 0 0 0 9px #c0392b',
    corners: ['⛩️', '🎐'], banner: 'noren', seal: '名作',
  },
  {
    id: 'chino', label: 'Calles chinas', emoji: '🏮', blurb: 'Rojo imperial, oro y faroles colgando',
    bg: '#7a1f1f',
    pattern:
      'radial-gradient(circle at 0 0, transparent 14px, rgba(242,193,78,0.12) 15px 16px, transparent 17px) 0 0 / 48px 48px, radial-gradient(circle at 100% 100%, transparent 14px, rgba(242,193,78,0.12) 15px 16px, transparent 17px) 0 0 / 48px 48px',
    shade: darkShade('#7a1f1f'), imageOpacity: 0.35,
    text: '#fff3d6', muted: 'rgba(255,243,214,0.7)', accent: '#f2c14e', chip: 'rgba(242,193,78,0.16)',
    titleFont: "'Merriweather', serif", titleShadow: '0 2px 0 #3d0f0f, 0 0 24px rgba(242,193,78,0.35)',
    note: { bg: '#fbe3a6', text: '#5a1515', tape: 'rgba(192,57,43,0.85)' },
    frame: 'inset 0 0 0 3px rgba(242,193,78,0.55), inset 0 0 0 8px #7a1f1f, inset 0 0 0 9px rgba(242,193,78,0.35)',
    corners: ['🐉', '🧧'], banner: 'faroles', seal: '福',
  },
  {
    id: 'sakura', label: 'Sakura', emoji: '🌸', blurb: 'Cerezos en flor y pétalos cayendo',
    bg: '#fde4ec',
    pattern: 'radial-gradient(circle, rgba(224,112,154,0.14) 2px, transparent 3px) 0 0 / 26px 26px',
    shade: lightShade('#fde4ec'), imageOpacity: 0.3,
    text: '#5b2a3a', muted: 'rgba(91,42,58,0.6)', accent: '#e0709a', chip: 'rgba(224,112,154,0.15)',
    titleFont: "'Dancing Script', cursive",
    note: { bg: '#ffffff', text: '#5b2a3a', tape: 'rgba(249,207,221,0.95)' },
    particles: ['🌸', '🌸', '💮'], corners: ['🌸', '🍡'], seal: '桜',
  },
  {
    id: 'neon', label: 'Neón Tokyo', emoji: '🌃', blurb: 'Ciudad anime de noche con luces de neón',
    bg: '#120c26',
    pattern: 'linear-gradient(rgba(0,255,255,0.06) 1px, transparent 1px) 0 0 / 34px 34px, linear-gradient(90deg, rgba(255,79,216,0.06) 1px, transparent 1px) 0 0 / 34px 34px',
    shade: darkShade('#120c26'), imageOpacity: 0.45,
    text: '#f5f0ff', muted: 'rgba(220,210,255,0.65)', accent: '#ff4fd8', chip: 'rgba(255,79,216,0.15)',
    titleFont: "'Fredoka', sans-serif", titleShadow: '0 0 6px #ff4fd8, 0 0 22px rgba(255,79,216,0.7)',
    note: { bg: '#24184a', text: '#7df9ff', tape: 'rgba(255,79,216,0.8)' },
    frame: 'inset 0 0 0 2px rgba(125,249,255,0.45), inset 0 0 24px rgba(255,79,216,0.25)',
    corners: ['🗼', '🍥'],
  },
  {
    id: 'biblioteca', label: 'Biblioteca antigua', emoji: '📖', blurb: 'Madera, velas y pergamino',
    bg: '#3b2a1e',
    pattern: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 46px, rgba(255,255,255,0.03) 46px 48px)',
    shade: darkShade('#3b2a1e'), imageOpacity: 0.35,
    text: '#f6e7c8', muted: 'rgba(246,231,200,0.65)', accent: '#d4a24c', chip: 'rgba(212,162,76,0.18)',
    titleFont: "'Merriweather', serif", titleShadow: '0 2px 0 rgba(0,0,0,0.4)',
    note: { bg: '#f3e2bd', text: '#4a3220', tape: 'rgba(139,90,43,0.8)' },
    frame: 'inset 0 0 0 4px rgba(212,162,76,0.45), inset 0 0 0 9px #3b2a1e, inset 0 0 0 10px rgba(212,162,76,0.3)',
    corners: ['🕯️', '🪶'],
  },
  {
    id: 'museo', label: 'Salón de la fama', emoji: '🏆', blurb: 'Terciopelo, oro y reflectores',
    bg: '#2e0c17',
    pattern: 'radial-gradient(ellipse at 50% -20%, rgba(255,215,130,0.22), transparent 55%), repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 60px)',
    shade: darkShade('#2e0c17'), imageOpacity: 0.3,
    text: '#fbeccb', muted: 'rgba(251,236,203,0.65)', accent: '#e3b04b', chip: 'rgba(227,176,75,0.18)',
    titleFont: "'Merriweather', serif", titleShadow: '0 2px 18px rgba(227,176,75,0.35)',
    note: { bg: '#f6e3b4', text: '#3a2508', tape: 'rgba(227,176,75,0.8)' },
    frame: 'inset 0 0 0 4px rgba(227,176,75,0.55), inset 0 0 0 9px #2e0c17, inset 0 0 0 10px rgba(227,176,75,0.35)',
    particles: ['✨', '⭐'], corners: ['🏆', '🏅'],
  },
  {
    id: 'kawaii', label: 'Kawaii', emoji: '🎀', blurb: 'Lunares rosados y corazones flotando',
    bg: '#ffe9f2',
    pattern: 'radial-gradient(circle, rgba(244,168,196,0.4) 5px, transparent 6px) 0 0 / 30px 30px, radial-gradient(circle, rgba(189,224,254,0.5) 4px, transparent 5px) 15px 15px / 30px 30px',
    shade: lightShade('#ffe9f2'), imageOpacity: 0.25,
    text: '#6b3a55', muted: 'rgba(107,58,85,0.6)', accent: '#ff8fbf', chip: 'rgba(255,143,191,0.18)',
    titleFont: "'Fredoka', sans-serif", titleShadow: '2px 2px 0 #fff',
    note: { bg: '#ffffff', text: '#6b3a55', tape: 'rgba(189,224,254,0.95)' },
    particles: ['💗', '✨', '🎀'], corners: ['🧸', '🍓'],
  },
  {
    id: 'bosque', label: 'Bosque', emoji: '🌲', blurb: 'Verde profundo con hojas al viento',
    bg: '#1f3326',
    pattern: 'radial-gradient(ellipse at 50% 120%, rgba(158,214,158,0.12), transparent 60%)',
    shade: darkShade('#1f3326'), imageOpacity: 0.4,
    text: '#eaf5e4', muted: 'rgba(234,245,228,0.65)', accent: '#9ed69e', chip: 'rgba(158,214,158,0.16)',
    titleFont: "'Merriweather', serif",
    note: { bg: '#f1f7df', text: '#2f4a2a', tape: 'rgba(158,214,158,0.9)' },
    particles: ['🍃', '🍂', '🍃'], corners: ['🍄', '🦉'],
  },
  {
    id: 'noche', label: 'Noche estrellada', emoji: '🌌', blurb: 'Azul profundo con estrellas que titilan',
    bg: '#141a3a',
    pattern:
      ['1.5px 1.5px at 20px 30px, #fff', '1px 1px at 90px 70px, #fff', '1.5px 1.5px at 150px 20px, #dfe3ff', '1px 1px at 60px 120px, #fff', '2px 2px at 170px 140px, #fffbe0']
        .map((g) => `radial-gradient(${g}, transparent) 0 0 / 200px 160px`)
        .join(', '),
    shade: darkShade('#141a3a'), imageOpacity: 0.4,
    text: '#eef0ff', muted: 'rgba(238,240,255,0.62)', accent: '#a99bff', chip: 'rgba(169,155,255,0.16)',
    titleFont: "'Merriweather', serif", titleShadow: '0 0 18px rgba(169,155,255,0.5)',
    note: { bg: '#26305e', text: '#e6e9ff', tape: 'rgba(169,155,255,0.8)' },
    particles: ['✨', '⭐'], corners: ['🌙', '🪐'],
  },
  {
    id: 'diner', label: 'Diner retro', emoji: '🍒', blurb: 'Menta, cereza y piso a cuadros',
    bg: '#cfeee9',
    pattern: 'conic-gradient(rgba(217,67,47,0.08) 25%, transparent 0 50%, rgba(217,67,47,0.08) 0 75%, transparent 0) 0 0 / 36px 36px',
    shade: lightShade('#cfeee9'), imageOpacity: 0.25,
    text: '#2c3e3c', muted: 'rgba(44,62,60,0.62)', accent: '#d9432f', chip: 'rgba(217,67,47,0.12)',
    titleFont: "'Pacifico', cursive", titleShadow: '2px 2px 0 #fff',
    note: { bg: '#ffffff', text: '#333333', tape: 'rgba(217,67,47,0.75)' },
    frame: 'inset 0 0 0 6px #d9432f, inset 0 0 0 9px #ffffff',
    corners: ['🍒', '🥤'],
  },
  {
    id: 'otono', label: 'Otoño', emoji: '🍂', blurb: 'Naranjas cálidos y hojas que caen',
    bg: '#f4d3b3',
    pattern: 'radial-gradient(circle at 80% 10%, rgba(200,98,42,0.15), transparent 40%)',
    shade: lightShade('#f4d3b3'), imageOpacity: 0.3,
    text: '#4a2a14', muted: 'rgba(74,42,20,0.62)', accent: '#c8622a', chip: 'rgba(200,98,42,0.14)',
    titleFont: "'Merriweather', serif",
    note: { bg: '#fff4e0', text: '#4a2a14', tape: 'rgba(200,98,42,0.7)' },
    particles: ['🍂', '🍁'], corners: ['🎃', '☕'],
  },
  {
    id: 'tropical', label: 'Tropical', emoji: '🏝️', blurb: 'Mar turquesa, palmeras y flores',
    bg: '#c9f1ee',
    pattern: 'radial-gradient(ellipse at 50% 115%, #f6e3b4 30%, transparent 31%), repeating-radial-gradient(ellipse at 50% 140%, transparent 0 20px, rgba(255,255,255,0.25) 20px 22px)',
    shade: lightShade('#c9f1ee'), imageOpacity: 0.28,
    text: '#0f3d40', muted: 'rgba(15,61,64,0.62)', accent: '#ff7f50', chip: 'rgba(255,127,80,0.15)',
    titleFont: "'Lobster', cursive", titleShadow: '2px 2px 0 rgba(255,255,255,0.8)',
    note: { bg: '#fff8dc', text: '#0f3d40', tape: 'rgba(255,127,80,0.75)' },
    corners: ['🌴', '🌺'],
  },
  {
    id: 'mexicano', label: 'Fiesta mexicana', emoji: '🪅', blurb: 'Papel picado y colores de fiesta',
    bg: '#fff4e0',
    pattern: 'radial-gradient(circle, rgba(230,0,126,0.08) 3px, transparent 4px) 0 0 / 22px 22px',
    shade: lightShade('#fff4e0'), imageOpacity: 0.25,
    text: '#3b1f4a', muted: 'rgba(59,31,74,0.62)', accent: '#e6007e', chip: 'rgba(230,0,126,0.12)',
    titleFont: "'Lobster', cursive",
    note: { bg: '#ffffff', text: '#3b1f4a', tape: 'rgba(0,166,166,0.75)' },
    corners: ['🌵', '🌼'], banner: 'papel-picado',
  },
  {
    id: 'hacker', label: 'Hacker', emoji: '💻', blurb: 'Terminal verde y código lloviendo',
    bg: '#050a05',
    pattern: 'repeating-linear-gradient(to bottom, rgba(57,255,20,0.05) 0 1px, transparent 1px 3px)',
    shade: darkShade('#050a05'), imageOpacity: 0.25,
    text: '#39ff14', muted: 'rgba(57,255,20,0.6)', accent: '#39ff14', chip: 'rgba(57,255,20,0.1)',
    titleFont: "'Courier New', ui-monospace, monospace", titleShadow: '0 0 8px rgba(57,255,20,0.8)',
    note: { bg: '#0b1a0b', text: '#39ff14', tape: 'rgba(57,255,20,0.45)' },
    frame: 'inset 0 0 0 1px rgba(57,255,20,0.6), inset 0 0 40px rgba(57,255,20,0.12)',
    particles: ['0', '1', 'ア', '1', '0', 'カ', '{', '}'], corners: ['💾', '🖥️'],
  },
  {
    id: 'buda', label: 'Templo de Buda', emoji: '🪷', blurb: 'Oro, lotos y banderines de oración',
    bg: '#5a1e0e',
    pattern:
      'repeating-radial-gradient(circle at 50% 110%, transparent 0 22px, rgba(245,179,1,0.1) 22px 23px), radial-gradient(circle at 50% 110%, rgba(245,179,1,0.25), transparent 55%)',
    shade: darkShade('#5a1e0e'), imageOpacity: 0.3,
    text: '#ffe9b0', muted: 'rgba(255,233,176,0.68)', accent: '#f5b301', chip: 'rgba(245,179,1,0.16)',
    titleFont: "'Merriweather', serif", titleShadow: '0 0 20px rgba(245,179,1,0.45)',
    note: { bg: '#fff3cf', text: '#5a1e0e', tape: 'rgba(245,140,1,0.8)' },
    frame: 'inset 0 0 0 3px rgba(245,179,1,0.5), inset 0 0 0 8px #5a1e0e, inset 0 0 0 9px rgba(245,179,1,0.3)',
    particles: ['🪷', '✨'], rise: true, corners: ['🪷', '🕉️'], seal: '佛',
    banner: 'banderines', bannerColors: ['#1e66d0', '#ffffff', '#d62828', '#2a9d3a', '#f6c90e', '#1e66d0', '#ffffff', '#d62828', '#2a9d3a', '#f6c90e'],
  },
  {
    id: 'sakura-noche', label: 'Sakura de noche', emoji: '🏯', blurb: 'Cerezos iluminados bajo la luna',
    bg: '#1d1430',
    pattern: 'radial-gradient(circle at 85% 12%, rgba(255,236,200,0.35) 0 28px, rgba(255,236,200,0.08) 29px 60px, transparent 61px)',
    shade: darkShade('#1d1430'), imageOpacity: 0.4,
    text: '#ffe4ef', muted: 'rgba(255,228,239,0.65)', accent: '#ff9ec4', chip: 'rgba(255,158,196,0.15)',
    titleFont: "'Dancing Script', cursive", titleShadow: '0 0 16px rgba(255,158,196,0.6)',
    note: { bg: '#2c1f45', text: '#ffe4ef', tape: 'rgba(255,158,196,0.7)' },
    particles: ['🌸', '💮', '🌸'], corners: ['🏯', '🌸'], banner: 'faroles', seal: '夜桜',
  },
  {
    id: 'zen', label: 'Jardín zen', emoji: '🎋', blurb: 'Arena rastrillada, piedras y bambú',
    bg: '#e9e6dc',
    pattern: 'repeating-radial-gradient(circle at 15% 85%, transparent 0 9px, rgba(61,58,50,0.08) 9px 10px), repeating-radial-gradient(circle at 85% 20%, transparent 0 9px, rgba(61,58,50,0.06) 9px 10px)',
    shade: lightShade('#e9e6dc'), imageOpacity: 0.25,
    text: '#3d3a32', muted: 'rgba(61,58,50,0.6)', accent: '#6b8f71', chip: 'rgba(107,143,113,0.15)',
    titleFont: "'Merriweather', serif",
    note: { bg: '#f8f6ef', text: '#3d3a32', tape: 'rgba(107,143,113,0.6)' },
    corners: ['🪨', '🎋'], seal: '禅',
  },
  {
    id: 'samurai', label: 'Samurái', emoji: '⚔️', blurb: 'Sol rojo, tinta negra y honor',
    bg: '#161616',
    pattern: 'radial-gradient(circle at 82% 22%, #d7263d 0 70px, transparent 71px), linear-gradient(160deg, transparent 60%, rgba(255,255,255,0.03) 60% 62%, transparent 62%)',
    shade: darkShade('#161616'), imageOpacity: 0.3,
    text: '#f2ede4', muted: 'rgba(242,237,228,0.62)', accent: '#d7263d', chip: 'rgba(255,255,255,0.08)',
    titleFont: "'Merriweather', serif", titleShadow: '3px 3px 0 rgba(215,38,61,0.6)',
    note: { bg: '#f2ede4', text: '#161616', tape: 'rgba(215,38,61,0.85)' },
    particles: ['🍁'], corners: ['⚔️', '🏯'], seal: '侍',
  },
  {
    id: 'kpop', label: 'K-pop', emoji: '💜', blurb: 'Escenario, lightsticks y brillo',
    bg: '#1b0f2e',
    pattern: 'conic-gradient(from 200deg at 50% -10%, transparent 0 20deg, rgba(199,125,255,0.15) 25deg, transparent 30deg 50deg, rgba(255,111,200,0.12) 55deg, transparent 60deg)',
    shade: darkShade('#1b0f2e'), imageOpacity: 0.45,
    text: '#fbf0ff', muted: 'rgba(240,220,255,0.65)', accent: '#c77dff', chip: 'rgba(199,125,255,0.16)',
    titleFont: "'Fredoka', sans-serif", titleShadow: '0 0 10px #c77dff, 0 0 26px rgba(255,111,200,0.6)',
    note: { bg: '#fbf0ff', text: '#3c1f5c', tape: 'rgba(255,111,200,0.75)' },
    particles: ['💜', '✨', '⭐'], corners: ['🎤', '💿'],
  },
  {
    id: 'valle', label: 'Valle mágico', emoji: '🍃', blurb: 'Colinas verdes, nubes y espíritus del bosque',
    bg: '#dff1f7',
    pattern: 'radial-gradient(ellipse at 20% 120%, #a8d5a2 0 35%, transparent 36%), radial-gradient(ellipse at 80% 125%, #8cc58a 0 38%, transparent 39%)',
    shade: lightShade('#dff1f7'), imageOpacity: 0.25,
    text: '#24453a', muted: 'rgba(36,69,58,0.62)', accent: '#4f9d69', chip: 'rgba(79,157,105,0.15)',
    titleFont: "'Indie Flower', cursive",
    note: { bg: '#ffffff', text: '#24453a', tape: 'rgba(79,157,105,0.6)' },
    particles: ['🍃', '☁️'], corners: ['🌳', '🐈‍⬛'],
  },
  {
    id: 'vaporwave', label: 'Vaporwave', emoji: '🌴', blurb: 'Atardecer rosa, cuadrícula y estatuas',
    bg: '#2b1055',
    pattern:
      'linear-gradient(to bottom, transparent 55%, rgba(255,113,206,0.25) 55% 55.4%, transparent 55.4%), repeating-linear-gradient(90deg, rgba(1,205,254,0.12) 0 1px, transparent 1px 40px), radial-gradient(circle at 50% 55%, #ff71ce 0 60px, transparent 61px), linear-gradient(to bottom, #2b1055, #7597de)',
    shade: darkShade('#2b1055'), imageOpacity: 0.3,
    text: '#fffb96', muted: 'rgba(255,251,150,0.7)', accent: '#ff71ce', chip: 'rgba(1,205,254,0.16)',
    titleFont: "'Fredoka', sans-serif", titleShadow: '3px 3px 0 #01cdfe',
    note: { bg: '#b967ff', text: '#fffb96', tape: 'rgba(1,205,254,0.8)' },
    corners: ['🌴', '🗿'],
  },
  {
    id: 'terror', label: 'Terror', emoji: '🩸', blurb: 'Oscuridad, velas y letra de máquina',
    bg: '#0d0000',
    pattern: 'radial-gradient(circle at 50% 0%, rgba(179,0,27,0.25), transparent 60%)',
    shade: darkShade('#0d0000'), imageOpacity: 0.3,
    text: '#e8d6d6', muted: 'rgba(232,214,214,0.6)', accent: '#b3001b', chip: 'rgba(179,0,27,0.18)',
    titleFont: "'Special Elite', monospace", titleShadow: '0 0 12px rgba(179,0,27,0.8)',
    note: { bg: '#e8dcc6', text: '#2a0000', tape: 'rgba(179,0,27,0.75)' },
    frame: 'inset 0 0 60px rgba(179,0,27,0.35)',
    particles: ['🩸'], corners: ['🕷️', '🕯️'],
  },
  {
    id: 'halloween', label: 'Halloween', emoji: '🎃', blurb: 'Calabazas, murciélagos y dulces',
    bg: '#1f1033',
    pattern: 'radial-gradient(circle at 80% 15%, rgba(255,140,26,0.3) 0 40px, transparent 41px)',
    shade: darkShade('#1f1033'), imageOpacity: 0.35,
    text: '#ffe8cc', muted: 'rgba(255,232,204,0.65)', accent: '#ff8c1a', chip: 'rgba(255,140,26,0.16)',
    titleFont: "'Lobster', cursive", titleShadow: '0 3px 0 #000',
    note: { bg: '#ffb35c', text: '#2b1240', tape: 'rgba(120,60,200,0.7)' },
    particles: ['🦇', '🍬'], corners: ['🎃', '👻'],
  },
  {
    id: 'navidad', label: 'Navidad', emoji: '🎄', blurb: 'Pino, regalos y nieve',
    bg: '#0f3d2e',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.07) 2px, transparent 3px) 0 0 / 24px 24px',
    shade: darkShade('#0f3d2e'), imageOpacity: 0.3,
    text: '#ffffff', muted: 'rgba(255,255,255,0.68)', accent: '#e63946', chip: 'rgba(255,255,255,0.12)',
    titleFont: "'Pacifico', cursive", titleShadow: '0 3px 0 rgba(0,0,0,0.3)',
    note: { bg: '#fff8f0', text: '#0f3d2e', tape: 'rgba(230,57,70,0.8)' },
    frame: 'inset 0 0 0 5px #e63946, inset 0 0 0 8px #ffffff',
    particles: ['❄️', '❄️', '✨'], corners: ['🎄', '🎁'],
    banner: 'banderines', bannerColors: ['#e63946', '#2a9d3a', '#f6c90e', '#e63946', '#2a9d3a', '#f6c90e', '#e63946', '#2a9d3a'],
  },
  {
    id: 'invierno', label: 'Invierno', emoji: '⛄', blurb: 'Nieve suave y bufanda tejida',
    bg: '#e8f4fb',
    pattern: 'radial-gradient(circle, rgba(74,144,194,0.12) 2px, transparent 3px) 0 0 / 22px 22px',
    shade: lightShade('#e8f4fb'), imageOpacity: 0.25,
    text: '#1f3b57', muted: 'rgba(31,59,87,0.6)', accent: '#4a90c2', chip: 'rgba(74,144,194,0.14)',
    titleFont: "'Merriweather', serif",
    note: { bg: '#ffffff', text: '#1f3b57', tape: 'rgba(230,57,70,0.6)' },
    particles: ['❄️', '❅', '❆'], corners: ['⛄', '🧣'],
  },
  {
    id: 'galaxia', label: 'Galaxia', emoji: '🚀', blurb: 'Nebulosas, planetas y aliens',
    bg: '#07051a',
    pattern: 'radial-gradient(ellipse at 20% 30%, rgba(124,58,237,0.35), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(14,165,233,0.3), transparent 50%)',
    shade: darkShade('#07051a'), imageOpacity: 0.35,
    text: '#eaf6ff', muted: 'rgba(234,246,255,0.62)', accent: '#7cf3ff', chip: 'rgba(124,243,255,0.13)',
    titleFont: "'Fredoka', sans-serif", titleShadow: '0 0 18px rgba(124,243,255,0.6)',
    note: { bg: '#1a1446', text: '#eaf6ff', tape: 'rgba(124,58,237,0.8)' },
    particles: ['⭐', '✨', '☄️'], corners: ['🚀', '👽'],
  },
  {
    id: 'oceano', label: 'Fondo del mar', emoji: '🐚', blurb: 'Burbujas, corales y luz de agua',
    bg: '#0b3954',
    pattern: 'repeating-radial-gradient(ellipse at 30% -20%, transparent 0 30px, rgba(127,255,212,0.06) 30px 34px)',
    shade: darkShade('#0b3954'), imageOpacity: 0.35,
    text: '#e6fffa', muted: 'rgba(230,255,250,0.65)', accent: '#7fffd4', chip: 'rgba(127,255,212,0.14)',
    titleFont: "'Lobster', cursive", titleShadow: '0 2px 10px rgba(0,0,0,0.4)',
    note: { bg: '#fdf0d5', text: '#0b3954', tape: 'rgba(255,127,127,0.7)' },
    particles: ['🫧', '🫧', '🐠'], rise: true, corners: ['🐚', '🪸'],
  },
  {
    id: 'pirata', label: 'Mapa del tesoro', emoji: '🏴‍☠️', blurb: 'Pergamino, brújula y oro',
    bg: '#e9d4a7',
    pattern: 'radial-gradient(circle at 10% 10%, rgba(110,70,30,0.25), transparent 35%), radial-gradient(circle at 90% 90%, rgba(110,70,30,0.3), transparent 35%), radial-gradient(circle, rgba(139,30,30,0.18) 1.5px, transparent 2px) 0 0 / 16px 16px',
    shade: lightShade('#e9d4a7'), imageOpacity: 0.22,
    text: '#4a2f17', muted: 'rgba(74,47,23,0.65)', accent: '#8b1e1e', chip: 'rgba(139,30,30,0.12)',
    titleFont: "'Special Elite', monospace",
    note: { bg: '#f6e7c4', text: '#4a2f17', tape: 'rgba(139,90,43,0.7)' },
    frame: 'inset 0 0 50px rgba(110,70,30,0.35)',
    corners: ['🧭', '💰'],
  },
  {
    id: 'medieval', label: 'Castillo', emoji: '🏰', blurb: 'Muros de piedra, escudos y antorchas',
    bg: '#2e2b28',
    pattern: 'linear-gradient(rgba(0,0,0,0.3) 2px, transparent 2px) 0 0 / 60px 30px, linear-gradient(90deg, rgba(0,0,0,0.3) 2px, transparent 2px) 0 0 / 60px 60px, linear-gradient(90deg, rgba(0,0,0,0.3) 2px, transparent 2px) 30px 30px / 60px 60px',
    shade: darkShade('#2e2b28'), imageOpacity: 0.3,
    text: '#efe6d2', muted: 'rgba(239,230,210,0.62)', accent: '#c9a227', chip: 'rgba(201,162,39,0.16)',
    titleFont: "'Merriweather', serif", titleShadow: '0 2px 0 #000',
    note: { bg: '#efe0bd', text: '#2e2b28', tape: 'rgba(120,30,30,0.8)' },
    frame: 'inset 0 0 0 4px rgba(201,162,39,0.5)',
    corners: ['🛡️', '🗡️'],
  },
  {
    id: 'hadas', label: 'Bosque de hadas', emoji: '🧚', blurb: 'Luciérnagas y mariposas brillantes',
    bg: '#2a1f3d',
    pattern: 'radial-gradient(circle at 30% 80%, rgba(255,214,255,0.15), transparent 40%), radial-gradient(circle at 75% 30%, rgba(180,255,200,0.12), transparent 40%)',
    shade: darkShade('#2a1f3d'), imageOpacity: 0.35,
    text: '#fff0ff', muted: 'rgba(255,240,255,0.65)', accent: '#ffd6ff', chip: 'rgba(255,214,255,0.14)',
    titleFont: "'Dancing Script', cursive", titleShadow: '0 0 14px rgba(255,214,255,0.7)',
    note: { bg: '#fff0ff', text: '#2a1f3d', tape: 'rgba(180,255,200,0.8)' },
    particles: ['✨', '🦋', '✨'], rise: true, corners: ['🍄', '🧚'],
  },
  {
    id: 'paris', label: 'Café de París', emoji: '🥐', blurb: 'Toldo a rayas, croissants y la torre',
    bg: '#f7efe6',
    pattern: 'repeating-linear-gradient(90deg, rgba(181,55,59,0.85) 0 22px, #fff 22px 44px) 0 0 / 100% 26px no-repeat, repeating-linear-gradient(90deg, rgba(181,55,59,0.05) 0 22px, transparent 22px 44px)',
    shade: lightShade('#f7efe6'), imageOpacity: 0.22,
    text: '#3a2a20', muted: 'rgba(58,42,32,0.62)', accent: '#b5373b', chip: 'rgba(181,55,59,0.12)',
    titleFont: "'Dancing Script', cursive",
    note: { bg: '#ffffff', text: '#3a2a20', tape: 'rgba(181,55,59,0.7)' },
    corners: ['🥐', '🗼'],
  },
  {
    id: 'comic', label: 'Cómic', emoji: '💥', blurb: 'Pop art, puntos y onomatopeyas',
    bg: '#ffe14d',
    pattern: 'radial-gradient(circle, rgba(228,0,43,0.35) 2.5px, transparent 3px) 0 0 / 12px 12px',
    shade: lightShade('#ffe14d'), imageOpacity: 0.2,
    text: '#111111', muted: 'rgba(17,17,17,0.68)', accent: '#e4002b', chip: 'rgba(255,255,255,0.75)',
    titleFont: "'Fredoka', sans-serif", titleShadow: '3px 3px 0 #fff, 5px 5px 0 #111',
    note: { bg: '#ffffff', text: '#111111', tape: 'rgba(0,120,255,0.75)' },
    frame: 'inset 0 0 0 5px #111111',
    corners: ['💥', '⚡'],
  },
  {
    id: 'arcade', label: 'Arcade 8-bit', emoji: '👾', blurb: 'Píxeles, monedas y game over',
    bg: '#0a0a12',
    pattern: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px) 0 0 / 8px 8px, linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px) 0 0 / 8px 8px',
    shade: darkShade('#0a0a12'), imageOpacity: 0.3,
    text: '#ffffff', muted: 'rgba(255,255,255,0.62)', accent: '#ffde00', chip: 'rgba(255,222,0,0.14)',
    titleFont: "'Courier New', ui-monospace, monospace", titleShadow: '3px 3px 0 #ff004d',
    note: { bg: '#1d2b53', text: '#ffde00', tape: 'rgba(255,0,77,0.8)' },
    frame: 'inset 0 0 0 4px #ff004d, inset 0 0 0 8px #0a0a12, inset 0 0 0 10px #29adff',
    particles: ['⭐', '🪙'], corners: ['👾', '🕹️'],
  },
]

const KIND_DEFAULT: Record<CollectionKind, string> = {
  libros: 'biblioteca',
  peliculas: 'cine',
  series: 'cine',
  musica: 'neon',
  museo: 'museo',
  otro: 'cine',
}

export function getCardTheme(id: string | null | undefined, kind: CollectionKind = 'otro'): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES.find((t) => t.id === KIND_DEFAULT[kind]) ?? CARD_THEMES[0]!
}

function isLight(hex: string) {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

/** Variables CSS que consume la ficha. */
export function cardThemeVars(t: CardTheme, tint: string): Record<string, string> {
  return {
    '--tint': tint,
    '--bg': t.bg,
    '--pattern': t.pattern ?? 'none',
    '--shade': t.shade,
    '--img-opacity': String(t.imageOpacity),
    '--text': t.text,
    '--muted': t.muted,
    '--accent': t.accent,
    // Sobre el acento: fondo oscuro del estilo en los estilos oscuros, blanco en los claros.
    '--on-accent': isLight(t.bg) ? '#ffffff' : t.bg,
    '--chip': t.chip,
    '--title-font': t.titleFont,
    '--title-shadow': t.titleShadow ?? 'none',
    '--note-bg': t.note.bg,
    '--note-text': t.note.text,
    '--tape': t.note.tape,
    '--frame': t.frame ?? 'none',
  }
}

/** Categorías para filtrar el selector de estilos. */
export const CARD_THEME_GROUPS: { id: string; label: string; ids: string[] }[] = [
  { id: 'asia', label: '⛩️ Asia', ids: ['oriental', 'chino', 'sakura', 'sakura-noche', 'zen', 'samurai', 'buda', 'neon', 'kpop'] },
  { id: 'naturaleza', label: '🌿 Naturaleza', ids: ['bosque', 'valle', 'tropical', 'oceano', 'hadas', 'otono', 'invierno'] },
  { id: 'noche', label: '🌙 Noche', ids: ['cine', 'noche', 'galaxia', 'terror', 'hacker'] },
  { id: 'retro', label: '👾 Retro y pop', ids: ['diner', 'vaporwave', 'arcade', 'comic', 'kawaii'] },
  { id: 'fiestas', label: '🎉 Fiestas', ids: ['mexicano', 'halloween', 'navidad'] },
  { id: 'clasico', label: '📜 Clásico', ids: ['biblioteca', 'museo', 'medieval', 'pirata', 'paris'] },
]
