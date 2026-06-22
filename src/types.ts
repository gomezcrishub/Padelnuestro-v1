export type CategoryType = 
  | 'octava' 
  | 'septima' 
  | 'sexta' 
  | 'quinta' 
  | 'cuarta' 
  | 'tercera' 
  | 'libre' 
  | 'otra';

export type TournamentType = 'masculino' | 'femenino' | 'mixto';
export type MatchMode = 'largo' | 'mini'; // 'largo a 3 sets' | 'Mini a 1 set'

export interface Tournament {
  id: string;
  nombre: string;
  club: string;
  fecha: string;
  categoria: CategoryType;
  categoriaOtro?: string; // If 'otra' is selected, custom text input
  tipo: TournamentType;
  inscripcionPareja: number; // Price / details
  modo: MatchMode;
  fechaModo?: string; // Option matching user request for "fecha y modo"
  canchas?: number; // Number of courts available for the tournament
  createdAt: number;
}

export type ThemeType = 'lined' | 'grid' | 'yellow' | 'kraft';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  bgClass: string;
  patternClass: string;
  fontClass: string;
  primaryColor: string;
  buttonAccent: string;
  notebookBorder: string;
  inkColor: string;
  ruledColor?: string;
}

export type ActiveTabType = 'jugadores' | 'grupos' | 'playoffs';
