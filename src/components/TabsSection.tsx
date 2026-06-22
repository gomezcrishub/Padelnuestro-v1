import React, { useState, useEffect } from 'react';
import { ActiveTabType, MatchMode, Tournament } from '../types';
import { Users2, Sliders, Trophy, ArrowRight, Edit3, Trash2, Plus, Copy } from 'lucide-react';
import { CATEGORIES_LABELS, TYPE_LABELS } from '../data';
import { exportMatchesViaAppsScript } from '../utils/googleSheets';

interface RegisteredPair {
  id: string;
  jugador1: string;
  jugador2: string;
  grupo?: string;
  numero?: string;
}

interface MatchDetails {
  matchKey: string;
  i: number;
  j: number;
  pairA: RegisteredPair;
  pairB: RegisteredPair;
}

const getGroupBgColor = (grupo: string | undefined): string => {
  if (!grupo) return 'bg-white hover:bg-neutral-100';
  const colors: Record<string, string> = {
    A: 'bg-red-400 text-black border-black',
    B: 'bg-blue-400 text-black border-black',
    C: 'bg-emerald-400 text-black border-black',
    D: 'bg-amber-400 text-black border-black',
    E: 'bg-indigo-400 text-black border-black',
    F: 'bg-pink-400 text-black border-black',
    G: 'bg-purple-300 text-black border-black',
    H: 'bg-orange-300 text-black border-black',
    I: 'bg-teal-300 text-black border-black',
    J: 'bg-cyan-300 text-black border-black',
    K: 'bg-lime-300 text-black border-black',
    L: 'bg-rose-300 text-black border-black',
    M: 'bg-fuchsia-300 text-black border-black',
    N: 'bg-sky-300 text-black border-black',
    O: 'bg-violet-300 text-black border-black',
    P: 'bg-yellow-300 text-black border-black',
  };
  return colors[grupo.toUpperCase()] || 'bg-stone-300 text-black border-black';
};

interface TabsSectionProps {
  activeTab: ActiveTabType;
  onTabChange: (tab: ActiveTabType) => void;
  selectedTournamentId?: string | null;
  selectedTournament?: Tournament | null;
  fontClass?: string;
  inkColor?: string;
}

export const TabsSection: React.FC<TabsSectionProps> = ({
  activeTab,
  onTabChange,
  selectedTournamentId = null,
  selectedTournament = null,
  fontClass = 'font-mono',
  inkColor = 'text-black',
}) => {
  const prefix = selectedTournamentId ? `${selectedTournamentId}_` : '';
  const PAREJAS_KEY = `padel_${prefix}registered_pairs`;
  const PARTIDOS_SCORES_KEY = `padel_${prefix}partidos_scores`;
  const FASE_GRUPOS_ACTUALIZADA_KEY = `padel_${prefix}fase_grupos_actualizada`;
  const PAREJAS_PARA_GRUPOS_KEY = `padel_${prefix}parejas_para_grupos`;
  const PLAYOFF_TYPE_KEY = `padel_${prefix}playoff_type`;
  const PLAYOFF_MATCHES_KEY = `padel_${prefix}playoff_matches`;

  // Persistent list of registered pairs
  const [parejas, setParejas] = useState<RegisteredPair[]>(() => {
    const saved = localStorage.getItem(PAREJAS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [
          { id: '1', jugador1: 'CARLOS GÓMEZ', jugador2: 'JUAN MARTÍN' },
          { id: '2', jugador1: 'DIEGO PÉREZ', jugador2: 'FACUNDO DÍAZ' },
          { id: '3', jugador1: 'EXEQUIEL ROJAS', jugador2: 'MIGUEL ALVAREZ' },
        ];
      }
    }
    // Backward compatibility or fallback to un-prefixed if selectedTournamentId is not set
    if (!selectedTournamentId) {
      const oldSaved = localStorage.getItem('padel_registered_pairs');
      if (oldSaved) {
        try {
          return JSON.parse(oldSaved);
        } catch {}
      }
    }
    return [
      { id: '1', jugador1: 'CARLOS GÓMEZ', jugador2: 'JUAN MARTÍN' },
      { id: '2', jugador1: 'DIEGO PÉREZ', jugador2: 'FACUNDO DÍAZ' },
      { id: '3', jugador1: 'EXEQUIEL ROJAS', jugador2: 'MIGUEL ALVAREZ' },
    ];
  });

  // Inputs for adding players
  const [jugador1, setJugador1] = useState('');
  const [jugador2, setJugador2] = useState('');

  // Confirmation state for deleting a couple
  const [confirmingParejaId, setConfirmingParejaId] = useState<string | null>(null);

  // Custom pair number states
  const [editingNumeroId, setEditingNumeroId] = useState<string | null>(null);
  const [tempNumeroVal, setTempNumeroVal] = useState('');

  const [circledPairIdsJugadores, setCircledPairIdsJugadores] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('padel_circled_pair_ids_jugadores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [circledPairIdsGrupos, setCircledPairIdsGrupos] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('padel_circled_pair_ids_grupos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [isPairsExpanded, setIsPairsExpanded] = useState(false);
  const [copiedList, setCopiedList] = useState(false);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [tempJugador1, setTempJugador1] = useState('');
  const [tempJugador2, setTempJugador2] = useState('');
  const [tempGrupo, setTempGrupo] = useState('');

   // Google Sheets Export States
   const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
   const [exportErrorMsg, setExportErrorMsg] = useState('');
   const [exportedTabName, setExportedTabName] = useState('');
   const [isExportPasswordModalOpen, setIsExportPasswordModalOpen] = useState(false);
   const [exportPasswordInput, setExportPasswordInput] = useState('');
   const [exportPasswordError, setExportPasswordError] = useState('');

  useEffect(() => {
    localStorage.setItem('padel_circled_pair_ids_jugadores', JSON.stringify(circledPairIdsJugadores));
  }, [circledPairIdsJugadores]);

  useEffect(() => {
    localStorage.setItem('padel_circled_pair_ids_grupos', JSON.stringify(circledPairIdsGrupos));
  }, [circledPairIdsGrupos]);

  const handleUpdateGrupo = (id: string, groupVal: string) => {
    setParejas(prev => prev.map(p => p.id === id ? { ...p, grupo: groupVal } : p));
  };

  const handleSaveNumero = (id: string) => {
    setParejas(prev => prev.map(p => p.id === id ? { ...p, numero: tempNumeroVal.trim() } : p));
    setEditingNumeroId(null);
  };

  // Persistent match scores inside each group
  const [partidosScores, setPartidosScores] = useState<Record<string, { score1: string; score2: string }>>(() => {
    const saved = localStorage.getItem(PARTIDOS_SCORES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(PARTIDOS_SCORES_KEY, JSON.stringify(partidosScores));
  }, [partidosScores, PARTIDOS_SCORES_KEY]);

  const handleUpdateScore = (matchKey: string, playerNum: 1 | 2, value: string) => {
    setPartidosScores(prev => {
      const current = prev[matchKey] || { score1: '', score2: '' };
      return {
        ...prev,
        [matchKey]: {
          ...current,
          [playerNum === 1 ? 'score1' : 'score2']: value
        }
      };
    });
  };

  const [faseGruposActualizada, setFaseGruposActualizada] = useState<boolean>(() => {
    return localStorage.getItem(FASE_GRUPOS_ACTUALIZADA_KEY) === 'true';
  });

  const [parejasParaGrupos, setParejasParaGrupos] = useState<RegisteredPair[]>(() => {
    const saved = localStorage.getItem(PAREJAS_PARA_GRUPOS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const savedMaster = localStorage.getItem(PAREJAS_KEY) || localStorage.getItem('padel_registered_pairs');
    if (savedMaster) {
      try {
        return JSON.parse(savedMaster);
      } catch {
        // fallback
      }
    }
    return [
      { id: '1', jugador1: 'CARLOS GÓMEZ', jugador2: 'JUAN MARTÍN' },
      { id: '2', jugador1: 'DIEGO PÉREZ', jugador2: 'FACUNDO DÍAZ' },
      { id: '3', jugador1: 'EXEQUIEL ROJAS', jugador2: 'MIGUEL ALVAREZ' },
    ];
  });

  useEffect(() => {
    localStorage.setItem(PAREJAS_PARA_GRUPOS_KEY, JSON.stringify(parejasParaGrupos));
  }, [parejasParaGrupos, PAREJAS_PARA_GRUPOS_KEY]);

  const getHasUnsavedGroupChanges = (): boolean => {
    const simplifiedPrev = parejasParaGrupos.map(p => `${p.id}:${p.grupo || ''}`).sort().join(',');
    const simplifiedCurr = parejas.map(p => `${p.id}:${p.grupo || ''}`).sort().join(',');
    return simplifiedPrev !== simplifiedCurr;
  };

  const handleActualizarFaseGrupos = () => {
    setFaseGruposActualizada(true);
    localStorage.setItem(FASE_GRUPOS_ACTUALIZADA_KEY, 'true');
    setParejasParaGrupos(JSON.parse(JSON.stringify(parejas)));
    onTabChange('grupos');
  };

  const handleCopiarLista = () => {
    const groupsWithPairs: Record<string, RegisteredPair[]> = {};
    const ungroupedPairs: RegisteredPair[] = [];

    parejas.forEach(p => {
      if (p.grupo && p.grupo.trim() !== '') {
        const g = p.grupo.trim().toUpperCase();
        if (!groupsWithPairs[g]) {
          groupsWithPairs[g] = [];
        }
        groupsWithPairs[g].push(p);
      } else {
        ungroupedPairs.push(p);
      }
    });

    const sortedGroups = Object.keys(groupsWithPairs).sort();

    let text = '';
    if (selectedTournament) {
      text += `*${selectedTournament.nombre}*\n`;
      const cat = selectedTournament.categoria === 'otra' && selectedTournament.categoriaOtro
        ? selectedTournament.categoriaOtro
        : (CATEGORIES_LABELS[selectedTournament.categoria] || selectedTournament.categoria);
      const gen = TYPE_LABELS[selectedTournament.tipo] || selectedTournament.tipo;
      const genClean = gen.replace(/[♂♀⚤]/g, '').trim();
      text += `${cat} - ${genClean}\n\n`;
    } else {
      text += `*Torneo Apertura Club Padel*\nQuinta - Masculino\n\n`;
    }

    if (ungroupedPairs.length > 0) {
      ungroupedPairs.forEach(p => {
        text += `${p.jugador1} - ${p.jugador2} (pareja sin grupo)\n`;
      });
      text += `\n`;
    }

    sortedGroups.forEach(g => {
      text += `*GRUPO ${g}*\n`;
      groupsWithPairs[g].forEach(p => {
        text += `${p.jugador1} - ${p.jugador2}\n`;
      });
      text += `\n`;
    });

    text = text.trim();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedList(true);
          setTimeout(() => setCopiedList(false), 2000);
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedList(true);
        setTimeout(() => setCopiedList(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  // Find the inscription reference price from active tournaments
  const getInscripcionPrice = (): number => {
    if (selectedTournament) {
      return Number(selectedTournament.inscripcionPareja) || 40000;
    }
    return 40000; // default template value
  };

  // State for courts allocations
  const COURT_ASSIGNMENTS_KEY = `padel_${prefix}court_assignments`;
  const [courtAssignments, setCourtAssignments] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem(COURT_ASSIGNMENTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const COURT_NEXT_ASSIGNMENTS_KEY = `padel_${prefix}court_next_assignments`;
  const [courtNextAssignments, setCourtNextAssignments] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem(COURT_NEXT_ASSIGNMENTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(COURT_ASSIGNMENTS_KEY, JSON.stringify(courtAssignments));
  }, [courtAssignments, COURT_ASSIGNMENTS_KEY]);

  useEffect(() => {
    localStorage.setItem(COURT_NEXT_ASSIGNMENTS_KEY, JSON.stringify(courtNextAssignments));
  }, [courtNextAssignments, COURT_NEXT_ASSIGNMENTS_KEY]);

  // Synchronize when selected tournament changes
  useEffect(() => {
    const saved = localStorage.getItem(COURT_ASSIGNMENTS_KEY);
    if (saved) {
      try {
        setCourtAssignments(JSON.parse(saved));
      } catch {
        setCourtAssignments({});
      }
    } else {
      setCourtAssignments({});
    }

    const savedNext = localStorage.getItem(COURT_NEXT_ASSIGNMENTS_KEY);
    if (savedNext) {
      try {
        setCourtNextAssignments(JSON.parse(savedNext));
      } catch {
        setCourtNextAssignments({});
      }
    } else {
      setCourtNextAssignments({});
    }

    setAssigningCourtNum(null);
    setAssigningNextCourtNum(null);
    setScoringCourtNum(null);
    setCourtScoringError('');
  }, [COURT_ASSIGNMENTS_KEY, COURT_NEXT_ASSIGNMENTS_KEY]);

  const [assigningCourtNum, setAssigningCourtNum] = useState<number | null>(null);
  const [assigningNextCourtNum, setAssigningNextCourtNum] = useState<number | null>(null);
  const [scoringCourtNum, setScoringCourtNum] = useState<number | null>(null);
  const [courtScore1, setCourtScore1] = useState('');
  const [courtScore2, setCourtScore2] = useState('');
  const [courtScoringError, setCourtScoringError] = useState('');

  const [courtSet1A, setCourtSet1A] = useState('');
  const [courtSet1B, setCourtSet1B] = useState('');
  const [courtSet2A, setCourtSet2A] = useState('');
  const [courtSet2B, setCourtSet2B] = useState('');
  const [courtSet3A, setCourtSet3A] = useState('');
  const [courtSet3B, setCourtSet3B] = useState('');

  useEffect(() => {
    if (scoringCourtNum !== null) {
      const assignedKey = courtAssignments[scoringCourtNum];
      const matchInfo = assignedKey ? findMatchByAssignmentKey(assignedKey) : null;
      if (matchInfo) {
        const score = partidosScores[matchInfo.matchKey] || { score1: '', score2: '' };
        const s1 = score.score1.trim();
        const s2 = score.score2.trim();

        const nums1 = s1.split(/\s+/).filter(Boolean);
        const nums2 = s2.split(/\s+/).filter(Boolean);

        setCourtSet1A(nums1[0] || '');
        setCourtSet1B(nums2[0] || '');
        setCourtSet2A(nums1[1] || '');
        setCourtSet2B(nums2[1] || '');
        setCourtSet3A(nums1[2] || '');
        setCourtSet3B(nums2[2] || '');
      } else {
        setCourtSet1A('');
        setCourtSet1B('');
        setCourtSet2A('');
        setCourtSet2B('');
        setCourtSet3A('');
        setCourtSet3B('');
      }
    } else {
      setCourtSet1A('');
      setCourtSet1B('');
      setCourtSet2A('');
      setCourtSet2B('');
      setCourtSet3A('');
      setCourtSet3B('');
    }
  }, [scoringCourtNum, courtAssignments]);

  // Helper to extract all matches of all groups
  const getAllGroupsWithMatches = () => {
    const registeredGroupsMap: Record<string, RegisteredPair[]> = {};
    parejasParaGrupos.forEach(p => {
      if (p.grupo && p.grupo.trim() !== '') {
        const gLetter = p.grupo.trim().toUpperCase();
        if (!registeredGroupsMap[gLetter]) {
          registeredGroupsMap[gLetter] = [];
        }
        registeredGroupsMap[gLetter].push(p);
      }
    });

    const alphabeticalGroups = Object.keys(registeredGroupsMap).sort();

    return alphabeticalGroups.map(gLetter => {
      const grupoPairs = registeredGroupsMap[gLetter];
      const matches: Array<{
        gLetter: string;
        pairA: RegisteredPair;
        pairB: RegisteredPair;
        matchKey: string;
        i: number;
        j: number;
      }> = [];

      for (let i = 0; i < grupoPairs.length; i++) {
        for (let j = i + 1; j < grupoPairs.length; j++) {
          matches.push({
            gLetter,
            pairA: grupoPairs[i],
            pairB: grupoPairs[j],
            matchKey: `match-${gLetter}-${grupoPairs[i].id}-vs-${grupoPairs[j].id}`,
            i: i + 1,
            j: j + 1,
          });
        }
      }

      return {
        gLetter,
        pairs: grupoPairs,
        matches,
      };
    });
  };

  const findMatchByAssignmentKey = (key: string) => {
    const allGroups = getAllGroupsWithMatches();
    for (const g of allGroups) {
      const match = g.matches.find(m => m.matchKey === key);
      if (match) return match;
    }
    return null;
  };

  // Let the user write dynamic notes
  const [playerNotes, setPlayerNotes] = useState('');
  const [groupsNotes, setGroupsNotes] = useState('');
  const [playoffsNotes, setPlayoffsNotes] = useState('');

  // Playoff states
  const [playoffType, setPlayoffType] = useState<'octavos' | 'cuartos' | null>(() => {
    return localStorage.getItem(PLAYOFF_TYPE_KEY) as 'octavos' | 'cuartos' | null;
  });

  const [playoffMatches, setPlayoffMatches] = useState<Record<string, {
    key: string;
    round: 'octavos' | 'cuartos' | 'semis' | 'final';
    sourceTypeA: 'seed' | 'pair' | 'bye' | 'winner' | '';
    sourceValueA: string;
    sourceTypeB: 'seed' | 'pair' | 'bye' | 'winner' | '';
    sourceValueB: string;
    set1A: string;
    set1B: string;
    set2A: string;
    set2B: string;
    set3A: string;
    set3B: string;
  }>>(() => {
    const saved = localStorage.getItem(PLAYOFF_MATCHES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [editingPlayoffSlot, setEditingPlayoffSlot] = useState<{ matchKey: string; slot: 'A' | 'B' } | null>(null);
  const [isArmarCuadroOpen, setIsArmarCuadroOpen] = useState(false);
  const [draftMatches, setDraftMatches] = useState<Record<string, any>>({});
  const [editingPlayoffScores, setEditingPlayoffScores] = useState<string | null>(null);
  const [confirmingResetPlayoffs, setConfirmingResetPlayoffs] = useState(false);

  const isPlayoffMatchCompleted = (m: any): boolean => {
    if (!m) return false;
    const s1A = m.set1A || '';
    const s1B = m.set1B || '';
    const s2A = m.set2A || '';
    const s2B = m.set2B || '';
    const s3A = m.set3A || '';
    const s3B = m.set3B || '';
    
    const hasA = s1A !== '' || s2A !== '' || s3A !== '';
    const hasB = s1B !== '' || s2B !== '' || s3B !== '';
    if (!hasA && !hasB) return false;
    
    const num1A = s1A !== '' ? Number(s1A) : 0;
    const num1B = s1B !== '' ? Number(s1B) : 0;
    const num2A = s2A !== '' ? Number(s2A) : 0;
    const num2B = s2B !== '' ? Number(s2B) : 0;
    const num3A = s3A !== '' ? Number(s3A) : 0;
    const num3B = s3B !== '' ? Number(s3B) : 0;
    
    return (num1A + num1B + num2A + num2B + num3A + num3B) > 0;
  };

  const isOctavosMatchAnnulled = (octavosKey: string): boolean => {
    if (playoffType !== 'octavos') return false;
    
    const map: Record<string, { matchKey: string; slot: 'A' | 'B' }> = {
      'octavos_1': { matchKey: 'cuartos_1', slot: 'A' },
      'octavos_2': { matchKey: 'cuartos_1', slot: 'B' },
      'octavos_3': { matchKey: 'cuartos_2', slot: 'A' },
      'octavos_4': { matchKey: 'cuartos_2', slot: 'B' },
      'octavos_5': { matchKey: 'cuartos_3', slot: 'A' },
      'octavos_6': { matchKey: 'cuartos_3', slot: 'B' },
      'octavos_7': { matchKey: 'cuartos_4', slot: 'A' },
      'octavos_8': { matchKey: 'cuartos_4', slot: 'B' }
    };
    
    const target = map[octavosKey];
    if (!target) return false;
    
    const targetMatch = playoffMatches[target.matchKey];
    if (!targetMatch) return false;
    
    if (target.slot === 'A') {
      return targetMatch.sourceTypeA !== 'winner' || targetMatch.sourceValueA !== octavosKey;
    } else {
      return targetMatch.sourceTypeB !== 'winner' || targetMatch.sourceValueB !== octavosKey;
    }
  };

  useEffect(() => {
    if (confirmingResetPlayoffs) {
      const timer = setTimeout(() => setConfirmingResetPlayoffs(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmingResetPlayoffs]);

  useEffect(() => {
    if (playoffType) {
      localStorage.setItem(PLAYOFF_TYPE_KEY, playoffType);
    } else {
      localStorage.removeItem(PLAYOFF_TYPE_KEY);
    }
    // Also reset editor if type changes
    setEditingPlayoffSlot(null);
  }, [playoffType, PLAYOFF_TYPE_KEY]);

  useEffect(() => {
    localStorage.setItem(PLAYOFF_MATCHES_KEY, JSON.stringify(playoffMatches));
  }, [playoffMatches, PLAYOFF_MATCHES_KEY]);

  const handleOpenArmarCuadro = () => {
    let baseMatches = { ...playoffMatches };
    
    // If not currently in octavos mode, generate octavos outline as draft base
    if (playoffType !== 'octavos') {
      const initialMatches: Record<string, any> = {};
      
      // 8 Octavos matches: sources are editable seeds
      for (let i = 1; i <= 8; i++) {
        initialMatches[`octavos_${i}`] = {
          key: `octavos_${i}`,
          round: 'octavos',
          sourceTypeA: 'seed',
          sourceValueA: '',
          sourceTypeB: 'seed',
          sourceValueB: '',
          set1A: '', set1B: '',
          set2A: '', set2B: '',
          set3A: '', set3B: ''
        };
      }
      
      // 4 Cuartos matches: sources are winners of octavos
      for (let i = 1; i <= 4; i++) {
        initialMatches[`cuartos_${i}`] = {
          key: `cuartos_${i}`,
          round: 'cuartos',
          sourceTypeA: 'winner',
          sourceValueA: `octavos_${(i * 2) - 1}`,
          sourceTypeB: 'winner',
          sourceValueB: `octavos_${i * 2}`,
          set1A: '', set1B: '',
          set2A: '', set2B: '',
          set3A: '', set3B: ''
        };
      }
      
      // Semis (always winners of Cuartos)
      for (let i = 1; i <= 2; i++) {
        initialMatches[`semis_${i}`] = {
          key: `semis_${i}`,
          round: 'semis',
          sourceTypeA: 'winner',
          sourceValueA: `cuartos_${(i * 2) - 1}`,
          sourceTypeB: 'winner',
          sourceValueB: `cuartos_${i * 2}`,
          set1A: '', set1B: '',
          set2A: '', set2B: '',
          set3A: '', set3B: ''
        };
      }
      
      // Final (winners of Semis)
      initialMatches[`final_1`] = {
        key: `final_1`,
        round: 'final',
        sourceTypeA: 'winner',
        sourceValueA: 'semis_1',
        sourceTypeB: 'winner',
        sourceValueB: 'semis_2',
        set1A: '', set1B: '',
        set2A: '', set2B: '',
        set3A: '', set3B: ''
      };
      baseMatches = initialMatches;
    }
    
    setDraftMatches(baseMatches);
    setIsArmarCuadroOpen(true);
  };

  const handleUpdateDraftSlot = (matchKey: string, slot: 'A' | 'B', type: 'seed' | 'pair' | 'bye' | 'winner' | '', value: string) => {
    setDraftMatches(prev => {
      const m = prev[matchKey];
      if (!m) return prev;
      return {
        ...prev,
        [matchKey]: {
          ...m,
          [slot === 'A' ? 'sourceTypeA' : 'sourceTypeB']: type,
          [slot === 'A' ? 'sourceValueA' : 'sourceValueB']: value
        }
      };
    });
  };

  const isOctavosMatchAnnulledInDraft = (octavosKey: string): boolean => {
    const map: Record<string, { matchKey: string; slot: 'A' | 'B' }> = {
      'octavos_1': { matchKey: 'cuartos_1', slot: 'A' },
      'octavos_2': { matchKey: 'cuartos_1', slot: 'B' },
      'octavos_3': { matchKey: 'cuartos_2', slot: 'A' },
      'octavos_4': { matchKey: 'cuartos_2', slot: 'B' },
      'octavos_5': { matchKey: 'cuartos_3', slot: 'A' },
      'octavos_6': { matchKey: 'cuartos_3', slot: 'B' },
      'octavos_7': { matchKey: 'cuartos_4', slot: 'A' },
      'octavos_8': { matchKey: 'cuartos_4', slot: 'B' }
    };
    
    const target = map[octavosKey];
    if (!target) return false;
    
    const match = draftMatches[target.matchKey];
    if (!match) return false;
    
    if (target.slot === 'A') {
      return match.sourceTypeA !== 'winner' || match.sourceValueA !== octavosKey;
    } else {
      return match.sourceTypeB !== 'winner' || match.sourceValueB !== octavosKey;
    }
  };

  const handleCreatePlayoffs = (type: 'octavos' | 'cuartos') => {
    setPlayoffType(type);
    
    const initialMatches: Record<string, any> = {};
    
    if (type === 'octavos') {
      // 8 Octavos matches: sources are editable seeds/pairs/bye
      for (let i = 1; i <= 8; i++) {
        initialMatches[`octavos_${i}`] = {
          key: `octavos_${i}`,
          round: 'octavos',
          sourceTypeA: 'seed',
          sourceValueA: '', // unselected initially
          sourceTypeB: 'seed',
          sourceValueB: '',
          set1A: '', set1B: '',
          set2A: '', set2B: '',
          set3A: '', set3B: ''
        };
      }
      
      // 4 Cuartos matches: sources are winners of octavos
      for (let i = 1; i <= 4; i++) {
        initialMatches[`cuartos_${i}`] = {
          key: `cuartos_${i}`,
          round: 'cuartos',
          sourceTypeA: 'winner',
          sourceValueA: `octavos_${(i * 2) - 1}`,
          sourceTypeB: 'winner',
          sourceValueB: `octavos_${i * 2}`,
          set1A: '', set1B: '',
          set2A: '', set2B: '',
          set3A: '', set3B: ''
        };
      }
    } else {
      // type === 'cuartos'
      // 4 Cuartos matches with editable sources
      for (let i = 1; i <= 4; i++) {
        initialMatches[`cuartos_${i}`] = {
          key: `cuartos_${i}`,
          round: 'cuartos',
          sourceTypeA: 'seed',
          sourceValueA: '',
          sourceTypeB: 'seed',
          sourceValueB: '',
          set1A: '', set1B: '',
          set2A: '', set2B: '',
          set3A: '', set3B: ''
        };
      }
    }
    
    // Semis (always winners of Cuartos)
    for (let i = 1; i <= 2; i++) {
      initialMatches[`semis_${i}`] = {
        key: `semis_${i}`,
        round: 'semis',
        sourceTypeA: 'winner',
        sourceValueA: `cuartos_${(i * 2) - 1}`,
        sourceTypeB: 'winner',
        sourceValueB: `cuartos_${i * 2}`,
        set1A: '', set1B: '',
        set2A: '', set2B: '',
        set3A: '', set3B: ''
      };
    }
    
    // Final (winners of Semis)
    initialMatches[`final_1`] = {
      key: `final_1`,
      round: 'final',
      sourceTypeA: 'winner',
      sourceValueA: 'semis_1',
      sourceTypeB: 'winner',
      sourceValueB: 'semis_2',
      set1A: '', set1B: '',
      set2A: '', set2B: '',
      set3A: '', set3B: ''
    };
    
    setPlayoffMatches(initialMatches);
  };

  const handleSetScoreChange = (matchKey: string, field: string, value: string) => {
    setPlayoffMatches(prev => {
      const match = prev[matchKey];
      if (!match) return prev;
      return {
        ...prev,
        [matchKey]: {
          ...match,
          [field]: value
        }
      };
    });
  };

  const handleUpdatePlayoffSlot = (matchKey: string, slot: 'A' | 'B', type: 'seed' | 'pair' | 'bye' | 'winner', value: string) => {
    setPlayoffMatches(prev => {
      const match = prev[matchKey];
      if (!match) return prev;
      
      const typeKey = slot === 'A' ? 'sourceTypeA' : 'sourceTypeB';
      const valKey = slot === 'A' ? 'sourceValueA' : 'sourceValueB';
      
      return {
        ...prev,
        [matchKey]: {
          ...match,
          [typeKey]: type,
          [valKey]: value
        }
      };
    });
    setEditingPlayoffSlot(null);
  };

  const getGroupStandingPairs = (gLetter: string): RegisteredPair[] => {
    const grupoPairs = parejasParaGrupos.filter(p => p.grupo && p.grupo.trim().toUpperCase() === gLetter.toUpperCase());
    
    // Generate match combinations
    const generatedMatches: MatchDetails[] = [];
    for (let i = 0; i < grupoPairs.length; i++) {
      for (let j = i + 1; j < grupoPairs.length; j++) {
        const pairA = grupoPairs[i];
        const pairB = grupoPairs[j];
        const matchKey = `G_${gLetter}_${pairA.id}_vs_${pairB.id}`;
        generatedMatches.push({
          matchKey,
          i: i + 1,
          j: j + 1,
          pairA,
          pairB
        });
      }
    }

    // Stats calculations
    const statsMap: Record<string, { pg: number; sg: number; dg: number }> = {};
    grupoPairs.forEach(p => {
      statsMap[p.id] = { pg: 0, sg: 0, dg: 0 };
    });

    generatedMatches.forEach(m => {
      const score = partidosScores[m.matchKey];
      if (score && ((score.score1 && score.score1.trim() !== '') || (score.score2 && score.score2.trim() !== ''))) {
        const nums1 = score.score1.match(/\d+/g) || [];
        const nums2 = score.score2.match(/\d+/g) || [];
        const s1A_val = Number(nums1[0]) || 0;
        const s1B_val = Number(nums2[0]) || 0;
        const s2A_val = Number(nums1[1]) || 0;
        const s2B_val = Number(nums2[1]) || 0;
        const s3A_val = Number(nums1[2]) || 0;
        const s3B_val = Number(nums2[2]) || 0;

        let setsA = 0;
        let setsB = 0;
        let gamesA = s1A_val + s2A_val + s3A_val;
        let gamesB = s1B_val + s2B_val + s3B_val;

        if (s1A_val > s1B_val) setsA++;
        if (s1B_val > s1A_val) setsB++;
        if (s2A_val > s2B_val) setsA++;
        if (s2B_val > s2A_val) setsB++;
        if (s3A_val > s3B_val) setsA++;
        if (s3B_val > s3A_val) setsB++;

        let matchWinner: 'A' | 'B' | null = null;
        if (setsA > setsB) matchWinner = 'A';
        else if (setsB > setsA) matchWinner = 'B';
        else if (gamesA > gamesB) matchWinner = 'A';
        else if (gamesB > gamesA) matchWinner = 'B';

        const idA = m.pairA.id;
        const idB = m.pairB.id;

        if (statsMap[idA]) {
          if (matchWinner === 'A') statsMap[idA].pg++;
          statsMap[idA].sg += (setsA - setsB);
          statsMap[idA].dg += (gamesA - gamesB);
        }
        if (statsMap[idB]) {
          if (matchWinner === 'B') statsMap[idB].pg++;
          statsMap[idB].sg += (setsB - setsA);
          statsMap[idB].dg += (gamesB - gamesA);
        }
      }
    });

    const sortedPairs = [...grupoPairs].sort((a, b) => {
      const sA = statsMap[a.id] || { pg: 0, sg: 0, dg: 0 };
      const sB = statsMap[b.id] || { pg: 0, sg: 0, dg: 0 };

      if (sB.pg !== sA.pg) return sB.pg - sA.pg;
      if (sB.sg !== sA.sg) return sB.sg - sA.sg;
      return sB.dg - sA.dg;
    });

    return sortedPairs;
  };

  const getPlayoffMatchWinner = (matchKey: string): { pair: RegisteredPair | null; isBye: boolean; isByeWinner?: boolean } | null => {
    const match = playoffMatches[matchKey];
    if (!match) return null;
    
    const resolvedA = resolvePlayoffSlot(match.sourceTypeA, match.sourceValueA);
    const resolvedB = resolvePlayoffSlot(match.sourceTypeB, match.sourceValueB);
    
    if (resolvedA.isBye && resolvedB.isBye) {
      return null;
    }
    if (resolvedA.isBye) {
      return { pair: resolvedB.pair, isBye: false, isByeWinner: true };
    }
    if (resolvedB.isBye) {
      return { pair: resolvedA.pair, isBye: false, isByeWinner: true };
    }
    
    if (!resolvedA.pair && !resolvedB.pair) {
      return null;
    }
    
    const s1A = Number(match.set1A);
    const s1B = Number(match.set1B);
    const s2A = Number(match.set2A);
    const s2B = Number(match.set2B);
    const s3A = Number(match.set3A);
    const s3B = Number(match.set3B);
    
    const hasS1 = match.set1A !== '' && match.set1B !== '';
    const hasS2 = match.set2A !== '' && match.set2B !== '';
    const hasS3 = match.set3A !== '' && match.set3B !== '';
    
    if (!hasS1) return null;
    
    const isMini = getTournamentModo() === 'mini';
    if (isMini) {
      if (s1A > s1B) {
        return { pair: resolvedA.pair, isBye: false };
      } else if (s1B > s1A) {
        return { pair: resolvedB.pair, isBye: false };
      }
      return null;
    } else {
      let setsA = 0;
      let setsB = 0;
      
      if (hasS1) {
        if (s1A > s1B) setsA++;
        else if (s1B > s1A) setsB++;
      }
      if (hasS2) {
        if (s2A > s2B) setsA++;
        else if (s2B > s2A) setsB++;
      }
      if (hasS3) {
        if (s3A > s3B) setsA++;
        else if (s3B > s3A) setsB++;
      }
      
      if (setsA >= 2) return { pair: resolvedA.pair, isBye: false };
      if (setsB >= 2) return { pair: resolvedB.pair, isBye: false };
      
      return null;
    }
  };

  const resolvePlayoffSlot = (type: string, value: string): { label: string; pair: RegisteredPair | null; isBye: boolean } => {
    if (type === 'bye') {
      return { label: 'BYE 🏃💨', pair: null, isBye: true };
    }
    
    if (type === 'pair') {
      const found = parejasParaGrupos.find(p => p.id === value);
      if (found) {
        return { 
          label: `${found.jugador1} / ${found.jugador2}`, 
          pair: found, 
          isBye: false 
        };
      }
      return { label: 'Pareja Libre...', pair: null, isBye: false };
    }
    
    if (type === 'seed') {
      if (!value) {
        return { label: 'AGREGAR CRUCE ➕', pair: null, isBye: false };
      }
      const parts = value.split('_');
      if (parts.length === 2) {
        const rankIdx = Number(parts[0]) - 1;
        const groupLetter = parts[1].toUpperCase();
        
        const sorted = getGroupStandingPairs(groupLetter);
        const pair = sorted[rankIdx];
        const seedText = `${parts[0]}º GRUPO ${groupLetter}`;
        if (pair) {
          return {
            label: `${seedText}: ${pair.jugador1} / ${pair.numero ? `P${pair.numero}` : pair.jugador2}`,
            pair,
            isBye: false
          };
        }
        return {
          label: `${seedText} (Por definir)`,
          pair: null,
          isBye: false
        };
      }
      return { label: 'Semilla', pair: null, isBye: false };
    }
    
    if (type === 'winner') {
      if (!value) {
        return { label: 'Ganador de partido...', pair: null, isBye: false };
      }
      const previousMatch = playoffMatches[value];
      const matchLabel = value.replace('octavos_', 'Octavos ').replace('cuartos_', 'Cuartos_').replace('semis_', 'Semis ').toUpperCase();
      
      if (!previousMatch) {
         return { label: `Ganador de ${matchLabel}`, pair: null, isBye: false };
      }
      
      const winnerDetails = getPlayoffMatchWinner(previousMatch.key);
      if (winnerDetails && winnerDetails.pair) {
        return {
          label: `Ganador de ${matchLabel}: ${winnerDetails.pair.jugador1} / ${winnerDetails.pair.jugador2}`,
          pair: winnerDetails.pair,
          isBye: winnerDetails.isBye
        };
      }
      return {
        label: `Ganador de ${matchLabel}`,
        pair: null,
        isBye: false
      };
    }
    
    return { label: '(Vacío)', pair: null, isBye: false };
  };

  const getPlayoffGroupLetters = (): string[] => {
    const letters = new Set<string>();
    parejasParaGrupos.forEach(p => {
      if (p.grupo && p.grupo.trim() !== '') {
        letters.add(p.grupo.trim().toUpperCase());
      }
    });
    return Array.from(letters).sort();
  };

  const getStructuredMatchesRows = (): string[][] => {
    const rows: string[][] = [
      ["GRUPO", "PAREJA1", "PAREJA2", "Set1", "Set2", "Set3"]
    ];

    // 1. Group Matches
    const registeredGroupsMap: Record<string, RegisteredPair[]> = {};
    parejasParaGrupos.forEach(p => {
      if (p.grupo && p.grupo.trim() !== '') {
        const gLetter = p.grupo.trim().toUpperCase();
        if (!registeredGroupsMap[gLetter]) {
          registeredGroupsMap[gLetter] = [];
        }
        registeredGroupsMap[gLetter].push(p);
      }
    });

    const alphabeticalGroups = Object.keys(registeredGroupsMap).sort();

    alphabeticalGroups.forEach(gLetter => {
      const grupoPairs = registeredGroupsMap[gLetter];
      for (let i = 0; i < grupoPairs.length; i++) {
        for (let j = i + 1; j < grupoPairs.length; j++) {
          const mKey = `match-${gLetter}-${grupoPairs[i].id}-vs-${grupoPairs[j].id}`;
          const score = partidosScores[mKey] || { score1: '', score2: '' };
          
          const s1 = score.score1.trim();
          const s2 = score.score2.trim();
          const nums1 = s1.match(/\d+/g)?.map(Number) || [];
          const nums2 = s2.match(/\d+/g)?.map(Number) || [];
          
          const set1 = (nums1[0] !== undefined && nums2[0] !== undefined) ? `${nums1[0]}-${nums2[0]}` : '';
          const set2 = (nums1[1] !== undefined && nums2[1] !== undefined) ? `${nums1[1]}-${nums2[1]}` : '';
          const set3 = (nums1[2] !== undefined && nums2[2] !== undefined) ? `${nums1[2]}-${nums2[2]}` : '';

          rows.push([
            gLetter,
            `${grupoPairs[i].jugador1} / ${grupoPairs[i].jugador2}`,
            `${grupoPairs[j].jugador1} / ${grupoPairs[j].jugador2}`,
            set1,
            set2,
            set3
          ]);
        }
      }
    });

    // 2. Playoff Matches
    // Octavos
    if (playoffType === 'octavos') {
      for (let i = 1; i <= 8; i++) {
        const mKey = `octavos_${i}`;
        const m = playoffMatches[mKey] || { set1A: '', set1B: '', set2A: '', set2B: '', set3A: '', set3B: '', sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
        const resolvedA = resolvePlayoffSlot(m.sourceTypeA, m.sourceValueA);
        const resolvedB = resolvePlayoffSlot(m.sourceTypeB, m.sourceValueB);
        
        const pareja1 = resolvedA.pair ? `${resolvedA.pair.jugador1} / ${resolvedA.pair.jugador2}` : '';
        const pareja2 = resolvedB.pair ? `${resolvedB.pair.jugador1} / ${resolvedB.pair.jugador2}` : '';
        
        const set1 = (m.set1A !== '' && m.set1B !== '') ? `${m.set1A}-${m.set1B}` : '';
        const set2 = (m.set2A !== '' && m.set2B !== '') ? `${m.set2A}-${m.set2B}` : '';
        const set3 = (m.set3A !== '' && m.set3B !== '') ? `${m.set3A}-${m.set3B}` : '';
        
        rows.push([
          `Octavos${i}`,
          pareja1,
          pareja2,
          set1,
          set2,
          set3
        ]);
      }
    }

    // Cuartos
    const totalCuartos = 4;
    for (let i = 1; i <= totalCuartos; i++) {
      const mKey = `cuartos_${i}`;
      const m = playoffMatches[mKey] || { set1A: '', set1B: '', set2A: '', set2B: '', set3A: '', set3B: '', sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
      const resolvedA = resolvePlayoffSlot(m.sourceTypeA, m.sourceValueA);
      const resolvedB = resolvePlayoffSlot(m.sourceTypeB, m.sourceValueB);
      
      const pareja1 = resolvedA.pair ? `${resolvedA.pair.jugador1} / ${resolvedA.pair.jugador2}` : '';
      const pareja2 = resolvedB.pair ? `${resolvedB.pair.jugador1} / ${resolvedB.pair.jugador2}` : '';
      
      const set1 = (m.set1A !== '' && m.set1B !== '') ? `${m.set1A}-${m.set1B}` : '';
      const set2 = (m.set2A !== '' && m.set2B !== '') ? `${m.set2A}-${m.set2B}` : '';
      const set3 = (m.set3A !== '' && m.set3B !== '') ? `${m.set3A}-${m.set3B}` : '';
      
      rows.push([
        `cuartos${i}`,
        pareja1,
        pareja2,
        set1,
        set2,
        set3
      ]);
    }

    // Semis
    for (let i = 1; i <= 2; i++) {
      const mKey = `semis_${i}`;
      const m = playoffMatches[mKey] || { set1A: '', set1B: '', set2A: '', set2B: '', set3A: '', set3B: '', sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
      const resolvedA = resolvePlayoffSlot(m.sourceTypeA, m.sourceValueA);
      const resolvedB = resolvePlayoffSlot(m.sourceTypeB, m.sourceValueB);
      
      const pareja1 = resolvedA.pair ? `${resolvedA.pair.jugador1} / ${resolvedA.pair.jugador2}` : '';
      const pareja2 = resolvedB.pair ? `${resolvedB.pair.jugador1} / ${resolvedB.pair.jugador2}` : '';
      
      const set1 = (m.set1A !== '' && m.set1B !== '') ? `${m.set1A}-${m.set1B}` : '';
      const set2 = (m.set2A !== '' && m.set2B !== '') ? `${m.set2A}-${m.set2B}` : '';
      const set3 = (m.set3A !== '' && m.set3B !== '') ? `${m.set3A}-${m.set3B}` : '';
      
      rows.push([
        `semi${i}`,
        pareja1,
        pareja2,
        set1,
        set2,
        set3
      ]);
    }

    // Final
    const mKeyFinal = `final_1`;
    const mFinal = playoffMatches[mKeyFinal] || { set1A: '', set1B: '', set2A: '', set2B: '', set3A: '', set3B: '', sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
    const resolvedAFinal = resolvePlayoffSlot(mFinal.sourceTypeA, mFinal.sourceValueA);
    const resolvedBFinal = resolvePlayoffSlot(mFinal.sourceTypeB, mFinal.sourceValueB);
    
    const pareja1Final = resolvedAFinal.pair ? `${resolvedAFinal.pair.jugador1} / ${resolvedAFinal.pair.jugador2}` : '';
    const pareja2Final = resolvedBFinal.pair ? `${resolvedBFinal.pair.jugador1} / ${resolvedBFinal.pair.jugador2}` : '';
    
    const set1Final = (mFinal.set1A !== '' && mFinal.set1B !== '') ? `${mFinal.set1A}-${mFinal.set1B}` : '';
    const set2Final = (mFinal.set2A !== '' && mFinal.set2B !== '') ? `${mFinal.set2A}-${mFinal.set2B}` : '';
    const set3Final = (mFinal.set3A !== '' && mFinal.set3B !== '') ? `${mFinal.set3A}-${mFinal.set3B}` : '';
    
    rows.push([
      `final`,
      pareja1Final,
      pareja2Final,
      set1Final,
      set2Final,
      set3Final
    ]);

    return rows;
  };

  const handleExportToGoogleSheets = async () => {
    try {
      setExportStatus('exporting');
      setExportErrorMsg('');

      // Build data rows
      const rows = getStructuredMatchesRows();

      // Gather tournament & category names
      const tName = selectedTournament?.nombre || 'Torneo de Padel';
      const catVal = selectedTournament?.categoria || 'libre';
      const catLabel = catVal === 'otra' ? (selectedTournament?.categoriaOtro || 'Otra') : catVal.toUpperCase();

      const spreadsheetId = '1gEJPn4l5OIzl28Fj1DrF_KhrGRuIkKGBovap4PZpBbw';

      const result = await exportMatchesViaAppsScript(
        spreadsheetId,
        tName,
        catLabel,
        rows
      );

      setExportedTabName(result.sheetTitle);
      setExportStatus('success');
    } catch (err: any) {
      console.error(err);
      setExportStatus('error');
      setExportErrorMsg(err.message || 'Ocurrió un error inesperado al intentar exportar los partidos.');
    }
  };

  // Score pop-up modal states
  const [activeScoreModal, setActiveScoreModal] = useState<{
    matchKey: string;
    gLetter: string;
    i: number;
    j: number;
    pairA: RegisteredPair;
    pairB: RegisteredPair;
  } | null>(null);

  const [set1A, setSet1A] = useState('');
  const [set1B, setSet1B] = useState('');
  const [set2A, setSet2A] = useState('');
  const [set2B, setSet2B] = useState('');
  const [set3A, setSet3A] = useState('');
  const [set3B, setSet3B] = useState('');

  const getTournamentModo = (): MatchMode => {
    if (selectedTournament) {
      return selectedTournament.modo || 'largo';
    }
    return 'largo';
  };

  // Synchronize set inputs when the modal opens
  useEffect(() => {
    if (activeScoreModal) {
      const score = partidosScores[activeScoreModal.matchKey] || { score1: '', score2: '' };
      const nums1 = score.score1.match(/\d+/g) || [];
      const nums2 = score.score2.match(/\d+/g) || [];
      
      setSet1A(nums1[0] !== undefined ? String(nums1[0]) : '');
      setSet1B(nums2[0] !== undefined ? String(nums2[0]) : '');
      
      setSet2A(nums1[1] !== undefined ? String(nums1[1]) : '');
      setSet2B(nums2[1] !== undefined ? String(nums2[1]) : '');
      
      setSet3A(nums1[2] !== undefined ? String(nums1[2]) : '');
      setSet3B(nums2[2] !== undefined ? String(nums2[2]) : '');
    } else {
      setSet1A('');
      setSet1B('');
      setSet2A('');
      setSet2B('');
      setSet3A('');
      setSet3B('');
    }
  }, [activeScoreModal, partidosScores]);

  const handleSaveModalScore = () => {
    if (!activeScoreModal) return;
    const isMini = getTournamentModo() === 'mini';
    
    let score1Val = '';
    let score2Val = '';

    if (isMini) {
      score1Val = set1A.trim();
      score2Val = set1B.trim();
    } else {
      const p1: string[] = [];
      const p2: string[] = [];

      if (set1A.trim() !== '' || set1B.trim() !== '') {
        p1.push(set1A.trim() || '0');
        p2.push(set1B.trim() || '0');
      }
      if (set2A.trim() !== '' || set2B.trim() !== '') {
        if (p1.length === 0) {
          p1.push('0');
          p2.push('0');
        }
        p1.push(set2A.trim() || '0');
        p2.push(set2B.trim() || '0');
      }
      if (set3A.trim() !== '' || set3B.trim() !== '') {
        while (p1.length < 2) {
          p1.push('0');
          p2.push('0');
        }
        p1.push(set3A.trim() || '0');
        p2.push(set3B.trim() || '0');
      }
      
      score1Val = p1.join(' ');
      score2Val = p2.join(' ');
    }

    setPartidosScores(prev => {
      return {
        ...prev,
        [activeScoreModal.matchKey]: {
          score1: score1Val,
          score2: score2Val
        }
      };
    });

    setActiveScoreModal(null);
  };

  useEffect(() => {
    localStorage.setItem(PAREJAS_KEY, JSON.stringify(parejas));
  }, [parejas, PAREJAS_KEY]);

  useEffect(() => {
    if (confirmingParejaId) {
      const timer = setTimeout(() => setConfirmingParejaId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingParejaId]);

  const handleAddPareja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugador1.trim() || !jugador2.trim()) return;
    const newPair: RegisteredPair = {
      id: 'pair-' + Math.random().toString(36).substr(2, 9),
      jugador1: jugador1.trim().toUpperCase(),
      jugador2: jugador2.trim().toUpperCase(),
    };
    setParejas(prev => [...prev, newPair]);
    setJugador1('');
    setJugador2('');
  };

  const handleDeletePareja = (id: string) => {
    if (confirmingParejaId === id) {
      setParejas(prev => prev.filter(p => p.id !== id));
      setConfirmingParejaId(null);
    } else {
      setConfirmingParejaId(id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'jugadores':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <Users2 size={20} className="stroke-[2.5]" />
              <h4 className="text-lg font-black uppercase tracking-tight">01 // REGISTRO DE JUGADORES</h4>
            </div>

            {/* Inscription Form */}
            <form onSubmit={handleAddPareja} className="bg-stone-50 border-4 border-black p-4 space-y-4">
              <span className="text-[10px] uppercase tracking-widest font-black block border-b border-black/20 pb-1">
                📝 Nueva Inscripción Directa
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1">
                    Jugador 1:
                  </label>
                  <input
                    type="text"
                    required
                    value={jugador1}
                    onChange={(e) => setJugador1(e.target.value)}
                    placeholder="E.G. JULIÁN GÓMEZ"
                    className="w-full bg-white border-2 border-black outline-none px-2 py-1.5 text-xs font-bold uppercase focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-1">
                    Jugador 2:
                  </label>
                  <input
                    type="text"
                    required
                    value={jugador2}
                    onChange={(e) => setJugador2(e.target.value)}
                    placeholder="E.G. MARCOS MARTÍN"
                    className="w-full bg-white border-2 border-black outline-none px-2 py-1.5 text-xs font-bold uppercase focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs uppercase font-black border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} className="stroke-[3]" /> Inscribir Pareja
                </button>
              </div>
            </form>

            {/* List of Registered Pairs */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b-2 border-black pb-1 select-none font-mono">
                <span className="text-[10px] uppercase tracking-widest font-black">
                  👥 PAREJAS INSCRIPTAS ({parejas.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsPairsExpanded(prev => !prev)}
                  className="text-[9px] font-black uppercase tracking-wider bg-black text-white hover:bg-neutral-800 px-2 py-1 border border-black cursor-pointer transition-colors"
                >
                  {isPairsExpanded ? 'Ocultar info' : 'Expandir info'}
                </button>
              </div>

              {parejas.length > 0 ? (
                <ol className="list-none space-y-6 bg-white font-mono select-none">
                  {parejas.map((p, index) => {
                    const isEditing = editingPairId === p.id;
                    const refPrice = getInscripcionPrice();
                    const currentPaid = p.numero ? parseInt(p.numero, 10) || 0 : 0;
                    const isPaidFull = currentPaid >= refPrice;

                    return (
                      <li key={p.id} className="text-xs text-left">
                        {isEditing ? (
                          /* EDITING MODE CONTAINER: cleanly bounded */
                          <div className="border-2 border-black p-3 bg-neutral-50 space-y-3 font-mono">
                            <div className="text-[10px] font-black uppercase tracking-wider text-black">
                              Editar Pareja #{index + 1}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">
                                  Jugador 1:
                                </label>
                                <input 
                                  type="text"
                                  value={tempJugador1}
                                  onChange={(e) => setTempJugador1(e.target.value.toUpperCase())}
                                  className="w-full bg-white border-2 border-black outline-none px-2 py-1 text-xs font-bold uppercase focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black uppercase text-neutral-500 mb-0.5">
                                  Jugador 2:
                                </label>
                                <input 
                                  type="text"
                                  value={tempJugador2}
                                  onChange={(e) => setTempJugador2(e.target.value.toUpperCase())}
                                  className="w-full bg-white border-2 border-black outline-none px-2 py-1 text-xs font-bold uppercase focus:bg-white"
                                />
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-stone-300">
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] font-black uppercase text-neutral-500">
                                  Grupo:
                                </label>
                                <select
                                  value={tempGrupo}
                                  onChange={(e) => setTempGrupo(e.target.value)}
                                  className="bg-white border-2 border-black text-xs font-bold px-1.5 py-0.5 outline-none cursor-pointer"
                                >
                                  <option value="">-</option>
                                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].map((char) => (
                                    <option key={char} value={char}>{char}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirmingParejaId === p.id) {
                                      handleDeletePareja(p.id);
                                      setEditingPairId(null);
                                      setConfirmingParejaId(null);
                                    } else {
                                      setConfirmingParejaId(p.id);
                                    }
                                  }}
                                  className={`px-2 py-1 text-[9px] font-black uppercase border-2 cursor-pointer transition-colors ${
                                    confirmingParejaId === p.id 
                                      ? 'bg-red-600 text-white border-black animate-pulse shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                                      : 'bg-white text-red-600 border-black hover:bg-red-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]'
                                  }`}
                                >
                                  {confirmingParejaId === p.id ? '¿Confirmar?' : 'Eliminar'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPairId(null);
                                    setConfirmingParejaId(null);
                                  }}
                                  className="px-2 py-1 text-[9px] font-black uppercase bg-stone-100 text-stone-700 border-2 border-black hover:bg-stone-200 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
                                >
                                  Cancelar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (tempJugador1.trim() && tempJugador2.trim()) {
                                      setParejas(prev => prev.map(item => item.id === p.id ? { 
                                        ...item, 
                                        jugador1: tempJugador1.trim().toUpperCase(), 
                                        jugador2: tempJugador2.trim().toUpperCase(), 
                                        grupo: tempGrupo || undefined 
                                      } : item));
                                      setEditingPairId(null);
                                      setConfirmingParejaId(null);
                                    }
                                  }}
                                  className="px-2 py-1 text-[9px] font-black uppercase bg-black text-white hover:bg-neutral-800 border-2 border-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* STANDARD SIMPLE VIEW / TEXT-ONLY, NO BOXES OR LINES */
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-1.5 font-mono">
                            <div className="flex items-start gap-3">
                              {/* Custom label replacement inside normal li lists */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCircledPairIdsJugadores(prev => ({
                                    ...prev,
                                    [p.id]: !prev[p.id]
                                  }));
                                }}
                                className={`w-6 h-6 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 text-[11px] shrink-0 ${
                                  circledPairIdsJugadores[p.id]
                                    ? 'border-2 border-black bg-white text-black font-extrabold focus:ring-1 focus:ring-black shadow-[1px_1px_0px_rgba(0,0,0,1)] text-[10px]' 
                                    : 'text-neutral-400 hover:text-neutral-600 font-extrabold'
                                }`}
                                title="Alternar círculo en el número de pareja"
                              >
                                {index + 1}
                              </button>

                              {/* Group badge (circle and color, always present) */}
                              <div 
                                className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center relative hover:brightness-95 transition-all cursor-pointer shrink-0 ${getGroupBgColor(p.grupo)}`} 
                                title={`Asignar grupo (A a P). Actual: ${p.grupo || 'Ninguno'}`}
                              >
                                <select
                                  value={p.grupo || ''}
                                  onChange={(e) => handleUpdateGrupo(p.id, e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer text-center"
                                >
                                  <option value="">-</option>
                                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].map((char) => (
                                    <option key={char} value={char}>{char}</option>
                                  ))}
                                </select>
                                <span className="text-[10px] font-black pointer-events-none">
                                  {p.grupo || '-'}
                                </span>
                              </div>

                              {/* Names stacked vertically as "Solo texto" */}
                              <div className="flex flex-col select-text leading-tight pt-0.5">
                                <span className="font-black text-black uppercase">{p.jugador1}</span>
                                <span className="text-zinc-500 font-semibold uppercase">{p.jugador2}</span>

                                {/* Expanded info: showing payment/seña details only if isPairsExpanded is true */}
                                {isPairsExpanded && (
                                  <div className="flex items-center gap-2 mt-1.5 select-none animate-fadeIn">
                                    <span className="text-[9px] font-black uppercase text-neutral-400">
                                      Seña / Pago:
                                    </span>
                                    <div 
                                      className={`h-6 rounded-full border-2 border-black flex items-center justify-center transition-colors relative cursor-pointer shrink-0 ${
                                        p.numero ? 'min-w-[48px] px-1.5' : 'w-6'
                                      } ${
                                        isPaidFull 
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold' 
                                          : 'bg-amber-100 hover:bg-amber-200 text-black'
                                      }`} 
                                      title={isPaidFull 
                                        ? `Pago completo: $${currentPaid.toLocaleString('es-AR')}`
                                        : `Haga click para fijar valor de seña`
                                      }
                                    >
                                      {editingNumeroId === p.id ? (
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          value={tempNumeroVal}
                                          autoFocus
                                          onChange={(e) => setTempNumeroVal(e.target.value.replace(/\D/g, ''))}
                                          onBlur={() => handleSaveNumero(p.id)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveNumero(p.id);
                                            if (e.key === 'Escape') setEditingNumeroId(null);
                                          }}
                                          className="absolute inset-0 w-full h-full text-center bg-amber-200 text-[9px] font-black border-none outline-none p-0 cursor-text rounded-full text-black"
                                        />
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingNumeroId(p.id);
                                            setTempNumeroVal(p.numero || '');
                                          }}
                                          className={`w-full h-full text-center flex items-center justify-center text-[9px] font-black cursor-pointer ${
                                            isPaidFull ? 'text-white' : 'text-black'
                                          }`}
                                        >
                                          {p.numero ? `$${currentPaid.toLocaleString('es-AR')}` : '$'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action area: replace trash button with Edit option button */}
                            <div className="flex items-center gap-2 self-end md:self-start md:ml-auto select-none pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPairId(p.id);
                                  setTempJugador1(p.jugador1);
                                  setTempJugador2(p.jugador2);
                                  setTempGrupo(p.grupo || '');
                                }}
                                className="text-[9px] font-bold uppercase tracking-wider text-black bg-stone-100 hover:bg-stone-200 px-2 py-0.5 border border-black cursor-pointer shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-0 transition-all font-mono"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="p-8 text-center bg-stone-50 border-2 border-black border-dashed">
                  <p className="text-xs uppercase font-bold tracking-wider opacity-60 font-mono">
                    No hay parejas anotadas todavía. Completa el formulario de arriba.
                  </p>
                </div>
              )}
            </div>

            {/* BUTTON TO RE-CALCULATE AND JUMP TO GROUPS TAB */}
            <div className="mt-2 mb-2">
              <button
                type="button"
                onClick={handleActualizarFaseGrupos}
                className={`w-full py-3.5 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all border-2 border-black flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  getHasUnsavedGroupChanges()
                    ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                title="Sincronizar zonas y generar liga todos contra todos en la pestaña Grupos"
              >
                <Sliders size={16} className="stroke-[3]" />
                {getHasUnsavedGroupChanges() ? '⚠️ CAMBIOS PENDIENTES // ACTUALIZAR FASE GRUPOS 🎾' : 'ACTUALIZAR FASE GRUPOS 🎾'}
              </button>
            </div>

            {/* BUTTON TO COPY THE STRUCTURED PAIRS LIST */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleCopiarLista}
                className={`w-full py-2.5 border-2 border-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  copiedList
                    ? 'bg-emerald-100 text-emerald-900 border-black'
                    : 'bg-[#ffeb2a] hover:bg-[#ffe31a] text-black'
                }`}
                title="Copiar lista de parejas ordenada por grupos al portapapeles"
              >
                <Copy size={16} className="stroke-[2.5]" />
                {copiedList ? '📋 ¡Lista Copiada!' : '🖨️ COPIAR LISTA'}
              </button>
            </div>


          </div>
        );

      case 'grupos': {
        const registeredGroupsMap: Record<string, RegisteredPair[]> = {};
        parejasParaGrupos.forEach(p => {
          if (p.grupo && p.grupo.trim() !== '') {
            const gLetter = p.grupo.trim().toUpperCase();
            if (!registeredGroupsMap[gLetter]) {
              registeredGroupsMap[gLetter] = [];
            }
            registeredGroupsMap[gLetter].push(p);
          }
        });
        const alphabeticalGroups = Object.keys(registeredGroupsMap).sort();

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="stroke-[2.5]" />
                <h4 className="text-lg font-black uppercase tracking-tight">02 // PLANILLA DE FASE DE GRUPOS</h4>
              </div>

              {alphabeticalGroups.length > 0 && (
                <button
                  onClick={handleActualizarFaseGrupos}
                  className={`text-[10px] font-black uppercase border px-2 py-1 transition-all cursor-pointer ${
                    getHasUnsavedGroupChanges()
                      ? 'border-amber-600 bg-amber-500 text-white animate-pulse'
                      : 'border-black bg-stone-100 hover:bg-neutral-200'
                  }`}
                  title={getHasUnsavedGroupChanges() ? "Hay cambios de grupo sin guardar. Sincroniza ahora" : "Volver a sincronizar"}
                >
                  {getHasUnsavedGroupChanges() ? 'Sincronizar Cambios ⚠️' : 'Sincronizar Fixture 🔄'}
                </button>
              )}
            </div>

            {/* If no groups are configured yet */}
            {alphabeticalGroups.length === 0 ? (
              <div className="border-4 border-black border-dashed p-6 bg-amber-50 space-y-3">
                <h5 className="font-black text-xs uppercase tracking-wider text-black">
                  ⚠️ Fixture No Inicializado / Sin Grupos
                </h5>
                <p className="text-xs leading-relaxed text-black/80 font-mono">
                  No hay grupos asignados a las parejas todavía. Para organizar la fase de grupos:
                </p>
                <ol className="list-decimal text-xs pl-4 font-mono space-y-1 text-black/90">
                  <li>Ve a la pestaña de <b className="underline">PAREJAS</b>.</li>
                  <li>Usa el segundo círculo pequeño <b className="px-1 border border-black bg-white">G</b> de cada pareja para elegir su grupo (A - P).</li>
                  <li>Al final de la lista de parejas, haz clic en el botón verde <b className="bg-emerald-600 text-white px-1">ACTUALIZAR FASE GRUPOS</b>.</li>
                </ol>
              </div>
            ) : (
              <div className="overflow-x-auto w-full scrollbar-thin -mx-2 sm:-mx-4 px-2 sm:px-4">
                <div className="space-y-8 min-w-[620px] pb-4 bg-white">
                  {alphabeticalGroups.map((gLetter) => {
                  const grupoPairs = registeredGroupsMap[gLetter];
                  
                  // Generate combination pairings for round-robin matching: 1vs2, 1vs3, 2vs3, etc.
                  const generatedMatches: Array<{
                    i: number;
                    j: number;
                    pairA: RegisteredPair;
                    pairB: RegisteredPair;
                    matchKey: string;
                  }> = [];

                  for (let i = 0; i < grupoPairs.length; i++) {
                    for (let j = i + 1; j < grupoPairs.length; j++) {
                      generatedMatches.push({
                        i: i + 1,
                        j: j + 1,
                        pairA: grupoPairs[i],
                        pairB: grupoPairs[j],
                        matchKey: `match-${gLetter}-${grupoPairs[i].id}-vs-${grupoPairs[j].id}`
                      });
                    }
                  }

                  // Calculate dynamic stats for this group's players based on sheet scores
                  const statsMap = (() => {
                    const stats: Record<string, { pg: number; sg: number; dg: number }> = {};
                    grupoPairs.forEach(p => {
                      stats[p.id] = { pg: 0, sg: 0, dg: 0 };
                    });

                    generatedMatches.forEach(m => {
                      const score = partidosScores[m.matchKey] || { score1: '', score2: '' };
                      const s1 = score.score1.trim();
                      const s2 = score.score2.trim();

                      if (s1 === '' && s2 === '') return;

                      const nums1 = s1.match(/\d+/g)?.map(Number) || [];
                      const nums2 = s2.match(/\d+/g)?.map(Number) || [];

                      let setsA = 0;
                      let setsB = 0;
                      let gamesA = 0;
                      let gamesB = 0;

                      if (nums1.length > 0 && nums2.length > 0) {
                        const len = Math.max(nums1.length, nums2.length);
                        for (let k = 0; k < len; k++) {
                          const gA = nums1[k] !== undefined ? nums1[k] : 0;
                          const gB = nums2[k] !== undefined ? nums2[k] : 0;
                          gamesA += gA;
                          gamesB += gB;

                          if (gA > gB) setsA++;
                          else if (gB > gA) setsB++;
                        }

                        // Direct check if it represents set scores only eg: 2 vs 0
                        if (nums1.length === 1 && nums2.length === 1) {
                          const valA = nums1[0];
                          const valB = nums2[0];
                          if (valA <= 3 && valB <= 3) {
                            setsA = valA;
                            setsB = valB;
                          }
                        }

                        let matchWinner: 'A' | 'B' | null = null;
                        if (setsA > setsB) matchWinner = 'A';
                        else if (setsB > setsA) matchWinner = 'B';
                        else if (gamesA > gamesB) matchWinner = 'A';
                                             const idA = m.pairA.id;
                        const idB = m.pairB.id;

                        if (stats[idA]) {
                          if (matchWinner === 'A') stats[idA].pg++;
                          stats[idA].sg += (setsA - setsB);
                          stats[idA].dg += (gamesA - gamesB);
                        }
                        if (stats[idB]) {
                          if (matchWinner === 'B') stats[idB].pg++;
                          stats[idB].sg += (setsB - setsA);
                          stats[idB].dg += (gamesB - gamesA);
                        }
                      }
                    });

                    return stats;
                  })();

                  // Sort pairs dynamically to determine 1st and 2nd place within this group
                  const computedRankings = [...grupoPairs].sort((a, b) => {
                    const sA = statsMap[a.id] || { pg: 0, sg: 0, dg: 0 };
                    const sB = statsMap[b.id] || { pg: 0, sg: 0, dg: 0 };

                    if (sB.pg !== sA.pg) return sB.pg - sA.pg;
                    if (sB.sg !== sA.sg) return sB.sg - sA.sg;
                    return sB.dg - sA.dg;
                  });

                  const playedCount = generatedMatches.filter(m => {
                    const score = partidosScores[m.matchKey] || { score1: '', score2: '' };
                    return (score.score1 && score.score1.trim() !== '') || (score.score2 && score.score2.trim() !== '');
                  }).length;

                  return (
                    <div 
                      key={gLetter} 
                      className="space-y-3 pb-6 border-b border-stone-200 last:border-0 w-full"
                    >
                      <div className="bg-white">
                        {/* Group Title and Metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between select-none pb-2 gap-2 border-b border-stone-100 mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[27px] font-black uppercase tracking-tight text-black leading-none">
                              GRUPO {gLetter}
                            </span>
                            <div className="flex items-center gap-1" title={`${playedCount} de ${generatedMatches.length} partidos jugados`}>
                              {Array.from({ length: generatedMatches.length }).map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-3 h-3 rounded-full border-2 border-black transition-all ${
                                    idx < playedCount 
                                      ? 'bg-emerald-500 shadow-[1px_1px_0px_rgba(0,0,0,1)]' 
                                      : 'bg-stone-100 border-stone-400'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Spreadsheet-style Table Grid ("una columna por cada enfrentamiento") */}
                        <table className="w-full text-left text-xs border-none">
                          <thead>
                            <tr className="bg-stone-50 select-none">
                              <th className="p-1.5 text-center font-mono font-bold text-[10px] uppercase w-10 text-neutral-400">
                                N°
                              </th>
                              <th className="p-1.5 font-bold text-[11px] uppercase min-w-[148px] text-neutral-500">
                                Pareja / Integrantes
                              </th>

                              {/* Columns for each Matchup */}
                              {generatedMatches.map((m) => {
                                const score = partidosScores[m.matchKey] || { score1: '', score2: '' };
                                const hasResult = (score.score1 && score.score1.trim() !== '') || (score.score2 && score.score2.trim() !== '');

                                return (
                                  <th 
                                    key={m.matchKey} 
                                    onClick={() => setActiveScoreModal({ matchKey: m.matchKey, gLetter, i: m.i, j: m.j, pairA: m.pairA, pairB: m.pairB })}
                                    className={`p-1.5 px-2 text-center text-[10px] min-w-[70px] max-w-[90px] font-mono select-none cursor-pointer transition-all border border-dashed rounded group ${
                                      hasResult 
                                        ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100/90 font-extrabold' 
                                        : 'bg-stone-50 border-stone-200 hover:bg-neutral-100/95 active:bg-neutral-200/80 font-bold'
                                    }`}
                                    title={`Tocar para cargar o editar marcador de ${m.pairA.jugador1}+${m.pairA.jugador2} vs ${m.pairB.jugador1}+${m.pairB.jugador2}`}
                                  >
                                    <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
                                      <span className={hasResult ? 'text-emerald-850' : 'text-stone-800'}>
                                        {m.i}vs{m.j}
                                      </span>
                                      <span className="text-[10px] sm:text-[11px] scale-90 shrink-0">{hasResult ? '✅' : '✏️'}</span>
                                    </div>
                                  </th>
                                );
                              })}

                              {/* Stats columns */}
                              <th className="p-1.5 text-center font-mono font-black text-[11px] uppercase w-12 text-emerald-600 bg-emerald-50/30" title="Partidos Ganados">
                                PG
                              </th>
                              <th className="p-1.5 text-center font-mono font-black text-[11px] uppercase w-12 text-blue-600 bg-blue-50/30" title="Diferencia de Sets">
                                DS
                              </th>
                              <th className="p-1.5 text-center font-mono font-black text-[11px] uppercase w-12 text-purple-600 bg-purple-50/30" title="Diferencia de Games">
                                DG
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupoPairs.map((p, idx) => {
                              const numericId = idx + 1;
                              const stats = statsMap[p.id] || { pg: 0, sg: 0, dg: 0 };
                              const rankIndex = computedRankings.findIndex(rankPair => rankPair.id === p.id);
                              
                              const isFirst = rankIndex === 0;
                              const isSecond = rankIndex === 1;

                              return (
                                <tr key={p.id} className="hover:bg-neutral-50/40 transition-colors border-b border-stone-100 last:border-0">
                                  {/* Number ID */}
                                  <td className="p-1.5 text-center font-mono select-none">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCircledPairIdsGrupos(prev => ({
                                          ...prev,
                                          [p.id]: !prev[p.id]
                                        }));
                                      }}
                                      className={`w-6 h-6 flex items-center justify-center mx-auto rounded-full cursor-pointer transition-all duration-150 text-[11px] ${
                                        circledPairIdsGrupos[p.id]
                                          ? 'border-2 border-black bg-white text-black font-extrabold focus:ring-1 focus:ring-black' 
                                          : 'text-neutral-400 hover:text-neutral-600 font-extrabold'
                                      }`}
                                      title="Alternar círculo en el número de pareja"
                                    >
                                      {numericId}
                                    </button>
                                  </td>

                                  {/* Couple names vertically stacked with custom leader badge / highlights */}
                                  <td className="p-1.5 bg-white">
                                    <div className={`flex flex-col text-[11px] leading-tight flex-1 min-w-0 p-1 rounded-sm border-l-2 transition-all bg-white ${
                                      isFirst 
                                        ? 'border-emerald-600 pl-2 text-emerald-800' 
                                        : isSecond 
                                        ? 'border-amber-600 pl-2 text-amber-800' 
                                        : 'border-transparent pl-1'
                                    }`}>
                                      <span className={`font-extrabold uppercase truncate flex items-center gap-1 ${
                                        isFirst ? 'text-emerald-800 font-extrabold' : isSecond ? 'text-amber-800 font-extrabold' : 'text-black'
                                      }`}>
                                        {p.jugador1}
                                        {isFirst && <span className="text-[10px] text-emerald-600 leading-none shrink-0" title="1° Lugar (Clasifica)">🏆</span>}
                                        {isSecond && <span className="text-[10px] text-amber-600 leading-none shrink-0" title="2° Lugar (Clasifica)">⭐</span>}
                                      </span>
                                      <span className={`font-semibold uppercase truncate leading-none ${
                                        isFirst ? 'text-emerald-800/90' : isSecond ? 'text-amber-800/90' : 'text-stone-400'
                                      }`}>
                                        {p.jugador2}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Playing cells */}
                                  {generatedMatches.map((m) => {
                                    const matchKey = m.matchKey;
                                    const score = partidosScores[matchKey] || { score1: '', score2: '' };
                                    
                                    const isPlayerA = numericId === m.i;
                                    const isPlayerB = numericId === m.j;

                                    if (isPlayerA) {
                                      return (
                                        <td key={matchKey} className="p-1 text-center bg-white">
                                          <button
                                            type="button"
                                            onClick={() => setActiveScoreModal({ matchKey, gLetter, i: m.i, j: m.j, pairA: m.pairA, pairB: m.pairB })}
                                            className="w-full h-6 text-center bg-stone-100 hover:bg-stone-200/80 font-mono font-bold text-[11px] text-black cursor-pointer rounded-sm flex items-center justify-center transition-colors border border-transparent hover:border-black/25"
                                            title={`Tocar para ingresar marcador para Partido ${m.i} vs ${m.j}`}
                                          >
                                            {score.score1 || <span className="opacity-30 font-normal text-[9px]">-</span>}
                                          </button>
                                        </td>
                                      );
                                    } else if (isPlayerB) {
                                      return (
                                        <td key={matchKey} className="p-1 text-center bg-white">
                                          <button
                                            type="button"
                                            onClick={() => setActiveScoreModal({ matchKey, gLetter, i: m.i, j: m.j, pairA: m.pairA, pairB: m.pairB })}
                                            className="w-full h-6 text-center bg-stone-100 hover:bg-stone-200/80 font-mono font-bold text-[11px] text-black cursor-pointer rounded-sm flex items-center justify-center transition-colors border border-transparent hover:border-black/25"
                                            title={`Tocar para ingresar marcador para Partido ${m.i} vs ${m.j}`}
                                          >
                                            {score.score2 || <span className="opacity-30 font-normal text-[9px]">-</span>}
                                          </button>
                                        </td>
                                      );
                                    } else {
                                      // Grayed out cross-cell
                                      return (
                                        <td key={matchKey} className="p-1 text-center bg-neutral-50/50 select-none">
                                          <div className="w-full h-6 flex items-center justify-center text-neutral-300 font-mono text-[9px]">
                                            ✕
                                          </div>
                                        </td>
                                      );
                                    }
                                  })}

                                  {/* Real-time calculated stats columns */}
                                  <td className="p-1.5 text-center font-mono font-bold text-emerald-600 bg-emerald-50/10 text-xs">
                                    {stats.pg}
                                  </td>
                                  <td className={`p-1.5 text-center font-mono font-bold text-xs ${
                                    stats.sg > 0 ? 'text-blue-600 bg-blue-50/10' : stats.sg < 0 ? 'text-rose-600 bg-rose-50/10' : 'text-neutral-400'
                                  }`}>
                                    {stats.sg > 0 ? `+${stats.sg}` : stats.sg}
                                  </td>
                                  <td className={`p-1.5 text-center font-mono font-bold text-xs ${
                                    stats.dg > 0 ? 'text-purple-600 bg-purple-50/10' : stats.dg < 0 ? 'text-rose-600 bg-rose-50/10' : 'text-neutral-400'
                                  }`}>
                                    {stats.dg > 0 ? `+${stats.dg}` : stats.dg}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}

            {/* CANCHAS MONITORING AND ASSIGNMENTS SECTION */}
            {alphabeticalGroups.length > 0 && (() => {
              const totalCanchas = selectedTournament?.canchas || 2;
              const courtsArray = Array.from({ length: totalCanchas }, (_, i) => i + 1);

              return (
                <div className="space-y-4 pt-6 border-t-4 border-black">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-4 bg-emerald-600 block border border-black" />
                    <h5 className="font-mono text-xs font-black uppercase tracking-wider">
                      📊 CONTROL OPERATIVO / CONFIGURACIÓN DE CANCHAS ({totalCanchas} CANCHAS DISPONIBLES)
                    </h5>
                  </div>
                  
                  <div className="overflow-x-auto w-full scrollbar-thin -mx-2 sm:-mx-4 px-2 sm:px-4 pb-4">
                    <div className="space-y-6 min-w-[700px] sm:min-w-[800px] pb-2 bg-white p-2">
                      {courtsArray.map(courtNum => {
                        const assignedKey = courtAssignments[courtNum];
                        const matchInfo = assignedKey ? findMatchByAssignmentKey(assignedKey) : null;

                        const nextAssignedKey = courtNextAssignments[courtNum];
                        const nextMatchInfo = nextAssignedKey ? findMatchByAssignmentKey(nextAssignedKey) : null;

                        return (
                          <div key={courtNum} className="py-2">
                            {/* Court Header */}
                            <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
                              <span className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-1.5 font-mono">
                                🎾 CANCHA {courtNum}
                              </span>
                              <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider font-mono">
                                ORGANIZACIÓN EN DIRECTO
                              </span>
                            </div>

                            {/* Side-by-side cards */}
                            <div className="grid grid-cols-2 gap-4">
                              
                              {/* CARD 1: CANCHA ACTIVE GAME */}
                              <div 
                                onClick={() => {
                                  if (matchInfo) {
                                    setScoringCourtNum(courtNum);
                                    setCourtScore1('');
                                    setCourtScore2('');
                                    setCourtScoringError('');
                                  } else {
                                    setAssigningCourtNum(courtNum);
                                    setCourtScoringError('');
                                  }
                                }}
                                className={`border-4 border-black p-4 transition-all flex flex-col justify-between relative min-h-[165px] font-mono cursor-pointer ${
                                  matchInfo ? 'bg-emerald-50 hover:bg-emerald-100/50' : 'bg-white hover:bg-stone-50'
                                }`}
                                title={matchInfo ? "Tocar para ingresar marcador o liberar esta cancha" : "Cancha libre. Tocar para asignar un partido"}
                              >
                                <div className="flex justify-between items-center border-b border-black pb-1 mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-black">
                                    🎮 PARTIDO EN JUEGO
                                  </span>
                                  {matchInfo ? (
                                    <span className="bg-emerald-600 text-white text-[8px] font-black tracking-wider px-1.5 py-0.5 animate-pulse uppercase border border-black">
                                      EN JUEGO
                                    </span>
                                  ) : (
                                    <span className="bg-stone-300 text-stone-700 text-[8px] font-black tracking-wider px-1.5 py-0.5 uppercase border border-black">
                                      DISPONIBLE
                                    </span>
                                  )}
                                </div>

                                {matchInfo ? (
                                  <div className="space-y-2 py-1 flex flex-col justify-between h-full group">
                                    <div className="space-y-1">
                                      <div className="text-[11px] font-black uppercase text-stone-800 tracking-tight flex items-center justify-between">
                                        <span className="truncate max-w-[170px]">{matchInfo.pairA.jugador1} + {matchInfo.pairA.jugador2}</span>
                                        <span className="text-[9px] bg-stone-100 px-1 border border-black font-extrabold shrink-0">1</span>
                                      </div>
                                      <div className="text-[7px] font-black text-neutral-400 text-center tracking-widest my-0.5">VS</div>
                                      <div className="text-[11px] font-black uppercase text-stone-800 tracking-tight flex items-center justify-between">
                                        <span className="truncate max-w-[170px]">{matchInfo.pairB.jugador1} + {matchInfo.pairB.jugador2}</span>
                                        <span className="text-[9px] bg-stone-100 px-1 border border-black font-extrabold shrink-0">2</span>
                                      </div>
                                    </div>

                                    <div className="text-[9px] font-black text-neutral-600 pt-2 border-t border-dashed border-black/20 flex justify-between items-end">
                                      <span>ZONA {matchInfo.gLetter} &middot; PARTIDO {matchInfo.i}-{matchInfo.j}</span>
                                      <span className="underline group-hover:text-amber-700 transition-colors">CARGAR PUNTAJE 📝</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 h-full">
                                    <span className="text-stone-400 font-extrabold text-xs uppercase tracking-widest block animate-pulse">LIBRE DE JUEGO</span>
                                    <span className="text-neutral-500 font-black text-[10px] uppercase tracking-wide">
                                      TOCAR PARA ASIGNAR ➕
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* CARD 2: PROXIMO PARTIDO */}
                              <div 
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest('.btn-remove')) return;

                                  if (!nextMatchInfo) {
                                    setAssigningNextCourtNum(courtNum);
                                    setCourtScoringError('');
                                  }
                                }}
                                className={`border-4 border-black p-4 transition-all flex flex-col justify-between relative min-h-[165px] font-mono cursor-pointer ${
                                  nextMatchInfo ? 'bg-amber-50/70 hover:bg-amber-50/90' : 'bg-white hover:bg-stone-50'
                                }`}
                                title={nextMatchInfo ? "Partido en espera" : "Sin partido en espera. Tocar para asignar próximo partido"}
                              >
                                <div className="flex justify-between items-center border-b border-black pb-1 mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-black">
                                    ⏳ PRÓXIMO PARTIDO EN COLA
                                  </span>
                                  {nextMatchInfo ? (
                                    <span className="bg-amber-500 text-black text-[8px] font-black tracking-wider px-1.5 py-0.5 uppercase border border-black">
                                      EN COLA
                                    </span>
                                  ) : (
                                    <span className="bg-stone-200 text-stone-600 text-[8px] font-black tracking-wider px-1.5 py-0.5 uppercase border border-black">
                                      SIN ASIGNAR
                                    </span>
                                  )}
                                </div>

                                {nextMatchInfo ? (
                                  <div className="space-y-2 py-1 flex flex-col justify-between h-full group">
                                    <div className="space-y-1">
                                      <div className="text-[11px] font-black uppercase text-stone-800 tracking-tight flex items-center justify-between">
                                        <span className="truncate max-w-[170px]">{nextMatchInfo.pairA.jugador1} + {nextMatchInfo.pairA.jugador2}</span>
                                        <span className="text-[9px] bg-stone-100 px-1 border border-black font-extrabold shrink-0">1</span>
                                      </div>
                                      <div className="text-[7px] font-black text-neutral-400 text-center tracking-widest my-0.5">VS</div>
                                      <div className="text-[11px] font-black uppercase text-stone-800 tracking-tight flex items-center justify-between">
                                        <span className="truncate max-w-[170px]">{nextMatchInfo.pairB.jugador1} + {nextMatchInfo.pairB.jugador2}</span>
                                        <span className="text-[9px] bg-stone-100 px-1 border border-black font-extrabold shrink-0">2</span>
                                      </div>
                                    </div>

                                    <div className="text-[9px] font-black text-neutral-600 pt-2 border-t border-dashed border-black/20 flex justify-between items-end">
                                      <span>ZONA {nextMatchInfo.gLetter} &middot; PARTIDO {nextMatchInfo.i}-{nextMatchInfo.j}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCourtNextAssignments(prev => {
                                            const updated = { ...prev };
                                            delete updated[courtNum];
                                            return updated;
                                          });
                                        }}
                                        className="btn-remove px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase border border-black hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all cursor-pointer"
                                      >
                                        ❌ QUITAR
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 h-full">
                                    <span className="text-stone-400 font-extrabold text-xs uppercase tracking-widest block font-mono">SIN PARTIDO</span>
                                    <span className="text-neutral-500 font-black text-[10px] uppercase tracking-wide">
                                      TOCAR PARA ASIGNAR ➕
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal para Seleccionar Partido en una Cancha (Active o Next Queue) */}
            {(assigningCourtNum !== null || assigningNextCourtNum !== null) && (() => {
              const courtNum = assigningCourtNum !== null ? assigningCourtNum : assigningNextCourtNum!;
              const isNext = assigningNextCourtNum !== null;
              const allGroups = getAllGroupsWithMatches();
              return (
                <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white border-4 border-black max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 font-mono relative shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black">
                    <button
                      onClick={() => {
                        setAssigningCourtNum(null);
                        setAssigningNextCourtNum(null);
                      }}
                      className="absolute top-4 right-4 text-xs font-black uppercase hover:underline cursor-pointer border-2 border-black bg-stone-100 px-2.5 py-1 text-black"
                    >
                      Cerrar [X]
                    </button>
                    
                    <h4 className="text-sm font-black uppercase tracking-wider mb-2 text-stone-900 flex items-center gap-2">
                      🎾 {isNext ? 'CARGAR PRÓXIMO PARTIDO' : 'ASIGNAR PARTIDO EN SANGRE'} A LA CANCHA #{courtNum}
                    </h4>
                    <p className="text-[10px] opacity-70 uppercase tracking-wide mb-6">
                      {isNext 
                        ? `Selecciona un partido de la lista para dejarlo en cola para la Cancha #${courtNum}.`
                        : `Selecciona un partido por jugar. Quedará visible inmediatamente como en juego en la Cancha #${courtNum}.`
                      }
                    </p>

                    <div className="space-y-6">
                      {allGroups.map(g => {
                        const unplayedAndUnassigned = g.matches.filter(m => {
                          const score = partidosScores[m.matchKey] || { score1: '', score2: '' };
                          const hasResult = (score.score1 && score.score1.trim() !== '') || (score.score2 && score.score2.trim() !== '');
                          const isCurrentAssigned = Object.values(courtAssignments).includes(m.matchKey);
                          const isNextAssigned = Object.values(courtNextAssignments).includes(m.matchKey);
                          return !hasResult && !isCurrentAssigned && !isNextAssigned;
                        });

                        if (unplayedAndUnassigned.length === 0) return null;

                        return (
                          <div key={g.gLetter} className="border-4 border-black p-4 bg-stone-50">
                            <div className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1.5 mb-3 text-black flex justify-between items-center bg-stone-200 px-2 py-1">
                              <span>ZONA / GRUPO {g.gLetter}</span>
                              <span className="text-[9px] font-black bg-black text-white px-1.5 py-0.5">{unplayedAndUnassigned.length} PENDIENTES</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {unplayedAndUnassigned.map(m => {
                                return (
                                  <button
                                    key={m.matchKey}
                                    onClick={() => {
                                      if (isNext) {
                                        setCourtNextAssignments(prev => ({
                                          ...prev,
                                          [courtNum]: m.matchKey,
                                        }));
                                        setAssigningNextCourtNum(null);
                                      } else {
                                        setCourtAssignments(prev => ({
                                          ...prev,
                                          [courtNum]: m.matchKey,
                                        }));
                                        setAssigningCourtNum(null);
                                      }
                                    }}
                                    className="border-2 border-black p-3 bg-white hover:bg-emerald-50 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px text-black w-full"
                                  >
                                    <div className="text-[9px] font-black uppercase mb-1.5 flex justify-between items-center text-neutral-400">
                                      <span>Partido #{m.i} vs #{m.j}</span>
                                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 text-[8px] font-black tracking-wide">SELECCIONAR</span>
                                    </div>
                                    <div className="text-xs space-y-1">
                                      <div className="font-extrabold uppercase text-stone-800 truncate">
                                        {m.pairA.jugador1} + {m.pairA.jugador2}
                                      </div>
                                      <div className="text-[8px] font-bold text-center opacity-30 my-0.5">VS</div>
                                      <div className="font-extrabold uppercase text-stone-800 truncate">
                                        {m.pairB.jugador1} + {m.pairB.jugador2}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {allGroups.every(g => {
                        const unplayedAndUnassigned = g.matches.filter(m => {
                          const score = partidosScores[m.matchKey] || { score1: '', score2: '' };
                          const hasResult = (score.score1 && score.score1.trim() !== '') || (score.score2 && score.score2.trim() !== '');
                          const isCurrentAssigned = Object.values(courtAssignments).includes(m.matchKey);
                          const isNextAssigned = Object.values(courtNextAssignments).includes(m.matchKey);
                          return !hasResult && !isCurrentAssigned && !isNextAssigned;
                        });
                        return unplayedAndUnassigned.length === 0;
                      }) && (
                        <div className="text-center py-12 border-4 border-dashed border-black bg-stone-50 select-none">
                          <span className="text-4xl">👏</span>
                          <p className="text-xs font-black uppercase tracking-wider mt-3">¡A JUGAR! TODOS LOS PARTIDOS EN CURSO O FINALIZADOS</p>
                          <p className="text-[10px] opacity-65 mt-1 uppercase">No quedan más partidos pendientes en la fase de zonas.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal para Definir marcador de una Cancha */}
            {scoringCourtNum !== null && (() => {
              const assignedKey = courtAssignments[scoringCourtNum];
              const matchInfo = assignedKey ? findMatchByAssignmentKey(assignedKey) : null;
              if (!matchInfo) return null;

              const isMini = getTournamentModo() === 'mini';

              return (
                <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in select-none">
                  <div className="bg-white border-4 border-black max-w-sm w-full p-6 font-mono relative shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black">
                    <button
                      onClick={() => {
                        setScoringCourtNum(null);
                        setCourtScoringError('');
                      }}
                      className="absolute top-4 right-4 text-xs font-black uppercase hover:underline cursor-pointer border-2 border-black bg-stone-100 px-2 py-1 text-black"
                    >
                      [X] Cerrar
                    </button>

                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 border-2 border-black px-2 py-0.5 inline-block mb-3">
                      Puntajes &middot; Cancha #{scoringCourtNum} ({isMini ? '⚡ REGIMEN DE SET ÚNICO' : '🏆 REGIMEN DE 3 SETS'})
                    </div>

                    <h4 className="text-[11px] uppercase tracking-normal leading-relaxed mb-4 text-stone-500">
                      Cargar marcador para el Partido #{matchInfo.i} vs #{matchInfo.j} de la <span className="font-extrabold text-black">ZONA {matchInfo.gLetter}</span>.
                    </h4>

                    {courtScoringError && (
                      <div className="bg-red-50 border-2 border-red-600 text-red-700 px-3 py-1.5 text-xs uppercase font-black tracking-wide text-center leading-none mb-4 animate-shake">
                        ⚠️ {courtScoringError}
                      </div>
                    )}

                    {/* Board Grid layout identical to the principal modal */}
                    <div className="space-y-4 pt-1 mb-6">
                      <div className="grid grid-cols-12 gap-2 text-center">
                        <div className="col-span-6 text-left font-bold text-[9px] text-neutral-400 uppercase">
                          Pareja / Jugadores
                        </div>
                        {isMini ? (
                          <div className="col-span-6 font-black text-[10px] text-red-500 uppercase">
                            SET ÚNICO
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 font-bold text-[9px] text-neutral-500 uppercase">S1</div>
                            <div className="col-span-2 font-bold text-[9px] text-neutral-500 uppercase">S2</div>
                            <div className="col-span-2 font-bold text-[9px] text-neutral-400 uppercase">S3</div>
                          </>
                        )}
                      </div>

                      {/* Row 1: Pair A */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6 text-left min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] text-white bg-black w-4 h-4 rounded-sm flex items-center justify-center shrink-0 font-bold">
                              1
                            </span>
                            <span className="font-black text-[11px] text-black uppercase truncate block">
                              {matchInfo.pairA.jugador1}
                            </span>
                          </div>
                          <span className="font-semibold text-[10px] text-neutral-400 uppercase truncate block pl-5 leading-tight">
                            {matchInfo.pairA.jugador2}
                          </span>
                        </div>
                        
                        {isMini ? (
                          <div className="col-span-6 flex justify-center">
                            <input 
                              type="text" 
                              pattern="[0-9]*"
                              inputMode="numeric"
                              placeholder="0"
                              value={courtSet1A}
                              onChange={(e) => setCourtSet1A(e.target.value.replace(/\D/g, ''))}
                              className="w-16 h-10 border-2 border-black text-center font-black text-lg focus:bg-emerald-50 rounded-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 flex justify-center">
                              <input 
                                type="text" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                value={courtSet1A}
                                onChange={(e) => setCourtSet1A(e.target.value.replace(/\D/g, ''))}
                                className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-emerald-50 rounded-sm"
                                autoFocus
                              />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <input 
                                type="text" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                value={courtSet2A}
                                onChange={(e) => setCourtSet2A(e.target.value.replace(/\D/g, ''))}
                                className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-emerald-50 rounded-sm"
                              />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <input 
                                type="text" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                value={courtSet3A}
                                onChange={(e) => setCourtSet3A(e.target.value.replace(/\D/g, ''))}
                                className="w-10 h-10 border-2 border-stone-300 focus:border-black text-center font-black text-base focus:bg-emerald-50 rounded-sm"
                                title="Tercer set opcional"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Row 2: Pair B */}
                      <div className="grid grid-cols-12 gap-2 items-center border-t border-dotted border-stone-200 pt-2.5">
                        <div className="col-span-6 text-left min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] text-white bg-black w-4 h-4 rounded-sm flex items-center justify-center shrink-0 font-bold">
                              2
                            </span>
                            <span className="font-black text-[11px] text-black uppercase truncate block">
                              {matchInfo.pairB.jugador1}
                            </span>
                          </div>
                          <span className="font-semibold text-[10px] text-neutral-400 uppercase truncate block pl-5 leading-tight">
                            {matchInfo.pairB.jugador2}
                          </span>
                        </div>

                        {isMini ? (
                          <div className="col-span-6 flex justify-center">
                            <input 
                              type="text" 
                              pattern="[0-9]*"
                              inputMode="numeric"
                              placeholder="0"
                              value={courtSet1B}
                              onChange={(e) => setCourtSet1B(e.target.value.replace(/\D/g, ''))}
                              className="w-16 h-10 border-2 border-black text-center font-black text-lg focus:bg-emerald-50 rounded-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 flex justify-center">
                              <input 
                                type="text" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                value={courtSet1B}
                                onChange={(e) => setCourtSet1B(e.target.value.replace(/\D/g, ''))}
                                className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-emerald-50 rounded-sm"
                              />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <input 
                                type="text" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                value={courtSet2B}
                                onChange={(e) => setCourtSet2B(e.target.value.replace(/\D/g, ''))}
                                className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-emerald-50 rounded-sm"
                              />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <input 
                                type="text" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="0"
                                value={courtSet3B}
                                onChange={(e) => setCourtSet3B(e.target.value.replace(/\D/g, ''))}
                                className="w-10 h-10 border-2 border-stone-300 focus:border-black text-center font-black text-base focus:bg-emerald-50 rounded-sm"
                                title="Tercer set opcional"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!isMini && (
                      <div className="text-[9px] text-neutral-400 text-center leading-normal italic mb-4">
                        * S3 es opcional. Déjalo vacío si terminó en sets directos.
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex flex-col gap-2 pt-4 border-t-2 border-black">
                      <button
                        type="button"
                        onClick={() => {
                          let score1Val = '';
                          let score2Val = '';

                          if (isMini) {
                            if (!courtSet1A.trim() || !courtSet1B.trim()) {
                              setCourtScoringError("Por favor escribe el marcador para ambos bandos.");
                              return;
                            }
                            score1Val = courtSet1A.trim();
                            score2Val = courtSet1B.trim();
                          } else {
                            const p1: string[] = [];
                            const p2: string[] = [];

                            if (courtSet1A.trim() !== '' || courtSet1B.trim() !== '') {
                              p1.push(courtSet1A.trim() || '0');
                              p2.push(courtSet1B.trim() || '0');
                            }
                            if (courtSet2A.trim() !== '' || courtSet2B.trim() !== '') {
                              if (p1.length === 0) {
                                p1.push('0');
                                p2.push('0');
                              }
                              p1.push(courtSet2A.trim() || '0');
                              p2.push(courtSet2B.trim() || '0');
                            }
                            if (courtSet3A.trim() !== '' || courtSet3B.trim() !== '') {
                              while (p1.length < 2) {
                                p1.push('0');
                                p2.push('0');
                              }
                              p1.push(courtSet3A.trim() || '0');
                              p2.push(courtSet3B.trim() || '0');
                            }

                            if (p1.length === 0) {
                              setCourtScoringError("Por favor escribe al menos el marcador del primer set.");
                              return;
                            }

                            score1Val = p1.join(' ');
                            score2Val = p2.join(' ');
                          }
                          
                          // Save score
                          handleUpdateScore(matchInfo.matchKey, 1, score1Val);
                          handleUpdateScore(matchInfo.matchKey, 2, score2Val);

                          // Clear court assignment or transition next queue match if any
                          const nextMatchKey = courtNextAssignments[scoringCourtNum];
                          setCourtAssignments(prev => {
                            const updated = { ...prev };
                            if (nextMatchKey) {
                              updated[scoringCourtNum] = nextMatchKey;
                            } else {
                              delete updated[scoringCourtNum];
                            }
                            return updated;
                          });

                          if (nextMatchKey) {
                            setCourtNextAssignments(prev => {
                              const updated = { ...prev };
                              delete updated[scoringCourtNum];
                              return updated;
                            });
                          }

                          setScoringCourtNum(null);
                        }}
                        className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-px active:translate-y-px cursor-pointer transition-all"
                      >
                        [💾] Guardar Marcador y Desocupar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          // Just liberate court without scores, transition next queue match if any
                          const nextMatchKey = courtNextAssignments[scoringCourtNum];
                          setCourtAssignments(prev => {
                            const updated = { ...prev };
                            if (nextMatchKey) {
                              updated[scoringCourtNum] = nextMatchKey;
                            } else {
                              delete updated[scoringCourtNum];
                            }
                            return updated;
                          });

                          if (nextMatchKey) {
                            setCourtNextAssignments(prev => {
                              const updated = { ...prev };
                              delete updated[scoringCourtNum];
                              return updated;
                            });
                          }

                          setScoringCourtNum(null);
                        }}
                        className="w-full py-2.5 text-xs font-black uppercase tracking-wider bg-white hover:bg-stone-100 text-black border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-px active:translate-y-px cursor-pointer transition-all"
                      >
                        [🔓] Liberar Cancha (Sin Guardar Resultado)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-[#faf9f6] rounded-none p-4 border-2 border-dashed border-black">
              <div className="text-[10px] uppercase tracking-widest font-black mb-1 font-mono">REGLAMENTO</div>
              <p className="text-xs leading-relaxed opacity-90">
                El sistema estándar distribuye de 3 a 5 parejas en cada zona de juego. Clasifican las 2 mejores parejas al cuadro eliminatorio (Playoffs).
              </p>
            </div>
          </div>
        );
      }

      case 'playoffs': {
        const isMini = getTournamentModo() === 'mini';
        const availableGroups = getPlayoffGroupLetters();

        if (!playoffType) {
          return (
            <div className="space-y-6 py-6 text-black select-none font-mono">
              <div className="flex flex-col items-center justify-center border-4 border-dashed border-black p-10 bg-neutral-50/50 text-center space-y-4">
                <Trophy size={48} className="text-stone-400 stroke-[1.5] animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-xl font-black uppercase tracking-tight">03 // Configurar Fase Eliminatoria</h4>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest">
                    Crea las llaves para la ronda eliminatoria (Playoffs)
                  </p>
                </div>
                <p className="text-xs max-w-md leading-relaxed text-neutral-600">
                  Selecciona la estructura inicial del cuadro basándote en la cantidad de parejas clasificadas. Podrás asignar las posiciones de grupos (ej: 1º Grupo A), parejas directas o BYEs para avanzar automáticamente.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 w-full max-w-xl">
                  <button
                    onClick={() => handleCreatePlayoffs('octavos')}
                    className="p-5 border-2 border-black bg-white hover:bg-stone-50 cursor-pointer text-left transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-40"
                  >
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                      Cuadro Grande
                    </span>
                    <div className="space-y-1">
                      <div className="text-base font-black truncate uppercase leading-tight">
                        DESDE OCTAVOS 🎾
                      </div>
                      <div className="text-[10px] uppercase font-bold text-emerald-600">
                        16 Parejas // 8 Partidos Iniciales
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCreatePlayoffs('cuartos')}
                    className="p-5 border-2 border-black bg-white hover:bg-stone-50 cursor-pointer text-left transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-40"
                  >
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                      Cuadro Compacto
                    </span>
                    <div className="space-y-1">
                      <div className="text-base font-black truncate uppercase leading-tight">
                        DESDE CUARTOS 🎾
                      </div>
                      <div className="text-[10px] uppercase font-bold text-blue-600">
                        8 Parejas // 4 Partidos Iniciales
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Regulatory standard note */}
              <div className="bg-[#faf9f6] p-4 border-2 border-black text-xs leading-relaxed">
                <span className="font-bold uppercase block mb-1">ℹ️ SUGERENCIA DE CLASIFICACIÓN</span>
                En un torneo estándar de Padel, clasifican las 2 mejores parejas de cada grupo (1º y 2º). Si tienes 4 grupos, puedes crear llaves desde Cuartos de final con los 8 clasificados. Si tienes más grupos o un cuadro más grande, inicia desde Octavos.
              </div>
            </div>
          );
        }

        // Bracket rendering flow
        const rounds = playoffType === 'octavos' ? [
          { key: 'octavos', title: 'Octavos de Final', matchKeys: ['octavos_1', 'octavos_2', 'octavos_3', 'octavos_4', 'octavos_5', 'octavos_6', 'octavos_7', 'octavos_8'] },
          { key: 'cuartos', title: 'Cuartos de Final', matchKeys: ['cuartos_1', 'cuartos_2', 'cuartos_3', 'cuartos_4'] },
          { key: 'semis', title: 'Semifinales', matchKeys: ['semis_1', 'semis_2'] },
          { key: 'final', title: 'Gran Final 🏆', matchKeys: ['final_1'] }
        ] : [
          { key: 'cuartos', title: 'Cuartos de Final', matchKeys: ['cuartos_1', 'cuartos_2', 'cuartos_3', 'cuartos_4'] },
          { key: 'semis', title: 'Semifinales', matchKeys: ['semis_1', 'semis_2'] },
          { key: 'final', title: 'Gran Final 🏆', matchKeys: ['final_1'] }
        ];

        return (
          <div className="space-y-4 text-black select-none font-mono">
            
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="stroke-[2.5] text-amber-500" />
                <h4 className="text-md sm:text-lg font-black uppercase tracking-tight">
                  PLAYOFFS EN CURSO: {playoffType}
                </h4>
              </div>
              <div className="flex gap-2 items-center">
                {confirmingResetPlayoffs ? (
                  <div className="flex items-center gap-1.5 border-2 border-black bg-rose-50 p-1">
                    <span className="text-[9px] font-black uppercase text-rose-600 animate-pulse px-1">¿CONFIRMAS?</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCreatePlayoffs('octavos');
                        setConfirmingResetPlayoffs(false);
                      }}
                      className="px-2 py-0.5 text-[9px] font-black uppercase border border-black bg-rose-600 text-white cursor-pointer hover:bg-rose-700 transition-colors"
                    >
                      SÍ, BORRAR
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingResetPlayoffs(false)}
                      className="px-2 py-0.5 text-[9px] font-black uppercase border border-black bg-white hover:bg-stone-100 cursor-pointer transition-colors"
                    >
                      NO
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleOpenArmarCuadro}
                      className="px-3 py-1 text-[10px] font-black uppercase border-2 border-black bg-[#ffeb2a] hover:bg-[#ffe31a] text-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-colors"
                    >
                      Armar Cuadro 🛠️
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingResetPlayoffs(true)}
                      className="px-3 py-1 text-[10px] font-black uppercase border-2 border-black bg-rose-100 hover:bg-rose-200 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-colors"
                    >
                      Reiniciar Cuadro 🔄
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Bracket Stage */}
            <div className="-mx-2 sm:-mx-4 px-2 sm:px-4 p-4 bg-neutral-55 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="flex flex-row gap-8 overflow-x-auto pb-4 pt-2 select-none scrollbar-thin">
                
                {rounds.map((roundObj) => (
                  <div key={roundObj.key} className="flex flex-col shrink-0 w-[230px]">
                    {/* Header of Round */}
                    <div className="border-2 border-black bg-black text-white py-1.5 px-3 text-center text-[10px] font-black uppercase tracking-wider mb-4 shadow-[3px_3px_0px_rgba(100,100,100,1)]">
                      {roundObj.title}
                    </div>

                    {/* Vertically centered column layout */}
                    <div className="flex flex-col justify-around h-[820px] pb-4">
                      {roundObj.matchKeys.map((mKey) => {
                        const m = playoffMatches[mKey] || {
                          key: mKey,
                          round: roundObj.key as any,
                          sourceTypeA: 'seed', sourceValueA: '',
                          sourceTypeB: 'seed', sourceValueB: '',
                          set1A: '', set1B: '', set2A: '', set2B: '', set3A: '', set3B: ''
                        };

                        const resolvedA = resolvePlayoffSlot(m.sourceTypeA, m.sourceValueA);
                        const resolvedB = resolvePlayoffSlot(m.sourceTypeB, m.sourceValueB);

                        const isAnnulled = isOctavosMatchAnnulled(m.key);

                        const isEditableA = !isAnnulled && (m.round === 'octavos' || (playoffType === 'octavos' && m.round === 'cuartos') || (playoffType === 'cuartos' && m.round === 'cuartos'));
                        const isEditableB = !isAnnulled && (m.round === 'octavos' || (playoffType === 'octavos' && m.round === 'cuartos') || (playoffType === 'cuartos' && m.round === 'cuartos'));
                        
                        const winnerInfo = isAnnulled ? null : getPlayoffMatchWinner(m.key);
                        const winnerPairId = winnerInfo ? winnerInfo.pair?.id : null;

                        const isCompleted = isPlayoffMatchCompleted(m);

                        return (
                          <div 
                            key={mKey}
                            onClick={isCompleted ? () => setEditingPlayoffScores(m.key) : undefined}
                            className={`border-2 border-black pl-1.5 pr-1.5 pt-1 pb-1.5 rounded-none w-[230px] flex flex-col gap-1 relative group transition-all duration-200 ${
                              isAnnulled 
                                ? 'opacity-50 select-none' 
                                : isCompleted 
                                ? 'bg-emerald-900 text-white cursor-pointer hover:scale-[1.01] hover:bg-emerald-950 hover:border-black active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                                : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                          >
                            {isAnnulled && (
                              <div className="absolute inset-0 bg-stone-100/95 flex flex-col items-center justify-center text-center p-1.5 z-10 border border-dashed border-rose-500">
                                <span className="text-[10px] font-black text-rose-600 tracking-wider">🚫 LLAVE ANULADA</span>
                                <span className="text-[7.5px] text-stone-600 uppercase font-bold tracking-tight leading-none mt-1">DEFINIDA DIRECTA EN CUARTOS</span>
                              </div>
                            )}
                            <div className={`flex justify-between items-center border-b pb-0.5 ${isCompleted ? 'border-emerald-800/60' : 'border-stone-200'}`}>
                              <span className={`font-bold text-[9px] uppercase tracking-wide ${isCompleted ? 'text-emerald-300' : 'text-neutral-400'}`}>
                                {m.round === 'final' ? '👑 FINAL DEL TORNEO' : `${m.round.replace('semis', 'SEMIFINAL').toUpperCase()} - ${m.key.split('_')[1]}`}
                              </span>
                              {winnerInfo && winnerInfo.pair && (
                                <span className={`font-extrabold text-[8px] border px-1 leading-none rounded-sm uppercase tracking-wider ${
                                  isCompleted ? 'bg-white text-emerald-950 border-white' : 'bg-emerald-500 text-white border-black'
                                }`}>
                                  Terminado ✅
                                </span>
                              )}
                            </div>

                            {/* Row A */}
                            <div className="flex items-center gap-1.5 justify-between">
                              <div 
                                onClick={isCompleted ? undefined : (isEditableA ? (e) => {
                                  e.stopPropagation();
                                  setEditingPlayoffSlot({ matchKey: m.key, slot: 'A' });
                                } : undefined)}
                                className={`flex-1 min-w-0 flex items-center justify-between gap-1 border p-1 rounded-sm transition-all ${
                                  isCompleted ? '' : isEditableA ? 'cursor-pointer hover:bg-amber-100 hover:border-amber-500' : ''
                                } ${
                                  winnerInfo && winnerInfo.pair && resolvedA.pair?.id === winnerPairId
                                    ? isCompleted
                                      ? 'bg-emerald-300 border-white text-emerald-950 font-black'
                                      : 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black'
                                    : resolvedA.label.includes('AGREGAR CRUCE')
                                    ? isCompleted
                                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100 font-extrabold'
                                      : 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold animate-pulse'
                                    : isCompleted
                                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100 font-medium'
                                    : 'bg-stone-50 border-stone-200 text-stone-900 font-medium'
                                }`}
                                title={isCompleted ? "Click para modificar resultados" : isEditableA ? "Presiona para definir pareja, BYE o clasificado de grupo" : undefined}
                              >
                                <div className="min-w-0 flex-1 pl-1">
                                  <div className="text-[10px] uppercase truncate leading-tight">
                                    {resolvedA.pair ? `${resolvedA.pair.jugador1}` : resolvedA.label}
                                  </div>
                                  {resolvedA.pair && (
                                    <div className={`text-[8px] uppercase truncate leading-none font-bold ${
                                      isCompleted 
                                        ? (winnerInfo && winnerInfo.pair && resolvedA.pair?.id === winnerPairId ? 'text-emerald-800' : 'text-emerald-300')
                                        : 'text-neutral-400'
                                    }`}>
                                      {resolvedA.pair.jugador2}
                                    </div>
                                  )}
                                </div>
                                
                                {!isCompleted && isEditableA && (
                                  <span className="p-0.5 text-[9px] shrink-0 font-bold text-stone-400 hover:text-black">
                                    ✏️
                                  </span>
                                )}
                              </div>

                              {/* Score display A: editable if not completed, display tile if completed */}
                              {isCompleted ? (
                                <div className="flex gap-1 shrink-0 font-mono font-bold text-[10px]">
                                  <span className="w-6 h-6 flex items-center justify-center bg-emerald-950 text-white border border-emerald-700/80 rounded-sm shadow-sm select-none">
                                    {m.set1A || '0'}
                                  </span>
                                  {!isMini && (
                                    <>
                                      <span className="w-6 h-6 flex items-center justify-center bg-emerald-950 text-white border border-emerald-700/80 rounded-sm shadow-sm select-none">
                                        {m.set2A || '0'}
                                      </span>
                                      <span className="w-6 h-6 flex items-center justify-center bg-emerald-950 text-white border border-emerald-700/80 rounded-sm shadow-sm select-none">
                                        {m.set3A || '0'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={m.set1A}
                                    onChange={(e) => handleSetScoreChange(m.key, 'set1A', e.target.value.replace(/\D/g, ''))}
                                    className="w-6 h-6 text-center font-mono font-bold text-[10px] border border-stone-300 focus:border-black bg-white focus:bg-amber-50 rounded-sm"
                                    placeholder="S1"
                                  />
                                  {!isMini && (
                                    <>
                                      <input
                                        type="text"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        value={m.set2A}
                                        onChange={(e) => handleSetScoreChange(m.key, 'set2A', e.target.value.replace(/\D/g, ''))}
                                        className="w-6 h-6 text-center font-mono font-bold text-[10px] border border-stone-300 focus:border-black bg-white focus:bg-amber-50 rounded-sm"
                                        placeholder="S2"
                                      />
                                      <input
                                        type="text"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        value={m.set3A}
                                        onChange={(e) => handleSetScoreChange(m.key, 'set3A', e.target.value.replace(/\D/g, ''))}
                                        className="w-6 h-6 text-center font-mono font-bold text-[10px] border border-stone-200 focus:border-black bg-stone-50 focus:bg-amber-50 rounded-sm"
                                        placeholder="S3"
                                        title="Set 3 opcional"
                                      />
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Row B */}
                            <div className="flex items-center gap-1.5 justify-between">
                              <div 
                                onClick={isCompleted ? undefined : (isEditableB ? (e) => {
                                  e.stopPropagation();
                                  setEditingPlayoffSlot({ matchKey: m.key, slot: 'B' });
                                } : undefined)}
                                className={`flex-1 min-w-0 flex items-center justify-between gap-1 border p-1 rounded-sm transition-all ${
                                  isCompleted ? '' : isEditableB ? 'cursor-pointer hover:bg-amber-100 hover:border-amber-500' : ''
                                } ${
                                  winnerInfo && winnerInfo.pair && resolvedB.pair?.id === winnerPairId
                                    ? isCompleted
                                      ? 'bg-emerald-300 border-white text-emerald-950 font-black'
                                      : 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black'
                                    : resolvedB.label.includes('AGREGAR CRUCE')
                                    ? isCompleted
                                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100 font-extrabold'
                                      : 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold animate-pulse'
                                    : isCompleted
                                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100 font-medium'
                                    : 'bg-stone-50 border-stone-200 text-stone-900 font-medium'
                                }`}
                                title={isCompleted ? "Click para modificar resultados" : isEditableB ? "Presiona para definir pareja, BYE o clasificado de grupo" : undefined}
                              >
                                <div className="min-w-0 flex-1 pl-1">
                                  <div className="text-[10px] uppercase truncate leading-tight">
                                    {resolvedB.pair ? `${resolvedB.pair.jugador1}` : resolvedB.label}
                                  </div>
                                  {resolvedB.pair && (
                                    <div className={`text-[8px] uppercase truncate leading-none font-bold ${
                                      isCompleted 
                                        ? (winnerInfo && winnerInfo.pair && resolvedB.pair?.id === winnerPairId ? 'text-emerald-800' : 'text-emerald-300')
                                        : 'text-neutral-400'
                                    }`}>
                                      {resolvedB.pair.jugador2}
                                    </div>
                                  )}
                                </div>
                                
                                {!isCompleted && isEditableB && (
                                  <span className="p-0.5 text-[9px] shrink-0 font-bold text-stone-400 hover:text-black">
                                    ✏️
                                  </span>
                                )}
                              </div>

                              {/* Score display B: editable if not completed, display tile if completed */}
                              {isCompleted ? (
                                <div className="flex gap-1 shrink-0 font-mono font-bold text-[10px]">
                                  <span className="w-6 h-6 flex items-center justify-center bg-emerald-950 text-white border border-emerald-700/80 rounded-sm shadow-sm select-none">
                                    {m.set1B || '0'}
                                  </span>
                                  {!isMini && (
                                    <>
                                      <span className="w-6 h-6 flex items-center justify-center bg-emerald-950 text-white border border-emerald-700/80 rounded-sm shadow-sm select-none">
                                        {m.set2B || '0'}
                                      </span>
                                      <span className="w-6 h-6 flex items-center justify-center bg-emerald-950 text-white border border-emerald-700/80 rounded-sm shadow-sm select-none">
                                        {m.set3B || '0'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={m.set1B}
                                    onChange={(e) => handleSetScoreChange(m.key, 'set1B', e.target.value.replace(/\D/g, ''))}
                                    className="w-6 h-6 text-center font-mono font-bold text-[10px] border border-stone-300 focus:border-black bg-white focus:bg-amber-50 rounded-sm"
                                    placeholder="S1"
                                  />
                                  {!isMini && (
                                    <>
                                      <input
                                        type="text"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        value={m.set2B}
                                        onChange={(e) => handleSetScoreChange(m.key, 'set2B', e.target.value.replace(/\D/g, ''))}
                                        className="w-6 h-6 text-center font-mono font-bold text-[10px] border border-stone-300 focus:border-black bg-white focus:bg-amber-50 rounded-sm"
                                        placeholder="S2"
                                      />
                                      <input
                                        type="text"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        value={m.set3B}
                                        onChange={(e) => handleSetScoreChange(m.key, 'set3B', e.target.value.replace(/\D/g, ''))}
                                        className="w-6 h-6 text-center font-mono font-bold text-[10px] border border-stone-200 focus:border-black bg-stone-50 focus:bg-amber-50 rounded-sm"
                                        placeholder="S3"
                                        title="Set 3 opcional"
                                      />
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </div>
            </div>



            {/* Slot setup editor popover */}
            {editingPlayoffSlot && (() => {
              const { matchKey, slot } = editingPlayoffSlot;
              const match = playoffMatches[matchKey];
              if (!match) return null;
              
              const currType = slot === 'A' ? match.sourceTypeA : match.sourceTypeB;
              const currVal = slot === 'A' ? match.sourceValueA : match.sourceValueB;
              
              return (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] select-none text-black">
                  <div className="bg-white border-4 border-black p-5 max-w-lg w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative font-mono space-y-4 max-h-[85vh] overflow-y-auto">
                    
                    {/* Header */}
                    <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                      <span className="text-xs font-black uppercase bg-amber-200 border border-black px-2 py-0.5">
                        EDITAR ENTRADA: {matchKey.replace('_', ' ').toUpperCase()} ({slot === 'A' ? 'SUPERIOR' : 'INFERIOR'})
                      </span>
                      <button 
                        onClick={() => setEditingPlayoffSlot(null)}
                        className="text-stone-500 hover:text-black font-extrabold text-xs uppercase tracking-tight border-b border-stone-300 hover:border-black transition-colors"
                      >
                        Cerrar [X]
                      </button>
                    </div>

                    <div className="space-y-4">
                      
                      {/* OPTION 1: BYE */}
                      <div className="border-2 border-black p-3 bg-stone-50">
                        <h5 className="text-xs font-black uppercase mb-1 flex items-center gap-1">
                          🏃💨 OPCIÓN 1: PASAR POR BYE
                        </h5>
                        <p className="text-[10px] text-neutral-500 mb-2">
                          Asigna un pase libre (BYE) para que el oponente avance automáticamente a la siguiente ronda.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleUpdatePlayoffSlot(matchKey, slot, 'bye', '')}
                          className="w-full py-1.5 border border-black text-xs font-black uppercase bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          Asignar BYE
                        </button>
                      </div>

                      {/* OPTION 2: Semilla */}
                      <div className="border-2 border-black p-3 bg-[#fdfcfa]">
                        <h5 className="text-xs font-black uppercase mb-1 flex items-center gap-1 text-emerald-900">
                          🏆 OPCIÓN 2: ASIGNAR POSICIÓN DE GRUPO (SEMILLA)
                        </h5>
                        <p className="text-[10px] text-neutral-500 mb-2">
                          Asocia la posición del grupo. El nombre se actualizará de forma dinámica basándose en la tabla de posiciones real.
                        </p>
                        
                        {availableGroups.length === 0 ? (
                          <div className="text-[10px] text-rose-600 font-bold uppercase leading-tight italic">
                            * No hay grupos configurados para extraer ganadores. Sincroniza y juega los grupos primero.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {availableGroups.map(gLetter => {
                              const standing = getGroupStandingPairs(gLetter);
                              return (
                                <div key={gLetter} className="border border-stone-200 p-2 bg-white">
                                  <div className="text-[9px] font-bold text-neutral-400 mb-1.5 uppercase">
                                    Zona / Grupo {gLetter} — Posiciones:
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[1, 2, 3].map(posNum => {
                                      const pairAtPos = standing[posNum - 1];
                                      const seedVal = `${posNum}_${gLetter}`;
                                      const isSelected = currType === 'seed' && currVal === seedVal;
                                      return (
                                        <button
                                          key={posNum}
                                          type="button"
                                          onClick={() => handleUpdatePlayoffSlot(matchKey, slot, 'seed', seedVal)}
                                          className={`p-1.5 text-[10px] font-black uppercase border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[44px] ${
                                            isSelected
                                              ? 'bg-black text-white border-black'
                                              : 'bg-white hover:bg-stone-50 border-stone-300 text-black'
                                          }`}
                                        >
                                          <span>{posNum}º G{gLetter}</span>
                                          {pairAtPos ? (
                                            <span className={`text-[7px] truncate max-w-full leading-none mt-0.5 ${isSelected ? 'text-emerald-350' : 'text-emerald-600'}`}>
                                              {pairAtPos.jugador1.split(' ')[0]}
                                            </span>
                                          ) : (
                                            <span className="text-[8px] text-neutral-450 font-normal leading-none italic mt-0.5">-</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* OPTION 4: Restablecer a ganador de Octavos */}
                      {playoffType === 'octavos' && match.round === 'cuartos' && (
                        <div className="border-2 border-black p-3 bg-blue-50/50">
                          <h5 className="text-xs font-black uppercase mb-1 flex items-center gap-1 text-blue-900">
                            🔄 OPCIÓN AUTOMÁTICA: VENIR DE OCTAVOS
                          </h5>
                          <p className="text-[10px] text-neutral-500 mb-2">
                            Restablece el flujo para que esta posición de Cuartos de Final la ocupe el ganador del partido de Octavos de Final correspondiente.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const matchNum = Number(match.key.split('_')[1]);
                              const correspondingOctavosKey = slot === 'A' 
                                ? `octavos_${(matchNum * 2) - 1}` 
                                : `octavos_${matchNum * 2}`;
                              handleUpdatePlayoffSlot(match.key, slot, 'winner', correspondingOctavosKey);
                            }}
                            className="w-full py-1.5 border border-black text-xs font-black uppercase bg-white hover:bg-blue-50 text-blue-800 transition-colors cursor-pointer"
                          >
                            Restaurar Automático
                          </button>
                        </div>
                      )}

                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPlayoffSlot(null)}
                        className="w-full py-2 bg-stone-100 hover:bg-stone-200 border-2 border-black uppercase font-black text-xs cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal para Modificar Resultados de Partido Terminado */}
            {editingPlayoffScores && (() => {
              const match = playoffMatches[editingPlayoffScores];
              if (!match) return null;

              const resolvedA = resolvePlayoffSlot(match.sourceTypeA, match.sourceValueA);
              const resolvedB = resolvePlayoffSlot(match.sourceTypeB, match.sourceValueB);

              return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-white border-4 border-black p-5 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                          PROCESO DE PLAYOFFS
                        </span>
                        <h4 className="text-sm font-black uppercase text-black leading-tight">
                          ✏️ MODIFICAR RESULTADOS
                        </h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditingPlayoffScores(null)}
                        className="text-stone-400 hover:text-black font-bold text-xs"
                      >
                        ❌
                      </button>
                    </div>

                    <p className="text-[10px] text-neutral-500 mb-4 font-medium uppercase font-mono bg-stone-50 p-2 border border-stone-200">
                      Partido: {match.round.replace('semis', 'SEMIFINAL').toUpperCase()} - {editingPlayoffScores.split('_')[1]}
                    </p>

                    {/* Inputs de Marcador */}
                    <div className="space-y-4 mb-5">
                      
                      {/* Fila Pareja A */}
                      <div className="flex items-center justify-between gap-4 p-2 border-2 border-stone-200 bg-stone-50">
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] font-bold text-neutral-450 uppercase block leading-none">PAREJA SUPERIOR</span>
                          <span className="text-xs font-black uppercase text-black truncate block mt-1">
                            {resolvedA.pair ? `${resolvedA.pair.jugador1} / ${resolvedA.pair.jugador2}` : resolvedA.label}
                          </span>
                        </div>
                        
                        <div className="flex gap-1.5 shrink-0">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-mono font-bold text-stone-400 mb-0.5">SET 1</span>
                            <input
                              type="text"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              value={match.set1A}
                              onChange={(e) => handleSetScoreChange(match.key, 'set1A', e.target.value.replace(/\D/g, ''))}
                              className="w-10 h-10 text-center font-mono font-bold text-sm border-2 border-black bg-white focus:bg-amber-50"
                              placeholder="-"
                            />
                          </div>
                          {!isMini && (
                            <>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-mono font-bold text-stone-400 mb-0.5">SET 2</span>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  value={match.set2A}
                                  onChange={(e) => handleSetScoreChange(match.key, 'set2A', e.target.value.replace(/\D/g, ''))}
                                  className="w-10 h-10 text-center font-mono font-bold text-sm border-2 border-black bg-white focus:bg-amber-50"
                                  placeholder="-"
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-mono font-bold text-stone-400 mb-0.5">SET 3</span>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  value={match.set3A}
                                  onChange={(e) => handleSetScoreChange(match.key, 'set3A', e.target.value.replace(/\D/g, ''))}
                                  className="w-10 h-10 text-center font-mono font-bold text-sm border-2 border-stone-300 bg-white focus:bg-amber-50 focus:border-black"
                                  placeholder="-"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Fila Pareja B */}
                      <div className="flex items-center justify-between gap-4 p-2 border-2 border-stone-200 bg-stone-50">
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] font-bold text-neutral-450 uppercase block leading-none">PAREJA INFERIOR</span>
                          <span className="text-xs font-black uppercase text-black truncate block mt-1">
                            {resolvedB.pair ? `${resolvedB.pair.jugador1} / ${resolvedB.pair.jugador2}` : resolvedB.label}
                          </span>
                        </div>
                        
                        <div className="flex gap-1.5 shrink-0">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-mono font-bold text-stone-400 mb-0.5">SET 1</span>
                            <input
                              type="text"
                              pattern="[0-9]*"
                              inputMode="numeric"
                              value={match.set1B}
                              onChange={(e) => handleSetScoreChange(match.key, 'set1B', e.target.value.replace(/\D/g, ''))}
                              className="w-10 h-10 text-center font-mono font-bold text-sm border-2 border-black bg-white focus:bg-amber-50"
                              placeholder="-"
                            />
                          </div>
                          {!isMini && (
                            <>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-mono font-bold text-stone-400 mb-0.5">SET 2</span>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  value={match.set2B}
                                  onChange={(e) => handleSetScoreChange(match.key, 'set2B', e.target.value.replace(/\D/g, ''))}
                                  className="w-10 h-10 text-center font-mono font-bold text-sm border-2 border-black bg-white focus:bg-amber-50"
                                  placeholder="-"
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-mono font-bold text-stone-400 mb-0.5">SET 3</span>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  value={match.set3B}
                                  onChange={(e) => handleSetScoreChange(match.key, 'set3B', e.target.value.replace(/\D/g, ''))}
                                  className="w-10 h-10 text-center font-mono font-bold text-sm border-2 border-stone-300 bg-white focus:bg-amber-50 focus:border-black"
                                  placeholder="-"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Clean up scores entirely
                          handleSetScoreChange(match.key, 'set1A', '');
                          handleSetScoreChange(match.key, 'set1B', '');
                          handleSetScoreChange(match.key, 'set2A', '');
                          handleSetScoreChange(match.key, 'set2B', '');
                          handleSetScoreChange(match.key, 'set3A', '');
                          handleSetScoreChange(match.key, 'set3B', '');
                          setEditingPlayoffScores(null);
                        }}
                        className="py-1.5 border border-dashed border-rose-500 hover:bg-rose-50 text-rose-600 uppercase font-black text-[10px] tracking-wider transition-colors cursor-pointer text-center"
                      >
                        Borrar Resultados / Reiniciar Partido
                      </button>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPlayoffScores(null)}
                          className="py-2 bg-stone-100 hover:bg-stone-200 border-2 border-black uppercase font-black text-xs cursor-pointer transition-colors text-center"
                        >
                          Cerrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlayoffScores(null)}
                          className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black uppercase font-black text-xs cursor-pointer transition-colors text-center"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`mt-10 ${fontClass} ${inkColor}`}>
      {/* Editorial Navigation Tab Header using precise 4px border black look */}
      <nav className="flex border-4 border-black h-16 divide-x-4 divide-black overflow-hidden font-mono select-none">
        <button
          onClick={() => onTabChange('jugadores')}
          className={`flex-1 font-black uppercase text-xs sm:text-sm tracking-tighter flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'jugadores' ? 'bg-black text-white' : 'bg-white hover:bg-black/5 text-black'
          }`}
        >
          <span className="text-sm sm:text-xl">01.</span> JUGADORES
        </button>

        <button
          onClick={() => onTabChange('grupos')}
          className={`flex-1 font-black uppercase text-xs sm:text-sm tracking-tighter flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'grupos' ? 'bg-black text-white' : 'bg-white hover:bg-black/5 text-black'
          }`}
        >
          <span className="text-sm sm:text-xl">02.</span> GRUPOS
        </button>

        <button
          onClick={() => onTabChange('playoffs')}
          className={`flex-1 font-black uppercase text-xs sm:text-sm tracking-tighter flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'playoffs' ? 'bg-black text-white' : 'bg-white hover:bg-black/5 text-black'
          }`}
        >
          <span className="text-sm sm:text-xl">03.</span> PLAYOFFS
        </button>
      </nav>

      {/* Context Indicator: Active selected tournament */}
      {selectedTournament ? (
        <div className="bg-emerald-600 text-white px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 font-mono uppercase text-[11px] font-black select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shrink-0" />
            <span>📍 <span className="underline decoration-2 underline-offset-2">{selectedTournament.nombre}</span> ({selectedTournament.club})</span>
          </div>
          <div className="text-[10px] bg-emerald-800 px-2 py-0.5 border border-emerald-500 font-bold tracking-wider rounded-none uppercase">
            CATEGORÍA: {(selectedTournament.categoria === 'otra' && selectedTournament.categoriaOtro ? selectedTournament.categoriaOtro : selectedTournament.categoria).toUpperCase()} &middot; FORMATO: {selectedTournament.modo === 'largo' ? '3 SETS' : '1 SET ⚡'}
          </div>
        </div>
      ) : (
        <div className="bg-amber-500 text-black px-4 py-2.5 text-center text-xs font-black uppercase select-none font-mono">
          ⚠️ Ningún torneo seleccionado. Haz clic en un torneo arriba para activarlo.
        </div>
      )}

      {/* Editorial Tab Content Frame matching design */}
      <div className={`py-6 bg-white min-h-[220px] ${(activeTab === 'grupos' || activeTab === 'playoffs') ? 'px-2 sm:px-4' : 'px-6'}`}>
        {renderTabContent()}
      </div>

      {/* EXPORTAR A GOOGLE SHEETS (GLOBAL PARA TODO EL TORNEO) */}
      {selectedTournament && (
        <div className="mt-8 border-t-4 border-black pt-6">
          <div className="border-2 border-black p-4 bg-[#fffdec] font-mono space-y-3 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                📊 EXPORTAR RESULTADOS A GOOGLE SHEETS
              </span>
              <span className="text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded border border-black uppercase shadow-[1px_1px_0px_#000] hidden sm:inline-block">
                ⚡ APPS SCRIPT ACTIVADO (SIN PERMISOS)
              </span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-black/85">
              Esta acción creará o actualizará la pestaña del torneo con toda la información de la fase de grupos y fase eliminatoria del torneo actual directamente en la planilla de Google Sheets.
            </p>

            <div className="space-y-3 pt-1">
              {exportStatus === 'idle' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportPasswordModalOpen(true);
                      setExportPasswordInput('');
                      setExportPasswordError('');
                    }}
                    className="w-full py-3 bg-[#4285F4] hover:bg-[#357ae8] text-white text-xs font-black uppercase tracking-widest border-2 border-black cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📥 EXPORTAR RESULTADOS</span>
                  </button>
                  <p className="text-[9px] text-stone-500 text-center">
                    * Se requiere introducir la contraseña de administración para sincronizar los resultados con la hoja de Google Sheets.
                  </p>
                </div>
              )}

              {exportStatus === 'exporting' && (
                <div className="w-full py-3 bg-stone-200 text-stone-500 text-xs font-black uppercase tracking-widest border-2 border-black flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>EXPORTANDO DATOS EN VIVO...</span>
                </div>
              )}

              {exportStatus === 'success' && (
                <div className="space-y-2">
                  <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-950 p-3 text-[11px] leading-relaxed uppercase font-bold">
                    <div>🎉 ¡EXPORTACIÓN COMPLETA CON ÉXITO!</div>
                    <div className="text-[10px] opacity-80 mt-1">Nombre de la Pestaña: <span className="font-mono underline">{exportedTabName}</span></div>
                    <div className="text-[9px] opacity-70 mt-1 uppercase font-normal text-stone-600">Actualizada mediante el endpoint de Google Apps Script</div>
                  </div>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1gEJPn4l5OIzl28Fj1DrF_KhrGRuIkKGBovap4PZpBbw"
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-center text-xs font-black uppercase tracking-widest border-2 border-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all"
                  >
                    🗂️ ABRIR PLANILLA DE GOOGLE SHEETS
                  </a>
                  <button
                    type="button"
                    onClick={() => setExportStatus('idle')}
                    className="block w-full text-center text-[9px] font-bold uppercase text-stone-500 hover:underline"
                  >
                    Exportar de nuevo
                  </button>
                </div>
              )}

              {exportStatus === 'error' && (
                <div className="space-y-2">
                  <div className="bg-red-50 border-2 border-red-600 text-red-950 p-3 text-[11px] leading-normal uppercase">
                    <div className="font-black">⚠️ ERROR AL EXPORTAR</div>
                    <div className="text-[10px] font-medium mt-1 normal-case">{exportErrorMsg}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportToGoogleSheets}
                      className="flex-1 py-2 bg-[#4285F4] hover:bg-[#357ae8] text-white text-xs font-black uppercase tracking-widest border-2 border-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all"
                    >
                      REINTENTAR APPS SCRIPT 🔄
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportStatus('idle')}
                      className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-black text-xs font-black uppercase tracking-widest border-2 border-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px"
                    >
                      VOLVER ↩
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CONTRASEÑA DE EXPORTACIÓN */}
      {isExportPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white border-4 border-black p-5 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative font-mono text-black space-y-4">
            
            {/* Header */}
            <div className="border-b-2 border-black pb-2 flex justify-between items-center">
              <span className="text-xs font-black uppercase bg-purple-200 border border-black px-2 py-0.5">
                🔒 ACCESO RESTRINGIDO
              </span>
              <button 
                onClick={() => {
                  setIsExportPasswordModalOpen(false);
                  setExportPasswordInput('');
                  setExportPasswordError('');
                }}
                className="text-stone-500 hover:text-black font-extrabold text-xs uppercase tracking-tight border-b border-stone-300 hover:border-black transition-colors"
              >
                Cerrar
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-black">
                Contraseña de Exportación
              </p>
              <p className="text-[11px] text-stone-600 leading-normal">
                Introduce la contraseña de administración para escribir y guardar la información del torneo en Google Sheets.
              </p>
              
              <input
                type="password"
                placeholder="Ingresa la contraseña para exportar"
                value={exportPasswordInput}
                onChange={(e) => {
                  setExportPasswordInput(e.target.value);
                  setExportPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (exportPasswordInput === '00000') {
                      setIsExportPasswordModalOpen(false);
                      handleExportToGoogleSheets();
                    } else {
                      setExportPasswordError('La contraseña ingresada es incorrecta.');
                    }
                  }
                }}
                className="w-full border-2 border-black p-2 text-xs bg-stone-50 focus:bg-white outline-none focus:ring-0 focus:border-stone-800"
                autoFocus
              />

              {exportPasswordError && (
                <div className="text-[10px] text-red-600 font-extrabold uppercase mt-1">
                  ⚠️ {exportPasswordError}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (exportPasswordInput === '00000') {
                    setIsExportPasswordModalOpen(false);
                    handleExportToGoogleSheets();
                  } else {
                    setExportPasswordError('La contraseña ingresada es incorrecta.');
                  }
                }}
                className="flex-1 py-1.5 bg-[#4285F4] hover:bg-[#357ae8] text-white text-xs font-black uppercase tracking-wider border-2 border-black cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px transition-all"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportPasswordModalOpen(false);
                  setExportPasswordInput('');
                  setExportPasswordError('');
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-black text-xs font-black uppercase border-2 border-black cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA CARGAR RESULTADOS (MINI O LARGO) */}
      {activeScoreModal && (() => {
        const isMini = getTournamentModo() === 'mini';
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] select-none">
            <div className="bg-white border-4 border-black p-5 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative font-mono text-black space-y-4">
              
              {/* Header */}
              <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                <span className="text-xs font-black uppercase bg-amber-200 border border-black px-2 py-0.5">
                  Marcador: ZONA {activeScoreModal.gLetter}
                </span>
                <button 
                  onClick={() => setActiveScoreModal(null)}
                  className="text-stone-500 hover:text-black font-extrabold text-xs uppercase tracking-tight border-b border-stone-300 hover:border-black transition-colors"
                >
                  Cerrar
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h5 className="text-[10px] font-black tracking-widest text-neutral-400 uppercase leading-none">
                  ENFRENTAMIENTO
                </h5>
                <h3 className="text-sm font-black uppercase text-black leading-tight">
                  Pareja {activeScoreModal.i} vs Pareja {activeScoreModal.j}
                </h3>
              </div>

              {/* Board */}
              <div className="space-y-3 pt-1">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-2 text-center select-none">
                  <div className="col-span-6 text-left font-bold text-[9px] text-neutral-400 uppercase">
                    Pareja / Jugadores
                  </div>
                  {isMini ? (
                    <div className="col-span-6 font-black text-[10px] text-red-500 uppercase">
                      SET ÚNICO
                    </div>
                  ) : (
                    <>
                      <div className="col-span-2 font-bold text-[9px] text-neutral-500 uppercase">S1</div>
                      <div className="col-span-2 font-bold text-[9px] text-neutral-500 uppercase">S2</div>
                      <div className="col-span-2 font-bold text-[9px] text-neutral-400 uppercase">S3</div>
                    </>
                  )}
                </div>

                {/* Row 1: Pair A */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 text-left min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] text-white bg-black w-4 h-4 rounded-sm flex items-center justify-center shrink-0 font-bold">
                        {activeScoreModal.i}
                      </span>
                      <span className="font-extrabold text-[11px] text-black uppercase truncate block">
                        {activeScoreModal.pairA.jugador1}
                      </span>
                    </div>
                    <span className="font-semibold text-[10px] text-neutral-400 uppercase truncate block pl-5 leading-tight">
                      {activeScoreModal.pairA.jugador2}
                    </span>
                  </div>
                  
                  {isMini ? (
                    <div className="col-span-6 flex justify-center">
                      <input 
                        type="text" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="0"
                        value={set1A}
                        onChange={(e) => setSet1A(e.target.value.replace(/\D/g, ''))}
                        className="w-16 h-10 border-2 border-black text-center font-black text-lg focus:bg-amber-100 rounded-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="0"
                          value={set1A}
                          onChange={(e) => setSet1A(e.target.value.replace(/\D/g, ''))}
                          className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-amber-100 rounded-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="0"
                          value={set2A}
                          onChange={(e) => setSet2A(e.target.value.replace(/\D/g, ''))}
                          className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-amber-100 rounded-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="0"
                          value={set3A}
                          onChange={(e) => setSet3A(e.target.value.replace(/\D/g, ''))}
                          className="w-10 h-10 border-2 border-stone-300 focus:border-black text-center font-black text-base focus:bg-amber-100 rounded-sm"
                          title="Tercer set opcional (Tie-break)"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Row 2: Pair B */}
                <div className="grid grid-cols-12 gap-2 items-center border-t border-dotted border-stone-200 pt-2.5">
                  <div className="col-span-6 text-left min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] text-white bg-black w-4 h-4 rounded-sm flex items-center justify-center shrink-0 font-bold">
                        {activeScoreModal.j}
                      </span>
                      <span className="font-extrabold text-[11px] text-black uppercase truncate block">
                        {activeScoreModal.pairB.jugador1}
                      </span>
                    </div>
                    <span className="font-semibold text-[10px] text-neutral-400 uppercase truncate block pl-5 leading-tight">
                      {activeScoreModal.pairB.jugador2}
                    </span>
                  </div>

                  {isMini ? (
                    <div className="col-span-6 flex justify-center">
                      <input 
                        type="text" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="0"
                        value={set1B}
                        onChange={(e) => setSet1B(e.target.value.replace(/\D/g, ''))}
                        className="w-16 h-10 border-2 border-black text-center font-black text-lg focus:bg-amber-100 rounded-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="0"
                          value={set1B}
                          onChange={(e) => setSet1B(e.target.value.replace(/\D/g, ''))}
                          className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-amber-100 rounded-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="0"
                          value={set2B}
                          onChange={(e) => setSet2B(e.target.value.replace(/\D/g, ''))}
                          className="w-10 h-10 border-2 border-black text-center font-black text-base focus:bg-amber-100 rounded-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="0"
                          value={set3B}
                          onChange={(e) => setSet3B(e.target.value.replace(/\D/g, ''))}
                          className="w-10 h-10 border-2 border-stone-300 focus:border-black text-center font-black text-base focus:bg-amber-100 rounded-sm"
                          title="Tercer set opcional (Tie-break)"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!isMini && (
                <div className="text-[9px] text-neutral-400 text-center leading-normal italic select-none">
                  * S3 es opcional. Déjalo vacío si terminó en sets directos.
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScoreModal(null)}
                  className="flex-1 py-1.5 text-stone-600 bg-stone-100 hover:bg-stone-200 font-extrabold text-xs uppercase cursor-pointer border-2 border-black text-center transition-colors rounded-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalScore}
                  className="flex-1 py-1.5 text-white bg-black hover:bg-neutral-900 font-black text-xs uppercase cursor-pointer border-2 border-black text-center transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] rounded-sm"
                >
                  Guardar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MANUAL BRACKET / ARMAR CUADRO MODAL */}
      {isArmarCuadroOpen && (() => {
        const availableGroups = getPlayoffGroupLetters();
        const displayGroups = availableGroups.length > 0 ? availableGroups : ['A', 'B', 'C', 'D'];
        
        const parseMatchSlotText = (text: string, matchKey: string): { type: 'seed' | 'winner' | 'bye' | '', value: string } => {
          const norm = text.trim().replace(/\s+/g, '').toUpperCase();
          if (!norm) return { type: '', value: '' };

          if (norm === 'BYE' || norm === 'B') {
            return { type: 'bye', value: '' };
          }

          // Match seeds: 1A, 2b, etc.
          const seedMatch = norm.match(/^([1-9])([A-P])$/);
          if (seedMatch) {
            return { type: 'seed', value: `${seedMatch[1]}_${seedMatch[2]}` };
          }

          // Octavos winners: O1 to O8, G1 to G8
          const oMatch = norm.match(/^(O|G)([1-8])$/);
          if (oMatch) {
            return { type: 'winner', value: `octavos_${oMatch[2]}` };
          }

          // Cuartos winners: C1 to C4, Q1 to Q4
          const cMatch = norm.match(/^(C|Q)([1-4])$/);
          if (cMatch) {
            return { type: 'winner', value: `cuartos_${cMatch[1]}` };
          }

          // Semis winners: S1 to S2, SF1 to SF2
          const sMatch = norm.match(/^(S|SF)([1-2])$/);
          if (sMatch) {
            return { type: 'winner', value: `semis_${sMatch[2]}` };
          }

          // Free-form name/seed input fallback
          return { type: 'seed', value: text };
        };

        const getMatchSlotText = (type: string, value: string): string => {
          if (type === 'bye') return 'BYE';
          if (type === 'seed' && value) {
            const parts = value.split('_');
            if (parts.length === 2 && !isNaN(Number(parts[0]))) {
              return `${parts[0]}${parts[1]}`.toUpperCase();
            }
            return value.toUpperCase();
          }
          if (type === 'winner' && value) {
            const parts = value.split('_');
            if (parts.length === 2) {
              const prefix = parts[0].substring(0, 1).toUpperCase();
              return `${prefix}${parts[1]}`.toUpperCase();
            }
            return value.toUpperCase();
          }
          return '';
        };

        const resolvePlayoffSlotInDraft = (key: string): { label: string; pair: RegisteredPair | null; isBye: boolean } => {
          const resolveDraftSlot = (type: string, value: string): { pair: RegisteredPair | null; isBye: boolean } => {
            if (type === 'bye') return { pair: null, isBye: true };
            if (type === 'seed' && value) {
              const parts = value.split('_');
              if (parts.length === 2) {
                const rankIdx = Number(parts[0]) - 1;
                const groupLetter = parts[1].toUpperCase();
                const sorted = getGroupStandingPairs(groupLetter);
                return { pair: sorted[rankIdx] || null, isBye: false };
              }
            }
            if (type === 'winner' && value) {
              const prev = draftMatches[value];
              if (!prev) return { pair: null, isBye: false };
              const resA = resolveDraftSlot(prev.sourceTypeA, prev.sourceValueA);
              const resB = resolveDraftSlot(prev.sourceTypeB, prev.sourceValueB);
              if (resA.isBye && resB.isBye) return { pair: null, isBye: false };
              if (resA.isBye) return { pair: resB.pair, isBye: false };
              if (resB.isBye) return { pair: resA.pair, isBye: false };
              
              const s1A = Number(prev.set1A);
              const s1B = Number(prev.set1B);
              const hasS1 = prev.set1A !== '' && prev.set1B !== '';
              if (!hasS1) return { pair: null, isBye: false };
              
              const isMini = getTournamentModo() === 'mini';
              if (isMini) {
                if (s1A > s1B) return { pair: resA.pair, isBye: false };
                if (s1B > s1A) return { pair: resB.pair, isBye: false };
              } else {
                const s2A = Number(prev.set2A);
                const s2B = Number(prev.set2B);
                const s3A = Number(prev.set3A);
                const s3B = Number(prev.set3B);
                const hasS2 = prev.set2A !== '' && prev.set2B !== '';
                const hasS3 = prev.set3A !== '' && prev.set3B !== '';
                let setsA = 0;
                let setsB = 0;
                if (hasS1) { if (s1A > s1B) setsA++; else if (s1B > s1A) setsB++; }
                if (hasS2) { if (s2A > s2B) setsA++; else if (s2B > s2A) setsB++; }
                if (hasS3) { if (s3A > s3B) setsA++; else if (s3B > s3A) setsB++; }
                if (setsA >= 2) return { pair: resA.pair, isBye: false };
                if (setsB >= 2) return { pair: resB.pair, isBye: false };
              }
            }
            return { pair: null, isBye: false };
          };

          const draftMatch = draftMatches[key];
          if (!draftMatch) return { label: '(Vacío)', pair: null, isBye: false };

          const res = resolveDraftSlot('winner', key);
          return { label: '', pair: res.pair, isBye: res.isBye };
        };

        const getMatchSlotResolveLabel = (type: string, value: string): { label: string; isValid: boolean; helper: string } => {
          if (!type && !value) {
            return { label: 'Empty', isValid: false, helper: 'Falta completar' };
          }
          if (type === 'bye') {
            return { label: 'BYE 🏃', isValid: true, helper: 'Pasa libre' };
          }
          if (type === 'seed') {
            if (!value) return { label: 'Empty', isValid: false, helper: 'Falta completar' };
            const parts = value.split('_');
            if (parts.length === 2 && !isNaN(Number(parts[0]))) {
              const rankIdx = Number(parts[0]) - 1;
              const groupLetter = parts[1].toUpperCase();
              const sorted = getGroupStandingPairs(groupLetter);
              const pair = sorted[rankIdx];
              const posText = `${parts[0]}º Grupo ${groupLetter}`;
              if (pair) {
                return { 
                  label: `${pair.jugador1} / ${pair.numero ? `P${pair.numero}` : pair.jugador2}`, 
                  isValid: true, 
                  helper: posText 
                };
              }
              return { label: `${posText} (Por definir)`, isValid: true, helper: posText };
            }
            return { label: value, isValid: true, helper: 'Directo' };
          }
          if (type === 'winner') {
            if (!value) return { label: 'Empty', isValid: false, helper: 'Falta completar' };
            const parts = value.split('_');
            if (parts.length === 2) {
              const roundLabel = parts[0] === 'octavos' ? 'Octavos' : parts[0] === 'cuartos' ? 'Cuartos' : 'Semis';
              const winnerNum = parts[1];
              const solvedWinner = resolvePlayoffSlotInDraft(value);
              if (solvedWinner.pair) {
                return {
                  label: `Ganador ${roundLabel} #${winnerNum}: ${solvedWinner.pair.jugador1} / ${solvedWinner.pair.jugador2}`,
                  isValid: true,
                  helper: `Ganador ${roundLabel} #${winnerNum}`
                };
              }
              return {
                label: `Ganador de ${roundLabel} #${winnerNum}`,
                isValid: true,
                helper: `Ganador ${roundLabel} #${winnerNum}`
              };
            }
          }
          return { label: '(No válido)', isValid: false, helper: 'Formato inválido (ej: 1A, BYE, O1)' };
        };

        const handleToggleOctavosAnnul = (octavosKey: string) => {
          const map: Record<string, { matchKey: string; slot: 'A' | 'B' }> = {
            'octavos_1': { matchKey: 'cuartos_1', slot: 'A' },
            'octavos_2': { matchKey: 'cuartos_1', slot: 'B' },
            'octavos_3': { matchKey: 'cuartos_2', slot: 'A' },
            'octavos_4': { matchKey: 'cuartos_2', slot: 'B' },
            'octavos_5': { matchKey: 'cuartos_3', slot: 'A' },
            'octavos_6': { matchKey: 'cuartos_3', slot: 'B' },
            'octavos_7': { matchKey: 'cuartos_4', slot: 'A' },
            'octavos_8': { matchKey: 'cuartos_4', slot: 'B' }
          };
          
          const target = map[octavosKey];
          if (!target) return;

          const currentlyAnnulled = isOctavosMatchAnnulledInDraft(octavosKey);

          setDraftMatches(prev => {
            const parentMatch = prev[target.matchKey];
            if (!parentMatch) return prev;

            const slotPropType = target.slot === 'A' ? 'sourceTypeA' : 'sourceTypeB';
            const slotPropVal = target.slot === 'A' ? 'sourceValueA' : 'sourceValueB';

            if (currentlyAnnulled) {
              // De-annul: restore to winner pointing to octavosKey
              return {
                ...prev,
                [target.matchKey]: {
                  ...parentMatch,
                  [slotPropType]: 'winner',
                  [slotPropVal]: octavosKey
                }
              };
            } else {
              // Annul: change parent slot to empty seed
              return {
                ...prev,
                [target.matchKey]: {
                  ...parentMatch,
                  [slotPropType]: 'seed',
                  [slotPropVal]: ''
                }
              };
            }
          });
        };

        const isDraftComplete = (): boolean => {
          for (const key of Object.keys(draftMatches)) {
            const m = draftMatches[key];
            if (!m) continue;

            if (key.startsWith('octavos_') && isOctavosMatchAnnulledInDraft(key)) {
              continue;
            }

            const resA = getMatchSlotResolveLabel(m.sourceTypeA, m.sourceValueA);
            if (!resA.isValid) return false;

            const resB = getMatchSlotResolveLabel(m.sourceTypeB, m.sourceValueB);
            if (!resB.isValid) return false;
          }
          return true;
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentId: string) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll('.bracket-input')) as HTMLInputElement[];
            const index = inputs.findIndex(input => input.id === currentId);
            if (index !== -1 && index < inputs.length - 1) {
              inputs[index + 1].focus();
              inputs[index + 1].select();
            }
          }
        };

        const isComplete = isDraftComplete();

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] select-none text-black">
            <div className="bg-white border-4 border-black p-5 max-w-7xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative font-mono space-y-4 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="border-b-4 border-black pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy size={24} className="text-[#ffeb2a] stroke-2 animate-bounce" />
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
                      ARMAR LLAVE ELIMINATORIA (Mini-Rama)
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider leading-none mt-0.5">
                      Octavos &rarr; Cuartos &rarr; Semis &rarr; Final
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsArmarCuadroOpen(false)}
                  className="px-2 py-1 text-xs font-black uppercase bg-stone-100 hover:bg-stone-200 border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                >
                  Cerrar [X]
                </button>
              </div>

              {/* Horizontal Scrollable Miniature Bracket */}
              <div className="flex gap-6 overflow-x-auto pb-4 pt-2 select-none min-h-[1150px] scrollbar-thin">
                
                {/* 1. ROUND: OCTAVOS */}
                <div className="flex flex-col shrink-0 w-[130px] space-y-3">
                  <div className="border-2 border-black bg-stone-300 text-black py-1 px-1 text-center text-[10px] font-black uppercase tracking-wider rounded-md">
                    Fase 1: Octavos
                  </div>
                  <div className="flex flex-col justify-around h-[1100px] pb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
                      const mKey = `octavos_${idx}`;
                      const m = draftMatches[mKey] || { sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
                      const isAnnulled = isOctavosMatchAnnulledInDraft(mKey);

                      const resolveA = getMatchSlotResolveLabel(m.sourceTypeA, m.sourceValueA);
                      const resolveB = getMatchSlotResolveLabel(m.sourceTypeB, m.sourceValueB);

                      return (
                        <div key={mKey} className="w-full">
                          <div 
                            className={`border-2 border-black p-1.5 rounded-lg text-left relative flex flex-col gap-1 transition-all w-full ${
                              isAnnulled ? 'opacity-40 bg-zinc-100 border-stone-450' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-stone-200 pb-0.5">
                              <span className="text-[8px] font-extrabold text-neutral-500 tracking-wide uppercase">
                                #{idx}
                              </span>
                              
                              {/* Checkbox to annul / activate */}
                              <label className="flex items-center gap-0.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isAnnulled}
                                  onChange={() => handleToggleOctavosAnnul(mKey)}
                                  className="w-2.5 h-2.5 border border-black rounded-none cursor-pointer accent-black"
                                />
                                <span className="text-[7.5px] font-black uppercase text-stone-600">🚫</span>
                              </label>
                            </div>

                            {/* SLOT A (Superior) */}
                            <div className="space-y-0.5">
                              <input
                                  id={`bracket-input-${mKey}-A`}
                                  type="text"
                                  disabled={isAnnulled}
                                  className="bracket-input w-full bg-white disabled:bg-stone-50 border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                  placeholder="1A"
                                  value={getMatchSlotText(m.sourceTypeA, m.sourceValueA)}
                                  onChange={(e) => {
                                    const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                    handleUpdateDraftSlot(mKey, 'A', type, value);
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-A`)}
                                />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {isAnnulled ? 'Anulado' : resolveA.label}
                              </div>
                            </div>

                            {/* SLOT B (Inferior) */}
                            <div className="space-y-0.5">
                              <input
                                  id={`bracket-input-${mKey}-B`}
                                  type="text"
                                  disabled={isAnnulled}
                                  className="bracket-input w-full bg-white disabled:bg-stone-50 border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                  placeholder="2B"
                                  value={getMatchSlotText(m.sourceTypeB, m.sourceValueB)}
                                  onChange={(e) => {
                                    const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                    handleUpdateDraftSlot(mKey, 'B', type, value);
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-B`)}
                                />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {isAnnulled ? 'Anulado' : resolveB.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ROUND: CUARTOS */}
                <div className="flex flex-col shrink-0 w-[130px] space-y-3">
                  <div className="border-2 border-black bg-emerald-100 text-emerald-950 py-1 px-1 text-center text-[10px] font-black uppercase tracking-wider rounded-md">
                    Fase 2: Cuartos
                  </div>
                  <div className="flex flex-col justify-around h-[1100px] pb-4">
                    {[1, 2, 3, 4].map(idx => {
                      const mKey = `cuartos_${idx}`;
                      const m = draftMatches[mKey] || { sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
                      const resolveA = getMatchSlotResolveLabel(m.sourceTypeA, m.sourceValueA);
                      const resolveB = getMatchSlotResolveLabel(m.sourceTypeB, m.sourceValueB);

                      return (
                        <div key={mKey} className="w-full">
                          <div 
                            className="border-2 border-black p-1.5 rounded-lg bg-white text-left flex flex-col gap-1 w-full"
                          >
                            <div className="text-[8px] font-extrabold text-neutral-500 tracking-wide uppercase border-b border-stone-100 pb-0.5">
                              Cuartos #{idx}
                            </div>

                            {/* SLOT A (Superior) */}
                            <div className="space-y-0.5">
                              <input
                                id={`bracket-input-${mKey}-A`}
                                type="text"
                                className="bracket-input w-full bg-white border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                placeholder={`O${(idx * 2) - 1}`}
                                value={getMatchSlotText(m.sourceTypeA, m.sourceValueA)}
                                onChange={(e) => {
                                  const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                  handleUpdateDraftSlot(mKey, 'A', type, value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-A`)}
                              />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {resolveA.label}
                              </div>
                            </div>

                            {/* SLOT B (Inferior) */}
                            <div className="space-y-0.5">
                              <input
                                id={`bracket-input-${mKey}-B`}
                                type="text"
                                className="bracket-input w-full bg-white border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                placeholder={`O${idx * 2}`}
                                value={getMatchSlotText(m.sourceTypeB, m.sourceValueB)}
                                onChange={(e) => {
                                  const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                  handleUpdateDraftSlot(mKey, 'B', type, value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-B`)}
                              />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {resolveB.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. ROUND: SEMIS */}
                <div className="flex flex-col shrink-0 w-[130px] space-y-3">
                  <div className="border-2 border-black bg-blue-100 text-blue-950 py-1 px-1 text-center text-[10px] font-black uppercase tracking-wider rounded-md">
                    Fase 3: Semis
                  </div>
                  <div className="flex flex-col justify-around h-[1100px] pb-4">
                    {[1, 2].map(idx => {
                      const mKey = `semis_${idx}`;
                      const m = draftMatches[mKey] || { sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
                      const resolveA = getMatchSlotResolveLabel(m.sourceTypeA, m.sourceValueA);
                      const resolveB = getMatchSlotResolveLabel(m.sourceTypeB, m.sourceValueB);

                      return (
                        <div key={mKey} className="w-full">
                          <div 
                            className="border-2 border-black p-1.5 rounded-lg bg-white text-left flex flex-col gap-1 w-full"
                          >
                            <div className="text-[8px] font-extrabold text-neutral-500 tracking-wide uppercase border-b border-stone-100 pb-0.5">
                              Semis #{idx}
                            </div>

                            {/* SLOT A */}
                            <div className="space-y-0.5">
                              <input
                                id={`bracket-input-${mKey}-A`}
                                type="text"
                                className="bracket-input w-full bg-white border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                placeholder={`C${(idx * 2) - 1}`}
                                value={getMatchSlotText(m.sourceTypeA, m.sourceValueA)}
                                onChange={(e) => {
                                  const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                  handleUpdateDraftSlot(mKey, 'A', type, value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-A`)}
                              />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {resolveA.label}
                              </div>
                            </div>

                            {/* SLOT B */}
                            <div className="space-y-0.5">
                              <input
                                id={`bracket-input-${mKey}-B`}
                                type="text"
                                className="bracket-input w-full bg-white border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                placeholder={`C${idx * 2}`}
                                value={getMatchSlotText(m.sourceTypeB, m.sourceValueB)}
                                onChange={(e) => {
                                  const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                  handleUpdateDraftSlot(mKey, 'B', type, value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-B`)}
                              />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {resolveB.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. ROUND: FINAL */}
                <div className="flex flex-col shrink-0 w-[130px] space-y-3">
                  <div className="border-2 border-black bg-amber-100 text-amber-950 py-1 px-1 text-center text-[10px] font-black uppercase tracking-wider rounded-md">
                    Fase 4: Final 👑
                  </div>
                  <div className="flex flex-col justify-around h-[1100px] pb-4">
                    {(() => {
                      const mKey = 'final_1';
                      const m = draftMatches[mKey] || { sourceTypeA: '', sourceValueA: '', sourceTypeB: '', sourceValueB: '' };
                      const resolveA = getMatchSlotResolveLabel(m.sourceTypeA, m.sourceValueA);
                      const resolveB = getMatchSlotResolveLabel(m.sourceTypeB, m.sourceValueB);

                      return (
                        <div className="w-full">
                          <div className="border-2 border-black p-1.5 rounded-lg bg-yellow-50 text-left flex flex-col gap-1 w-full">
                            <div className="text-[8px] font-extrabold text-amber-805 tracking-wide uppercase border-b border-amber-200 pb-0.5">
                              Gran Final
                            </div>

                            {/* SLOT A */}
                            <div className="space-y-0.5">
                              <input
                                id={`bracket-input-${mKey}-A`}
                                type="text"
                                className="bracket-input w-full bg-white border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                placeholder="S1"
                                value={getMatchSlotText(m.sourceTypeA, m.sourceValueA)}
                                onChange={(e) => {
                                  const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                  handleUpdateDraftSlot(mKey, 'A', type, value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-A`)}
                              />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {resolveA.label}
                              </div>
                            </div>

                            {/* SLOT B */}
                            <div className="space-y-0.5">
                              <input
                                id={`bracket-input-${mKey}-B`}
                                type="text"
                                className="bracket-input w-full bg-white border border-black outline-none px-1.5 py-1 text-xs font-black uppercase text-center focus:bg-yellow-50 focus:border-black transition-all rounded"
                                placeholder="S2"
                                value={getMatchSlotText(m.sourceTypeB, m.sourceValueB)}
                                onChange={(e) => {
                                  const { type, value } = parseMatchSlotText(e.target.value, mKey);
                                  handleUpdateDraftSlot(mKey, 'B', type, value);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, `bracket-input-${mKey}-B`)}
                              />
                              <div className="text-[7.5px] font-bold text-neutral-500 truncate leading-none pt-0.5">
                                {resolveB.label}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>

              {/* Footer buttons */}
              <div className="border-t-4 border-black pt-4 flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsArmarCuadroOpen(false)}
                  className="px-4 py-2 text-xs font-black uppercase bg-stone-100 hover:bg-stone-200 border-2 border-black transition-all cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={!isComplete}
                  onClick={() => {
                    setPlayoffMatches(draftMatches);
                    setPlayoffType('octavos');
                    setIsArmarCuadroOpen(false);
                  }}
                  className={`px-5 py-2 text-xs font-black uppercase border-2 border-black transition-all ${
                    isComplete 
                      ? 'bg-[#ffeb2a] hover:bg-[#ffe31a] text-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer' 
                      : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  Confirmar y Aplicar Cuadro ✔️
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
