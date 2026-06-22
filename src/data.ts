import { Tournament, ThemeConfig } from './types';

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    nombre: 'Torneo Apertura Club Padel Center',
    club: 'Paddle Center Norte',
    fecha: '2026-07-12',
    categoria: 'quinta',
    tipo: 'masculino',
    inscripcionPareja: 40000,
    modo: 'largo',
    canchas: 3,
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    id: 't2',
    nombre: 'Copa San Juan Mixta',
    club: 'Pádel Arena Club',
    fecha: '2026-07-28',
    categoria: 'sexta',
    tipo: 'mixto',
    inscripcionPareja: 35000,
    modo: 'mini',
    canchas: 2,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 't3',
    nombre: 'Challenger Femenino Libre',
    club: 'TieBreak Club',
    fecha: '2026-08-05',
    categoria: 'libre',
    tipo: 'femenino',
    inscripcionPareja: 50000,
    modo: 'largo',
    canchas: 4,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

export const THEMES: ThemeConfig[] = [
  {
    id: 'lined',
    name: 'Estilo Editorial (Monocromo)',
    bgClass: 'bg-white',
    patternClass: 'bg-white',
    fontClass: 'font-mono text-sm leading-relaxed',
    primaryColor: 'border-black',
    buttonAccent: 'bg-white hover:bg-black hover:text-white text-black border-black border-2 font-bold uppercase transition-colors',
    notebookBorder: 'border-l-4 border-black pl-6 sm:pl-8',
    inkColor: 'text-black',
    ruledColor: 'border-black',
  },
  {
    id: 'yellow',
    name: 'Editorial Legal (Amarillo)',
    bgClass: 'bg-amber-50/75',
    patternClass: 'bg-amber-50/75',
    fontClass: 'font-mono text-sm leading-relaxed',
    primaryColor: 'border-yellow-950',
    buttonAccent: 'bg-amber-100 hover:bg-yellow-950 hover:text-white text-yellow-950 border-yellow-950 border-2 font-bold uppercase transition-colors',
    notebookBorder: 'border-l-4 border-yellow-950 pl-6 sm:pl-8',
    inkColor: 'text-yellow-950',
    ruledColor: 'border-yellow-950/20',
  },
  {
    id: 'grid',
    name: 'Cuadrícula Editorial',
    bgClass: 'bg-stone-50',
    patternClass: 'pattern-grid',
    fontClass: 'font-mono text-sm leading-relaxed',
    primaryColor: 'border-zinc-900',
    buttonAccent: 'bg-stone-100 hover:bg-zinc-900 hover:text-white text-zinc-900 border-zinc-900 border-2 font-bold uppercase transition-colors',
    notebookBorder: 'border-l-2 border-zinc-900 border-dashed pl-4 sm:pl-6',
    inkColor: 'text-zinc-900',
    ruledColor: 'border-zinc-200',
  },
  {
    id: 'kraft',
    name: 'Prensa Kraft (Madera)',
    bgClass: 'bg-[#f4efe8]',
    patternClass: 'bg-[#f4efe8]',
    fontClass: 'font-typewriter text-sm leading-relaxed',
    primaryColor: 'border-[#332211]',
    buttonAccent: 'bg-[#e5dacb] hover:bg-[#332211] hover:text-white text-[#332211] border-[#332211] border-2 font-bold uppercase transition-colors',
    notebookBorder: 'border-l-4 border-[#332211] pl-6 sm:pl-8',
    inkColor: 'text-[#332211]',
    ruledColor: 'border-[#332211]/20',
  }
];

export const CATEGORIES_LABELS: Record<string, string> = {
  octava: 'Octava (8ª)',
  septima: 'Séptima (7ª)',
  sexta: 'Sexta (6ª)',
  quinta: 'Quinta (5ª)',
  cuarta: 'Cuarta (4ª)',
  tercera: 'Tercera (3ª)',
  libre: 'Libre (Primera/Súper)',
  otra: 'Otra',
};

export const TYPE_LABELS: Record<string, string> = {
  masculino: 'Masculino ♂',
  femenino: 'Femenino ♀',
  mixto: 'Mixto ⚤',
};

export const MODE_LABELS: Record<string, string> = {
  largo: 'Largo (a 3 sets completos)',
  mini: 'Mini (a 1 set rápido)',
};
