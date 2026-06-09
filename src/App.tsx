/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from 'react';
import { Tournament, Pair, PadelCategory, TournamentType, GroupMode, TournamentFormat, Match, Group, PlayoffBracket } from './types';
import CreateTournamentForm from './components/CreateTournamentForm';
import TournamentHeader from './components/TournamentHeader';
import PairsList from './components/PairsList';
import GroupStageView from './components/GroupStageView';
import PlayoffBracketView from './components/PlayoffBracketView';
import ScoreModal from './components/ScoreModal';
import RankingPlaceholder from './components/RankingPlaceholder';
import EditTournamentModal from './components/EditTournamentModal';
import { generateId, generateGroups, generateInitialBracket, advanceBracketWinner, getNextMatchSlot } from './utils/tournamentSolver';
import { Trophy, Calendar, Users, Award, ShieldAlert, Folder, Plus } from 'lucide-react';

const LOCAL_STORAGE_KEY_LIST = 'padel_tournaments_list_v3';
const LOCAL_STORAGE_KEY_ACTIVE = 'padel_active_tournament_id_v3';

const INITIAL_PAIRS: Pair[] = [
  { id: '1', player1: 'Agustín Tapia', player2: 'Arturo Coello', registeredAt: Date.now() - 50000 },
  { id: '2', player1: 'Federico Chingotto', player2: 'Alejandro Galán', registeredAt: Date.now() - 40000 },
  { id: '3', player1: 'Martin Di Nenno', player2: 'Franco Stupaczuk', registeredAt: Date.now() - 30000 },
  { id: '4', player1: 'Juan Lebrón', player2: 'Francisco Navarro', registeredAt: Date.now() - 20000 },
  { id: '5', player1: 'Fernando Belasteguín', player2: 'Sanyo Gutiérrez', registeredAt: Date.now() - 10000 },
  { id: '6', player1: 'Jon Sanz', player2: 'Coki Nieto', registeredAt: Date.now() },
];

export default function App() {
  // PWA Installer Trigger state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already running under client standalone frame
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Installer user choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Theme state for visualization preferences
  const [theme, setTheme] = useState<'neutral' | 'lime' | 'orange'>(() => {
    try {
      const savedTheme = localStorage.getItem('padel_theme');
      if (savedTheme === 'neutral' || savedTheme === 'lime' || savedTheme === 'orange') {
        return savedTheme;
      }
    } catch (e) {
      console.error('Error reading theme', e);
    }
    return 'neutral';
  });

  useEffect(() => {
    try {
      localStorage.setItem('padel_theme', theme);
    } catch (e) {
      console.error('Error saving theme', e);
    }
  }, [theme]);

  // Main tabs: "tournament" or "ranking"
  const [activeMainTab, setActiveMainTab] = useState<'tournament' | 'ranking'>('tournament');
  
  // Active stage inside Tournament tab: 'registration' | 'groups' | 'playoffs'
  const [tournamentStage, setTournamentStage] = useState<'registration' | 'groups' | 'playoffs'>('registration');

  // Tournaments lists states
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Derived state for the active tournament
  const tournament = tournaments.find((t) => t.id === activeTournamentId) || null;

  // Score modal state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedList = localStorage.getItem(LOCAL_STORAGE_KEY_LIST);
      const savedActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE);
      
      let list: Tournament[] = [];
      if (savedList) {
        list = JSON.parse(savedList);
      }
      
      if (list.length === 0) {
        // Bootstrap with a nice pre-populated draft tournament so they see immediate action
        const mock: Tournament = {
          id: 'draft_tournament',
          name: 'Open Sunset Padel Cup 🌵',
          category: 'Sexta',
          type: 'CABALLEROS',
          groupMode: '3 parejas',
          format: 'Largo',
          pairs: INITIAL_PAIRS,
          stage: 'registration',
          groups: [],
          bracket: null,
        };
        list = [mock];
      }
      
      setTournaments(list);
      
      let activeId = savedActiveId;
      if (!activeId || !list.some((t) => t.id === activeId)) {
        activeId = list[0].id;
      }
      
      setActiveTournamentId(activeId);
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, activeId);
      
      const activeTourney = list.find((t) => t.id === activeId);
      if (activeTourney) {
        setTournamentStage(activeTourney.stage || 'registration');
      }
    } catch (e) {
      console.error('Error loading tournaments from localStorage', e);
    }
  }, []);

  // Save to list
  const saveTournaments = (updatedList: Tournament[]) => {
    setTournaments(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY_LIST, JSON.stringify(updatedList));
  };

  // Safe save updates to the current active tournament (retains multi-tournament structure)
  const saveTournament = (updated: Tournament | null) => {
    if (updated) {
      const exists = tournaments.some((t) => t.id === updated.id);
      let list = [];
      if (exists) {
        list = tournaments.map((t) => (t.id === updated.id ? updated : t));
      } else {
        list = [...tournaments, updated];
      }
      saveTournaments(list);
      setActiveTournamentId(updated.id);
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, updated.id);
    } else {
      if (activeTournamentId) {
        const list = tournaments.filter((t) => t.id !== activeTournamentId);
        saveTournaments(list);
        if (list.length > 0) {
          setActiveTournamentId(list[0].id);
          localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, list[0].id);
          setTournamentStage(list[0].stage || 'registration');
        } else {
          setActiveTournamentId(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
          setTournamentStage('registration');
        }
      }
    }
  };

  // Create a new tournament
  const handleCreateTournament = (
    name: string,
    category: PadelCategory,
    type: TournamentType,
    groupMode: GroupMode,
    format: TournamentFormat,
    costPerPair?: string
  ) => {
    const newTournament: Tournament = {
      id: `tournament_${generateId()}`,
      name,
      category,
      type,
      groupMode,
      format,
      pairs: [],
      stage: 'registration',
      groups: [],
      bracket: null,
      costPerPair: costPerPair ?? '',
    };
    const list = [...tournaments, newTournament];
    saveTournaments(list);
    setActiveTournamentId(newTournament.id);
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, newTournament.id);
    setTournamentStage('registration');
    setIsCreatingTournament(false);
  };

  // Delete current tournament
  const handleDeleteTournament = () => {
    saveTournament(null);
    setTournamentStage('registration');
  };

  // Add registered Pair
  const handleAddPair = (player1: string, player2: string) => {
    if (!tournament) return;
    const newPair: Pair = {
      id: `pair_${generateId()}`,
      player1,
      player2,
      registeredAt: Date.now(),
    };
    const updated: Tournament = {
      ...tournament,
      pairs: [...tournament.pairs, newPair],
    };
    saveTournament(updated);
  };

  // Remove pair
  const handleRemovePair = (id: string) => {
    if (!tournament) return;
    const updated: Tournament = {
      ...tournament,
      pairs: tournament.pairs.filter((p) => p.id !== id),
    };
    saveTournament(updated);
  };

  // Reorder registered pairs
  const handleReorderPairs = (newPairs: Pair[]) => {
    if (!tournament) return;
    const updated: Tournament = {
      ...tournament,
      pairs: newPairs,
    };
    saveTournament(updated);
  };

  // Assign a group to a pair dynamically
  const handleAssignPairGroup = (pairId: string, groupLetter: string) => {
    if (!tournament) return;
    const updatedPairs = tournament.pairs.map(p => {
      if (p.id === pairId) {
        return { ...p, groupLetter: groupLetter || undefined };
      }
      return p;
    });
    const updated: Tournament = {
      ...tournament,
      pairs: updatedPairs,
    };
    saveTournament(updated);
  };

  // Update Groups / Generate Stage Groups & Matches from manual selections
  const handleUpdateGroupStage = () => {
    if (!tournament) return;
    
    const groupedPairs = tournament.pairs.filter(p => p.groupLetter);
    if (groupedPairs.length === 0) {
      alert('Por favor, asigna un grupo (A-L) a algunas de las parejas antes de actualizar.');
      return;
    }

    const generated = generateGroups(tournament.pairs, tournament.groups);
    
    if (generated.length === 0) {
      alert('No se pudieron generar grupos válidos. Recuerda que los grupos deben tener entre 1 y 8 parejas asignadas.');
      return;
    }

    const updated: Tournament = {
      ...tournament,
      groups: generated,
      stage: 'groups',
      bracket: null, // Reset playoffs bracket on groups rebuild to keep integrity
    };
    
    setTournamentStage('groups');
    saveTournament(updated);
    alert('Fase de grupos actualizada correctamente.');
  };

  // Generate Stage Groups & Matches (standard backward trigger)
  const handleGenerateGroups = () => {
    if (!tournament) return;
    const generated = generateGroups(tournament.pairs, tournament.groups);
    const updated: Tournament = {
      ...tournament,
      groups: generated,
      stage: 'groups',
      bracket: null,
    };
    setTournamentStage('groups');
    saveTournament(updated);
  };

  // Set Stage directly (navigation)
  const handleSetStage = (stage: 'registration' | 'groups' | 'playoffs') => {
    setTournamentStage(stage);
    if (tournament) {
      saveTournament({
        ...tournament,
        stage,
      });
    }
  };

  // Prepare Playoff Bracket setup
  const handleGenerateBracket = (size: '2' | '4' | '8' | '10' | '12' | '16') => {
    if (!tournament) return;
    const bracket = generateInitialBracket(size, tournament.groups, tournament.pairs);
    const updated: Tournament = {
      ...tournament,
      bracket,
      stage: 'playoffs',
    };
    setTournamentStage('playoffs');
    saveTournament(updated);
  };

  // Reset bracket
  const handleResetBracket = () => {
    if (!tournament) return;
    if (confirm('¿Deseas reiniciar el cuadro eliminatorio actual? Se perderán todos los resultados de playoffs cargados hasta el momento.')) {
      const updated: Tournament = {
        ...tournament,
        bracket: null,
      };
      saveTournament(updated);
    }
  };

  // Reset group stage matches to unplayed
  const handleResetGroupStage = () => {
    if (!tournament) return;
    if (confirm('¿Estás seguro de que deseas reiniciar la Fase de Grupos? Se borrarán todos los resultados de partidos cargados en las zonas y también el cuadro de playoffs.')) {
      const updatedGroups = tournament.groups.map(group => ({
        ...group,
        matches: group.matches.map(m => ({
          ...m,
          played: false,
          winnerId: null,
          annulled: false,
          set1: { teamA: 0, teamB: 0 },
          set2: { teamA: 0, teamB: 0 },
          set3: { teamA: 0, teamB: 0 }
        }))
      }));
      const updated: Tournament = {
        ...tournament,
        groups: updatedGroups,
        bracket: null,
      };
      saveTournament(updated);
    }
  };

  // Manual seeding swap inside bracket
  const handleUpdateMatchSeeding = (
    roundName: string,
    matchId: string,
    teamKey: 'teamAId' | 'teamBId',
    pairId: string
  ) => {
    if (!tournament || !tournament.bracket) return;
    const nextBracket = JSON.parse(JSON.stringify(tournament.bracket)) as PlayoffBracket;
    const roundIdx = nextBracket.rounds.findIndex((r) => r.name === roundName);
    if (roundIdx !== -1) {
      const matchIdx = nextBracket.rounds[roundIdx].matches.findIndex((m) => m.id === matchId);
      if (matchIdx !== -1) {
        const match = nextBracket.rounds[roundIdx].matches[matchIdx];
        match[teamKey] = pairId;

        // If it lies in the first round and has BYE activated
        if (roundIdx === 0 && match.bye) {
          if (teamKey === 'teamAId') {
            match.winnerId = pairId || null;
            match.played = !!pairId;
            match.teamBId = ''; // enforce no team B

            // Propagate the winner to the next round immediately
            const { nextMatchIdx, isTeamA } = getNextMatchSlot(
              roundName,
              nextBracket.rounds[roundIdx].matches.length,
              matchIdx
            );

            const nextRound = nextBracket.rounds[roundIdx + 1];
            if (nextRound && nextRound.matches[nextMatchIdx]) {
              const nextMatch = nextRound.matches[nextMatchIdx];
              if (isTeamA) {
                nextMatch.teamAId = pairId || '';
              } else {
                nextMatch.teamBId = pairId || '';
              }

              // Reset next match status if no winner
              if (!pairId) {
                nextMatch.played = false;
                nextMatch.winnerId = null;
                nextMatch.set1 = { teamA: 0, teamB: 0 };
                nextMatch.set2 = { teamA: 0, teamB: 0 };
                nextMatch.set3 = { teamA: 0, teamB: 0 };
              }

              // Propagate clear to subsequent rounds
              const propagateClear = (currRIdx: number, currMIdx: number) => {
                const nextR = currRIdx + 1;
                if (nextR < nextBracket.rounds.length) {
                  const nextRoundConfig = nextBracket.rounds[currRIdx];
                  const { nextMatchIdx: nextM } = getNextMatchSlot(
                    nextRoundConfig.name,
                    nextRoundConfig.matches.length,
                    currMIdx
                  );
                  
                  const targetMatch = nextBracket.rounds[nextR].matches[nextM];
                  if (targetMatch) {
                    targetMatch.played = false;
                    targetMatch.winnerId = null;
                    targetMatch.set1 = { teamA: 0, teamB: 0 };
                    targetMatch.set2 = { teamA: 0, teamB: 0 };
                    targetMatch.set3 = { teamA: 0, teamB: 0 };
                    targetMatch.teamAId = '';
                    targetMatch.teamBId = '';

                    propagateClear(nextR, nextM);
                  }
                }
              };
              propagateClear(roundIdx + 1, nextMatchIdx);
            }
          }
        }

        saveTournament({
          ...tournament,
          bracket: nextBracket,
        });
      }
    }
  };

  // Toggle match BYE status in the first round
  const handleToggleMatchBye = (matchId: string) => {
    if (!tournament || !tournament.bracket) return;
    const nextBracket = JSON.parse(JSON.stringify(tournament.bracket)) as PlayoffBracket;
    const roundIdx = nextBracket.rounds.findIndex((r) => r.matches.some((m) => m.id === matchId));
    if (roundIdx !== -1) {
      const matchIdx = nextBracket.rounds[roundIdx].matches.findIndex((m) => m.id === matchId);
      if (matchIdx !== -1) {
        const match = nextBracket.rounds[roundIdx].matches[matchIdx];
        const isBye = !match.bye;
        match.bye = isBye;

        if (isBye) {
          // If turning on BYE, clear teamB and set teamA as winner if teamA is selected
          match.disabled = false; // Cannot be disabled and have BYE
          match.teamBId = ''; 
          match.set1 = { teamA: 0, teamB: 0 };
          match.set2 = { teamA: 0, teamB: 0 };
          match.set3 = { teamA: 0, teamB: 0 };
          if (match.teamAId) {
            match.winnerId = match.teamAId;
            match.played = true;
          } else {
            match.winnerId = null;
            match.played = false;
          }
        } else {
          // If turning off BYE, reset to unplayed
          match.played = false;
          match.winnerId = null;
          match.set1 = { teamA: 0, teamB: 0 };
          match.set2 = { teamA: 0, teamB: 0 };
          match.set3 = { teamA: 0, teamB: 0 };
        }

        // Determine the next round's slot using correct getNextMatchSlot specs
        const { nextMatchIdx, isTeamA } = getNextMatchSlot(
          nextBracket.rounds[roundIdx].name,
          nextBracket.rounds[roundIdx].matches.length,
          matchIdx
        );

        const nextRound = nextBracket.rounds[roundIdx + 1];
        if (nextRound && nextRound.matches[nextMatchIdx]) {
          const nextMatch = nextRound.matches[nextMatchIdx];
          
          if (isTeamA) {
            nextMatch.teamAId = match.winnerId || '';
          } else {
            nextMatch.teamBId = match.winnerId || '';
          }

          // Reset next match status if previous was cleared
          if (!match.winnerId) {
            nextMatch.played = false;
            nextMatch.winnerId = null;
            nextMatch.set1 = { teamA: 0, teamB: 0 };
            nextMatch.set2 = { teamA: 0, teamB: 0 };
            nextMatch.set3 = { teamA: 0, teamB: 0 };
          }

          // Propagate clear to subsequent rounds
          const propagateClear = (currRIdx: number, currMIdx: number) => {
            const nextR = currRIdx + 1;
            if (nextR < nextBracket.rounds.length) {
              const nextRoundConfig = nextBracket.rounds[currRIdx];
              const { nextMatchIdx: nextM } = getNextMatchSlot(
                nextRoundConfig.name,
                nextRoundConfig.matches.length,
                currMIdx
              );
              
              const targetMatch = nextBracket.rounds[nextR].matches[nextM];
              if (targetMatch) {
                targetMatch.played = false;
                targetMatch.winnerId = null;
                targetMatch.set1 = { teamA: 0, teamB: 0 };
                targetMatch.set2 = { teamA: 0, teamB: 0 };
                targetMatch.set3 = { teamA: 0, teamB: 0 };
                targetMatch.teamAId = '';
                targetMatch.teamBId = '';

                propagateClear(nextR, nextM);
              }
            }
          };
          propagateClear(roundIdx + 1, nextMatchIdx);
        }

        saveTournament({
          ...tournament,
          bracket: nextBracket,
        });
      }
    }
  };

  // Toggle match enabled/disabled (discard)
  const handleToggleMatchDisable = (matchId: string) => {
    if (!tournament || !tournament.bracket) return;
    const nextBracket = JSON.parse(JSON.stringify(tournament.bracket)) as PlayoffBracket;
    const roundIdx = nextBracket.rounds.findIndex((r) => r.matches.some((m) => m.id === matchId));
    if (roundIdx !== -1) {
      const matchIdx = nextBracket.rounds[roundIdx].matches.findIndex((m) => m.id === matchId);
      if (matchIdx !== -1) {
        const match = nextBracket.rounds[roundIdx].matches[matchIdx];
        const isDisabling = !match.disabled;
        match.disabled = isDisabling;

        // Reset current match state (either disabling, or newly re-activated and unplayed)
        match.played = false;
        match.winnerId = null;
        match.set1 = { teamA: 0, teamB: 0 };
        match.set2 = { teamA: 0, teamB: 0 };
        match.set3 = { teamA: 0, teamB: 0 };

        // Determine the next round's slot using correct getNextMatchSlot specs
        const { nextMatchIdx, isTeamA } = getNextMatchSlot(
          nextBracket.rounds[roundIdx].name,
          nextBracket.rounds[roundIdx].matches.length,
          matchIdx
        );

        const nextRound = nextBracket.rounds[roundIdx + 1];
        if (nextRound && nextRound.matches[nextMatchIdx]) {
          const nextMatch = nextRound.matches[nextMatchIdx];
          
          // Reset the team slot in the next round match
          if (isTeamA) {
            nextMatch.teamAId = '';
          } else {
            nextMatch.teamBId = '';
          }

          // Reset next match status
          nextMatch.played = false;
          nextMatch.winnerId = null;
          nextMatch.set1 = { teamA: 0, teamB: 0 };
          nextMatch.set2 = { teamA: 0, teamB: 0 };
          nextMatch.set3 = { teamA: 0, teamB: 0 };

          // Propagate clear to subsequent rounds
          const propagateClear = (currRIdx: number, currMIdx: number) => {
            const nextR = currRIdx + 1;
            if (nextR < nextBracket.rounds.length) {
              const nextRoundConfig = nextBracket.rounds[currRIdx];
              const { nextMatchIdx: nextM } = getNextMatchSlot(
                nextRoundConfig.name,
                nextRoundConfig.matches.length,
                currMIdx
              );
              
              const targetMatch = nextBracket.rounds[nextR].matches[nextM];
              if (targetMatch) {
                targetMatch.played = false;
                targetMatch.winnerId = null;
                targetMatch.set1 = { teamA: 0, teamB: 0 };
                targetMatch.set2 = { teamA: 0, teamB: 0 };
                targetMatch.set3 = { teamA: 0, teamB: 0 };
                targetMatch.teamAId = '';
                targetMatch.teamBId = '';

                propagateClear(nextR, nextM);
              }
            }
          };
          propagateClear(roundIdx + 1, nextMatchIdx);
        }

        saveTournament({
          ...tournament,
          bracket: nextBracket,
        });
      }
    }
  };

  // Record completed match scores
  const handleSaveMatchScore = (
    set1: { teamA: number; teamB: number },
    set2: { teamA: number; teamB: number },
    set3: { teamA: number; teamB: number },
    winnerId: string | null,
    annulled?: boolean
  ) => {
    if (!tournament || !selectedMatch) return;

    // Check if it belongs to group stage or bracket stage
    const isPlayoff = selectedMatch.id.startsWith('playoff');

    if (isPlayoff && tournament.bracket) {
      // Propagation of bracket results detailing set scores
      const nextBracket = advanceBracketWinner(
        tournament.bracket,
        selectedMatch.id,
        winnerId,
        set1,
        set2,
        set3,
        annulled
      );

      saveTournament({
        ...tournament,
        bracket: nextBracket,
      });
    } else {
      // It's a standard group stage match
      const updatedGroups = tournament.groups.map((g) => {
        const containsMatch = g.matches.some((m) => m.id === selectedMatch.id);
        if (!containsMatch) return g;

        return {
          ...g,
          matches: g.matches.map((m) => {
            if (m.id !== selectedMatch.id) return m;
            return {
              ...m,
              set1,
              set2,
              set3,
              winnerId,
              played: true,
              annulled: annulled || false,
            };
          }),
        };
      });

      saveTournament({
        ...tournament,
        groups: updatedGroups,
      });
    }

    setSelectedMatch(null);
  };

  // Check if at least some matches are played so they can advance to playoffs if preferred
  const canAdvanceToPlayoffs = tournament ? tournament.groups.length > 0 : false;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans selection:bg-neutral-950 selection:text-white" data-theme={theme}>
      
      {/* Top Banner Branding Header */}
      <header className="bg-white border-b-2 border-neutral-900 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          
          {/* Centered Theme Selection Buttons above the title (no text/explanation) */}
          <div className="flex items-center gap-2 mb-3" id="theme_selection_buttons">
            <button
              type="button"
              onClick={() => setTheme('neutral')}
              className={`w-3.5 h-3.5 rounded-full bg-neutral-950 border border-neutral-400 cursor-pointer transition ${
                theme === 'neutral' ? 'ring-2 ring-offset-2 ring-neutral-950 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              aria-label="Tema Neutral"
            />
            <button
              type="button"
              onClick={() => setTheme('lime')}
              className={`w-3.5 h-3.5 rounded-full bg-lime-500 border border-lime-300 cursor-pointer transition ${
                theme === 'lime' ? 'ring-2 ring-offset-2 ring-lime-600 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              aria-label="Tema Lime"
            />
            <button
              type="button"
              onClick={() => setTheme('orange')}
              className={`w-3.5 h-3.5 rounded-full bg-orange-600 border border-orange-300 cursor-pointer transition ${
                theme === 'orange' ? 'ring-2 ring-offset-2 ring-orange-600 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              aria-label="Tema Orange"
            />
            
            {showInstallBtn && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="ml-3 px-3 py-1 text-[9px] sm:text-[10px] bg-neutral-950 text-white rounded-full font-mono font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-neutral-800 transition active:scale-95 cursor-pointer border-2 border-neutral-950 shadow-sm animate-bounce"
                title="Instalar Aplicación en Dispositivo"
              >
                <span>📲 INSTALAR APP</span>
              </button>
            )}
          </div>

          {/* Centralized Brand Header Style */}
          <div className="text-center max-w-2xl px-2">
            <h1 className="text-neutral-950 font-serif italic text-4xl sm:text-5xl tracking-tighter leading-none uppercase">
              Generador de Torneos
            </h1>
            <span className="text-[10px] sm:text-xs font-mono tracking-tight text-neutral-500 block mt-3.5 leading-relaxed font-bold uppercase">
              USO LIBRE PARA TORNEOS DE PADEL. NINGUN DERECHO RESERVADO
            </span>
          </div>

          {/* Tab Navigation Menu aligned below the header block */}
          <nav className="flex space-x-1.5 mt-6 justify-center -mb-[2px] z-10" aria-label="Tabs principales">
            <button
              onClick={() => setActiveMainTab('tournament')}
              className={`px-6 py-2.5 text-xs sm:text-sm font-black transition-all rounded-t-xl border-t-2 border-r-2 border-l-2 border-b-0 leading-none cursor-pointer uppercase tracking-tight ${
                activeMainTab === 'tournament'
                  ? 'bg-neutral-50 text-neutral-955 border-neutral-900 font-black'
                  : 'text-neutral-400 hover:text-neutral-950 hover:bg-neutral-50 border-transparent font-medium'
              }`}
            >
              Gestión de Torneos
            </button>
            <button
              onClick={() => setActiveMainTab('ranking')}
              className={`px-6 py-2.5 text-xs sm:text-sm font-black transition-all rounded-t-xl border-t-2 border-r-2 border-l-2 border-b-0 leading-none cursor-pointer uppercase tracking-tight ${
                activeMainTab === 'ranking'
                  ? 'bg-neutral-50 text-neutral-955 border-neutral-900 font-black'
                  : 'text-neutral-400 hover:text-neutral-950 hover:bg-neutral-50 border-transparent font-medium'
              }`}
            >
              Ranking de Jugadores
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {activeMainTab === 'ranking' ? (
          // Tab "Ranking de Jugadores" which contains nothing (as instructed: 'que no contenga nada')
          <RankingPlaceholder />
        ) : (
          // Tab "Gestión de Torneos" (Tournament management)
          <div className="space-y-8 animate-fade-in">
            {/* COMPACT TOURNAMENT LIST & ACTION HEADER */}
            <div className="space-y-3">
              {/* List Header and Create Button */}
              <div className="flex justify-between items-center bg-white text-neutral-950 p-4 border-2 border-neutral-950 rounded-xl">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-950">
                  📁 Mis Torneos ({tournaments.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingTournament(!isCreatingTournament)}
                  className="flex items-center gap-1 text-[10px] bg-neutral-950 hover:bg-neutral-800 active:scale-95 text-white font-black py-1.5 px-3 rounded transition cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="w-3 h-3" />
                  <span>Crear Nuevo Torneo</span>
                </button>
              </div>

              {/* Toggleable Creation Block inside the main directory */}
              {isCreatingTournament && (
                <div className="bg-white border-2 border-neutral-950 p-5 rounded-xl relative animate-scale-up">
                  <div className="flex justify-between items-center mb-3 border-b border-neutral-200 pb-2">
                    <h4 className="text-[10px] font-black uppercase text-neutral-950 tracking-wider">Formulario de Creación</h4>
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingTournament(false)} 
                      className="text-[10px] text-neutral-500 hover:text-neutral-950 font-extrabold cursor-pointer uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                  </div>
                  <CreateTournamentForm onCreate={handleCreateTournament} />
                </div>
              )}

              {/* Compact list */}
              {tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournaments.map((t, index) => {
                    const isActive = t.id === activeTournamentId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveTournamentId(t.id);
                          localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, t.id);
                          setTournamentStage(t.stage || 'registration');
                        }}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer gap-3 ${
                          isActive
                            ? 'border-2 border-neutral-950 bg-neutral-950 text-white'
                            : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-950'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Number List Indicator */}
                          <div className={`w-6 h-6 rounded-full text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 shadow-none border ${
                            isActive ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-100 text-neutral-950 border-neutral-200'
                          }`}>
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0 leading-tight">
                            <h3 className={`font-black text-xs sm:text-sm tracking-tight truncate ${
                              isActive ? 'text-white' : 'text-neutral-950 group-hover:text-black'
                            }`}>
                              {t.name}
                            </h3>

                            <div className="flex items-center gap-1.5 mt-1 flex-wrap font-mono text-[8px]">
                              <span className={`font-bold px-1.5 py-0.5 rounded uppercase leading-none border-0.5 ${
                                isActive ? 'text-neutral-300 bg-neutral-800 border-neutral-700' : 'text-neutral-900 bg-neutral-100 border-neutral-200'
                              }`}>
                                🏆 {t.category}
                              </span>
                              <span className={`font-bold px-1.5 py-0.5 rounded uppercase leading-none border-0.5 ${
                                isActive ? 'text-neutral-300 bg-neutral-800 border-neutral-700' : 'text-neutral-900 bg-neutral-100 border-neutral-300'
                              }`}>
                                {t.type === 'CABALLEROS' ? 'Caballeros' : t.type === 'DAMAS' ? 'Damas' : 'Mixto'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded leading-none flex-shrink-0 border-0.5 ${
                                isActive ? 'text-neutral-400 bg-neutral-900/50 border-neutral-800' : 'text-neutral-500 bg-neutral-50 border-neutral-200'
                              }`}>
                                Parejas: <strong className={isActive ? 'text-white font-extrabold' : 'text-neutral-950 font-extrabold'}>{t.pairs.length}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTournament(t);
                            }}
                            className={`text-[9px] font-black px-2.5 py-1 rounded transition ${
                              isActive
                                ? 'text-neutral-950 bg-white hover:bg-neutral-200'
                                : 'text-neutral-950 bg-white hover:bg-neutral-100 border border-neutral-300 hover:border-neutral-950'
                            }`}
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 p-8 rounded-xl text-center text-neutral-500 text-xs">
                  No tienes ningún torneo creado. Haz clic en "Crear Nuevo Torneo" arriba para empezar.
                </div>
              )}
            </div>

            {/* SELECTED TOURNAMENT DASHBOARD WORKFLOW */}
            {tournament ? (
              <div key={tournament.id} className="border-t border-neutral-200 pt-6 mt-6 space-y-8 animate-fade-in">
                {/* Visual Status Indicator / Steps */}
                <TournamentHeader
                  tournament={tournament}
                  onDelete={handleDeleteTournament}
                  onEdit={() => setEditingTournament(tournament)}
                  activeStage={tournamentStage}
                  onSetStage={handleSetStage}
                />

                {/* Subsections based on tabs */}
                {tournamentStage === 'registration' && (
                  <PairsList
                    pairs={tournament.pairs}
                    onAddPair={handleAddPair}
                    onRemovePair={handleRemovePair}
                    onReorderPairs={handleReorderPairs}
                    onAssignGroup={handleAssignPairGroup}
                    onUpdateGroups={handleUpdateGroupStage}
                    costPerPair={tournament.costPerPair}
                    tournamentName={tournament.name}
                    tournamentCategory={tournament.category}
                    tournamentType={tournament.type}
                  />
                )}

                {tournamentStage === 'groups' && (
                  <GroupStageView
                    groups={tournament.groups}
                    pairs={tournament.pairs}
                    onGenerateGroups={handleGenerateGroups}
                    onSelectMatch={setSelectedMatch}
                    onAdvanceToPlayoffs={() => handleSetStage('playoffs')}
                    canAdvance={canAdvanceToPlayoffs}
                    format={tournament.format}
                    onResetGroups={handleResetGroupStage}
                  />
                )}

                {tournamentStage === 'playoffs' && (
                  <PlayoffBracketView
                    bracket={tournament.bracket}
                    groups={tournament.groups}
                    pairs={tournament.pairs}
                    onGenerateBracket={handleGenerateBracket}
                    onSelectMatch={setSelectedMatch}
                    onUpdateMatchSeeding={handleUpdateMatchSeeding}
                    onResetBracket={handleResetBracket}
                    onToggleMatchDisable={handleToggleMatchDisable}
                    onToggleMatchBye={handleToggleMatchBye}
                    tournamentId={tournament.id}
                    tournamentName={tournament.name}
                    category={tournament.category}
                    type={tournament.type}
                  />
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed p-6 rounded-2xl text-center text-slate-500 text-xs font-medium">
                Selecciona un torneo de la lista anterior para ver su gestión (Inscriptos, Grupos, Playoffs).
              </div>
            )}
          </div>
        )}

      </main>

      {/* SCORE REGISTER MODAL */}
      {selectedMatch && tournament && (
        <ScoreModal
          match={selectedMatch}
          pairs={tournament.pairs}
          format={tournament.format || 'Largo'}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSaveMatchScore}
        />
      )}

      {/* EDIT TOURNAMENT METADATA MODAL */}
      {editingTournament && (
        <EditTournamentModal
          tournament={editingTournament}
          onClose={() => setEditingTournament(null)}
          onSave={(newName, newCategory, newType, newGroupMode, newFormat, newCostPerPair) => {
            const updated = tournaments.map((t) => {
              if (t.id === editingTournament.id) {
                return {
                  ...t,
                  name: newName,
                  category: newCategory,
                  type: newType,
                  groupMode: newGroupMode,
                  format: newFormat,
                  costPerPair: newCostPerPair ?? '',
                };
              }
              return t;
            });
            saveTournaments(updated);
            setEditingTournament(null);
          }}
          onDelete={() => {
            const updated = tournaments.filter((tm) => tm.id !== editingTournament.id);
            saveTournaments(updated);
            if (activeTournamentId === editingTournament.id) {
              if (updated.length > 0) {
                setActiveTournamentId(updated[0].id);
                localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE, updated[0].id);
                setTournamentStage(updated[0].stage || 'registration');
              } else {
                setActiveTournamentId(null);
                localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE);
                setTournamentStage('registration');
              }
            }
            setEditingTournament(null);
          }}
        />
      )}

      {/* Simple elegant layout footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-center text-xs">
        <p>2026 - Uso libre para organizadores de torneos de padel y afines. Consultas a cristian.gomezmartin@gmail.com</p>
      </footer>

    </div>
  );
}
