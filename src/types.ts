export type PadelCategory = string;

export type TournamentType = 'CABALLEROS' | 'DAMAS' | 'MIXTO';

export type GroupMode = '3 parejas' | '4 parejas';

export type TournamentFormat = 'Largo' | 'Mini';

export interface Pair {
  id: string;
  player1: string;
  player2: string;
  registeredAt: number;
  groupLetter?: string; // One of A, B, C, D, E, F, G, H, I, J, K, L
  paymentAmount?: string; // payment amount stored as a short string up to 3 digits
}

export interface SetScore {
  teamA: number;
  teamB: number;
}

export interface Match {
  id: string;
  teamAId: string; // Pair ID or null/empty if not selected yet
  teamBId: string; // Pair ID or null/empty if not selected yet
  set1: SetScore;
  set2: SetScore;
  set3: SetScore; // Deciding set if needed
  winnerId: string | null; // ID of winning Pair or null
  played: boolean;
  roundName: string; // e.g. "Grupo A", "Semifinal 1", "Final"
  annulled?: boolean;
  disabled?: boolean;
  bye?: boolean;
}

export interface Group {
  id: string;
  name: string; // e.g., "Grupo A"
  pairIds: string[];
  matches: Match[];
}

export interface PlayoffRound {
  name: string; // e.g. "Octavos", "Cuartos", "Semifinal", "Final"
  matches: Match[];
}

export interface PlayoffBracket {
  rounds: PlayoffRound[];
}

export interface Tournament {
  id: string;
  name: string;
  category: PadelCategory;
  type: TournamentType;
  groupMode: GroupMode;
  format?: TournamentFormat; // Set as optional or required, but let's make it optional for backward compatibility if any, or just required and handle it. Let's make it required but default to 'Largo' or 'Mini'.
  pairs: Pair[];
  stage: 'registration' | 'groups' | 'playoffs';
  groups: Group[];
  bracket: PlayoffBracket | null;
  costPerPair?: string; // registration cost per pair
}
