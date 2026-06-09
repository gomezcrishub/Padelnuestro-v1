import { PlayoffBracket, Group, Pair, Match } from '../types';
import { Play, Trophy, Users, Edit2, RefreshCw, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { calculateGroupStandings } from '../utils/tournamentSolver';

function toUnicodeBold(text: string): string {
  if (!text) return '';
  const safeText = String(text);
  const boldMap: Record<string, string> = {
    '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗', '0': '𝟎',
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋',
    'r': '𝐫', 'o': '𝐨', 'd': '𝐝', 't': '𝐭', 'e': '𝐞', 'm': '𝐦', 's': '𝐬', 'a': '𝐚', 'g': '𝐠', 'p': '𝐩', 'u': '𝐮',
    'º': 'º'
  };
  return Array.from(safeText).map(char => boldMap[char] || char).join('');
}

interface PlayoffBracketViewProps {
  bracket: PlayoffBracket | null;
  groups: Group[];
  pairs: Pair[];
  onGenerateBracket: (size: '2' | '4' | '8' | '10' | '12' | '16') => void;
  onSelectMatch: (match: Match) => void;
  onUpdateMatchSeeding: (roundName: string, matchId: string, teamKey: 'teamAId' | 'teamBId', pairId: string) => void;
  onResetBracket: () => void;
  onToggleMatchDisable?: (matchId: string) => void;
  onToggleMatchBye?: (matchId: string) => void;
  tournamentId?: string;
  tournamentName?: string;
  category?: string;
  type?: string;
}

export default function PlayoffBracketView({
  bracket,
  groups,
  pairs,
  onGenerateBracket,
  onSelectMatch,
  onUpdateMatchSeeding,
  onResetBracket,
  onToggleMatchDisable,
  onToggleMatchBye,
  tournamentId = '',
  tournamentName = '',
  category = '',
  type = '',
}: PlayoffBracketViewProps) {
  const [copied, setCopied] = useState(false);
  // Build a lookup map of pair standing info: pairId -> "1ro A", "2do B", etc.
  const pairStandingsMap: Record<string, string> = {};
  groups.forEach(group => {
    // extract group letter from name (e.g. "Grupo A" -> "A")
    const groupLetter = group.name.replace('Grupo ', '').trim();
    const standings = calculateGroupStandings(group, pairs);
    standings.forEach((row, index) => {
      const posNames = ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo'];
      const posLabel = posNames[index] || `${index + 1}º`;
      pairStandingsMap[row.pairId] = `${posLabel} ${groupLetter}`;
    });
  });

  // Generate options sorted by rank first, then alphabetically by group
  // Example: 1ro A, 1ro B, 1ro C, 1ro D, 2do A, 2do B, etc.
  const positionOptions: { label: string; pairId: string; player1: string; player2: string }[] = [];
  const posNames = ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo'];
  let maxPairsInGroup = 0;
  groups.forEach(group => {
    if (group.pairIds.length > maxPairsInGroup) {
      maxPairsInGroup = group.pairIds.length;
    }
  });

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  for (let rankIdx = 0; rankIdx < maxPairsInGroup; rankIdx++) {
    const posLabel = posNames[rankIdx] || `${rankIdx + 1}º`;
    sortedGroups.forEach(group => {
      const standings = calculateGroupStandings(group, pairs);
      const row = standings[rankIdx];
      if (row) {
        const groupLetter = group.name.replace('Grupo ', '').trim();
        positionOptions.push({
          label: `${posLabel} ${groupLetter}`,
          pairId: row.pairId,
          player1: row.pair.player1,
          player2: row.pair.player2
        });
      }
    });
  }

  const isPredecessorDisabled = (rIdx: number, mIdx: number, teamKey: 'teamAId' | 'teamBId') => {
    if (rIdx !== 1) return false; // currently only handles Cuartos de final (rIdx=1)
    const prevRound = bracket?.rounds[0];
    if (!prevRound) return false;
    const prevMatchIdx = 2 * mIdx + (teamKey === 'teamAId' ? 0 : 1);
    const prevMatch = prevRound.matches[prevMatchIdx];
    return !!prevMatch?.disabled;
  };

  // If no bracket is generated, show the setup panel
  if (!bracket) {
    return (
      <div className="bg-white border-2 border-neutral-950 p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[350px] shadow-none font-sans">
        <div className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center text-3xl mb-4">
          🏆
        </div>
        <h3 className="text-neutral-950 font-black text-lg uppercase tracking-tight">Armar Cuadro Eliminatorio</h3>
        <p className="text-neutral-500 text-sm max-w-sm mt-2 mb-6">
          Configura y arma los cruces finales por eliminación directa (Playoffs). Selecciona si deseas iniciar el cuadro completo desde Octavos de final (16 parejas) o Cuartos de Final (8 parejas).
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onGenerateBracket('16')}
            className="bg-neutral-950 hover:bg-neutral-800 text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <Trophy className="w-4 h-4 text-white" />
            <span>Generar desde Octavos</span>
          </button>

          <button
            type="button"
            onClick={() => onGenerateBracket('8')}
            className="bg-white hover:bg-neutral-50 border-2 border-neutral-950 text-neutral-950 font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <Trophy className="w-4 h-4 text-neutral-950" />
            <span>Generar desde Cuartos</span>
          </button>
        </div>
      </div>
    );
  }

  // Find champion if the final match is played and has a winner
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  const championPair = finalMatch?.played && finalMatch.winnerId
    ? pairs.find(p => p.id === finalMatch.winnerId)
    : null;

  // Function to calculate points earned by each pair's players
  const calculatePairPoints = (pairId: string): number => {
    if (!bracket || !bracket.rounds || bracket.rounds.length === 0) return 0;
    const L = bracket.rounds.length;
    let maxRoundIdx = -1;
    let isWinnerOfFinal = false;

    for (let rIdx = 0; rIdx < L; rIdx++) {
      const round = bracket.rounds[rIdx];
      const hasPair = round.matches.some(m => m.teamAId === pairId || m.teamBId === pairId);
      if (hasPair) {
        maxRoundIdx = rIdx;
        if (rIdx === L - 1) { // Final
          const finalMatchCheck = round.matches[0];
          if (finalMatchCheck && finalMatchCheck.winnerId === pairId) {
            isWinnerOfFinal = true;
          }
        }
      }
    }

    if (maxRoundIdx === -1) return 0;
    
    // Distance from final
    const rFromEnd = L - 1 - maxRoundIdx;
    
    if (rFromEnd === 0) { // Finalist or Winner
      return isWinnerOfFinal ? 1000 : 700;
    } else if (rFromEnd === 1) { // Semifinales
      return 350;
    } else if (rFromEnd === 2) { // Cuartos de final
      return 150;
    } else if (rFromEnd === 3) { // Octavos de final
      return 30;
    }
    
    return 0;
  };

  const handleCopyPointsText = () => {
    const headers = ['torneo_id', 'categoria', 'tipo', 'jugador_nombre', 'puntos'];
    const rows = [headers.join(',')];

    const escapeCSV = (val: string) => {
      const clean = val.replace(/"/g, '""');
      return `"${clean}"`;
    };

    pairs.forEach(pair => {
      const points = calculatePairPoints(pair.id);
      
      // Player 1 Row
      rows.push([
        escapeCSV(tournamentName || tournamentId),
        escapeCSV(category),
        escapeCSV(type),
        escapeCSV(pair.player1),
        points
      ].join(','));

      // Player 2 Row
      rows.push([
        escapeCSV(tournamentName || tournamentId),
        escapeCSV(category),
        escapeCSV(type),
        escapeCSV(pair.player2),
        points
      ].join(','));
    });

    const csvContent = rows.join('\n');
    
    navigator.clipboard.writeText(csvContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles: ', err);
      });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header bar with controls */}
      <div className="bg-white border-2 border-neutral-950 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
        <div>
          <h3 className="text-neutral-950 font-black text-sm flex items-center gap-2 uppercase tracking-wide">
            <span>Cuadro Eliminatorio en Curso</span>
            {championPair && (
              <span className="text-[10px] bg-neutral-950 text-white px-2.5 py-1 rounded font-mono font-black flex items-center gap-1 animate-pulse tracking-widest">
                🏆 CAMPEÓN DEFINIDO
              </span>
            )}
          </h3>
          <p className="text-neutral-500 text-xs mt-0.5 font-medium">
            Los ganadores de cada llave avanzan automáticamente a la siguiente ronda del cuadro.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {championPair && (
            <button
              onClick={handleCopyPointsText}
              className="px-4 py-2 text-xs bg-white border-2 border-neutral-950 hover:bg-neutral-50 text-neutral-950 font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-none uppercase tracking-wider"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-950" />
                  <span>Compartir Puntos</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onResetBracket}
            className="px-4 py-2 text-xs bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl transition flex items-center gap-2 self-start md:self-center font-black uppercase tracking-widest"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
            <span>Reiniciar Cuadro</span>
          </button>
        </div>
      </div>

      {/* Visual champion card */}
      {championPair && (
        <div className="bg-white border-4 border-neutral-950 p-8 rounded-2xl text-center space-y-4 animate-fade-in shadow-none flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-950 border-2 border-neutral-950 flex items-center justify-center text-3xl mx-auto text-white animate-bounce">
            🏆
          </div>
          <div>
            <h3 className="text-neutral-950 font-black text-xs uppercase tracking-widest border-b border-neutral-950 pb-1 inline-block">¡Campeones del Torneo!</h3>
            <p className="text-neutral-950 font-black text-2xl mt-1.5">{championPair.player1} & {championPair.player2}</p>
            <p className="text-neutral-500 text-xs mt-1 font-medium">Felicitaciones a los ganadores de la gran final.</p>
          </div>
          <button
            onClick={handleCopyPointsText}
            className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest w-full sm:w-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span>¡Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>Compartir Puntos (WhatsApp)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Scrollable Layout for Bracket Tree */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[800px] flex items-stretch gap-8 px-1 py-4">
          
          {bracket.rounds.map((round, rIndex) => {
            const isFirstRound = rIndex === 0;

            return (
              <div key={round.name} className="flex-1 flex flex-col justify-around min-h-[460px] space-y-4">
                
                {/* Round Header Name */}
                <div className="text-center pb-2 border-b-2 border-neutral-950 flex-shrink-0">
                  <h4 className="text-neutral-950 font-black text-sm uppercase tracking-wider font-mono">{round.name}</h4>
                  <p className="text-neutral-500 text-[10px] uppercase font-mono font-bold mt-0.5">{round.matches.length} {round.matches.length === 1 ? 'partido' : 'partidos'}</p>
                </div>

                {/* Match boxes */}
                <div className="flex-1 flex flex-col justify-around gap-6">
                  {round.matches.map((match, mIndex) => {
                    const pairA = pairs.find(p => p.id === match.teamAId);
                    const pairB = pairs.find(p => p.id === match.teamBId);
                    const isWinnerA = match.winnerId === match.teamAId && match.played;
                    const isWinnerB = match.winnerId === match.teamBId && match.played;
                    const isDisabled = !!match.disabled;

                    const showSelectA = !isDisabled && (match.bye || ((isFirstRound || isPredecessorDisabled(rIndex, mIndex, 'teamAId')) && !match.played));
                    const showSelectB = !isDisabled && !match.bye && ((isFirstRound || isPredecessorDisabled(rIndex, mIndex, 'teamBId')) && !match.played);

                    return (
                      <div 
                        key={match.id}
                        className={`border-2 rounded-xl overflow-hidden shadow-none flex flex-col w-56 text-xs transition-all duration-200 ${
                          isDisabled
                            ? 'bg-neutral-55/60 border-neutral-200 opacity-60'
                            : 'bg-white border-neutral-950'
                        }`}
                      >
                        {/* Match Label */}
                        <div className="bg-neutral-100 text-neutral-900 px-3 py-1.5 text-[9px] uppercase font-mono border-b-2 border-neutral-950 flex justify-between items-center font-black">
                          <span className={`${isDisabled ? 'line-through text-neutral-450 font-bold' : 'text-neutral-900 font-mono font-black'} truncate max-w-[70px]`}>
                            Llave {mIndex + 1} {isDisabled && '(Desc.)'}
                          </span>
                          <div className="flex items-center gap-1">
                            {match.played && !isDisabled && !match.bye && <span className="text-neutral-950 font-black mr-1 text-[8px] uppercase tracking-wide">Jugado</span>}
                            {match.bye && !isDisabled && <span className="text-neutral-950 font-black mr-1 text-[8px] uppercase tracking-wide notranslate" translate="no">BYE</span>}
                            {isFirstRound && (
                              <button
                                type="button"
                                onClick={() => onToggleMatchBye && onToggleMatchBye(match.id)}
                                className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest border transition-all duration-150 notranslate ${
                                  match.bye
                                    ? 'bg-neutral-950 border-neutral-950 text-white hover:bg-neutral-800 cursor-pointer'
                                    : 'bg-white border-neutral-350 text-neutral-950 hover:bg-neutral-50 cursor-pointer'
                                }`}
                                title={match.bye ? 'Desactivar BYE (Pase directo)' : 'Activar BYE (Pase directo)'}
                                translate="no"
                              >
                                {match.bye ? 'SIN BYE' : 'BYE'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Teams score lines */}
                        <div className="p-2.5 space-y-2">
                          
                          {/* TEAM A LINE */}
                          <div className={`flex items-center justify-between gap-2.5 ${isWinnerB || isDisabled ? 'text-neutral-405 opacity-80' : ''}`}>
                            <div className="flex-1 min-w-0">
                              {showSelectA ? (
                                // Show custom dropdown selector for manual seeding modifications or if predecessor is disabled
                                <select
                                  value={match.teamAId || ''}
                                  onChange={(e) => onUpdateMatchSeeding(round.name, match.id, 'teamAId', e.target.value)}
                                  className="w-full bg-white text-neutral-950 border-2 border-neutral-300 text-[10px] rounded px-1 py-0.5 font-sans focus:outline-none focus:border-neutral-950"
                                >
                                  <option value="" className="notranslate" translate="no">{match.bye ? '-- Pasa por BYE --' : '-- Seleccionar --'}</option>
                                  {positionOptions.map((opt) => {
                                    const isSelected = match.teamAId === opt.pairId;
                                    const optText = isSelected 
                                      ? `${opt.label}. ${opt.player1} - ${opt.player2}` 
                                      : opt.label;
                                    return (
                                      <option key={opt.pairId} value={opt.pairId}>
                                        {optText}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <div className={isDisabled ? 'line-through text-neutral-400 font-medium' : isWinnerA ? 'text-neutral-950 font-black' : 'text-neutral-800 font-bold'}>
                                  <p className="truncate text-[11px] leading-snug">
                                    {pairA ? (
                                      pairStandingsMap[pairA.id] 
                                        ? `${pairStandingsMap[pairA.id]}. ${pairA.player1}` 
                                        : pairA.player1
                                    ) : 'Por clasificar'}
                                  </p>
                                  {pairA && (
                                    <p className="truncate text-[10px] leading-snug mt-0.5 text-neutral-500 font-bold">
                                      {pairA.player2}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Score Display (inline small box) */}
                            {match.played && pairA && !isDisabled && !match.bye && (
                              <div className="flex gap-1 flex-shrink-0">
                                <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded font-mono text-[10px] font-black border transition ${isWinnerA ? 'text-white bg-neutral-950 border-neutral-950' : 'text-neutral-450 bg-neutral-50 border-neutral-200'}`}>{match.set1.teamA}</span>
                                {match.set2 && (match.set2.teamA > 0 || match.set2.teamB > 0 || match.set3.teamA > 0 || match.set3.teamB > 0) && (
                                  <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded font-mono text-[10px] font-black border transition ${isWinnerA ? 'text-white bg-neutral-950 border-neutral-950' : 'text-neutral-450 bg-neutral-50 border-neutral-200'}`}>{match.set2.teamA}</span>
                                )}
                                {match.set3 && (match.set3.teamA > 0 || match.set3.teamB > 0) && (
                                  <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded font-mono text-[10px] font-black border transition ${isWinnerA ? 'text-white bg-neutral-950 border-neutral-950' : 'text-neutral-500 bg-neutral-100 border-neutral-355'}`}>{match.set3.teamA}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="h-[1px] bg-neutral-200" />

                          {/* TEAM B LINE */}
                          <div className={`flex items-center justify-between gap-2.5 ${isWinnerA || isDisabled || match.bye ? 'text-neutral-405 opacity-80' : ''}`}>
                            <div className="flex-1 min-w-0">
                              {match.bye ? (
                                <p className="text-[10px] font-mono font-black text-neutral-400 tracking-wider uppercase italic notranslate" translate="no">
                                  ★ BYE PASO LIBRE ★
                                </p>
                              ) : showSelectB ? (
                                <select
                                  value={match.teamBId || ''}
                                  onChange={(e) => onUpdateMatchSeeding(round.name, match.id, 'teamBId', e.target.value)}
                                  className="w-full bg-white text-neutral-950 border-2 border-neutral-300 text-[10px] rounded px-1 py-0.5 font-sans focus:outline-none focus:border-neutral-950"
                                >
                                  <option value="">-- Seleccionar --</option>
                                  {positionOptions.map((opt) => {
                                    const isSelected = match.teamBId === opt.pairId;
                                    const optText = isSelected 
                                      ? `${opt.label}. ${opt.player1} - ${opt.player2}` 
                                      : opt.label;
                                    return (
                                      <option key={opt.pairId} value={opt.pairId}>
                                        {optText}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <div className={isDisabled ? 'line-through text-neutral-400 font-medium' : isWinnerB ? 'text-neutral-950 font-black' : 'text-neutral-800 font-bold'}>
                                  <p className="truncate text-[11px] leading-snug">
                                    {pairB ? (
                                      pairStandingsMap[pairB.id] 
                                        ? `${pairStandingsMap[pairB.id]}. ${pairB.player1}` 
                                        : pairB.player1
                                    ) : 'Por clasificar'}
                                  </p>
                                  {pairB && (
                                    <p className="truncate text-[10px] leading-snug mt-0.5 text-neutral-500 font-bold">
                                      {pairB.player2}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Score Display */}
                            {match.played && pairB && !isDisabled && !match.bye && (
                              <div className="flex gap-1 flex-shrink-0">
                                <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded font-mono text-[10px] font-black border transition ${isWinnerB ? 'text-white bg-neutral-950 border-neutral-950' : 'text-neutral-450 bg-neutral-50 border-neutral-200'}`}>{match.set1.teamB}</span>
                                {match.set2 && (match.set2.teamA > 0 || match.set2.teamB > 0 || match.set3.teamA > 0 || match.set3.teamB > 0) && (
                                  <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded font-mono text-[10px] font-black border transition ${isWinnerB ? 'text-white bg-neutral-950 border-neutral-950' : 'text-neutral-450 bg-neutral-50 border-neutral-200'}`}>{match.set2.teamB}</span>
                                )}
                                {match.set3 && (match.set3.teamA > 0 || match.set3.teamB > 0) && (
                                  <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded font-mono text-[10px] font-black border transition ${isWinnerB ? 'text-white bg-neutral-950 border-neutral-950' : 'text-neutral-500 bg-neutral-100 border-neutral-355'}`}>{match.set3.teamB}</span>
                                )}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* CTA Play/Score buttons */}
                        {isDisabled ? (
                          <div className="bg-neutral-100 text-neutral-400 font-black uppercase text-center py-2 text-[9px] border-t-2 border-neutral-950 rounded-b-xl">
                            Llave desactivada
                          </div>
                        ) : match.bye ? (
                          <div className="bg-neutral-50 text-neutral-500 font-black uppercase tracking-wider text-center py-2 text-[9px] border-t-2 border-neutral-955 rounded-b-xl notranslate" translate="no">
                            Pasa por BYE
                          </div>
                        ) : (!match.teamAId || !match.teamBId) ? (
                          <div className="bg-neutral-55 text-neutral-455 text-center font-bold py-2 text-[9px] uppercase border-t border-neutral-200 rounded-b-xl">
                            Esperando rivales
                          </div>
                        ) : match.played ? (
                          <button
                            type="button"
                            onClick={() => onSelectMatch(match)}
                            className="bg-white hover:bg-neutral-50 text-neutral-900 border-t-2 border-neutral-950 hover:text-neutral-950 text-center py-2 text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer font-black w-full rounded-b-xl uppercase tracking-wider"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar Resultado</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectMatch(match)}
                            className="bg-neutral-950 hover:bg-neutral-800 text-white font-black text-center py-2.5 text-[10px] border-t-2 border-neutral-950 transition flex items-center justify-center gap-1.5 cursor-pointer w-full rounded-b-xl uppercase tracking-widest"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>REGISTRAR SCORES</span>
                          </button>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
          
          {/* Champion Crown Podium Column */}
          <div className="w-48 flex-shrink-0 flex flex-col justify-center text-center border-l-2 border-dashed border-neutral-300 pl-8">
            <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center space-y-3.5 transition-all duration-300 ${
              championPair 
                ? 'border-4 border-neutral-950 bg-white shadow-none' 
                : 'border-neutral-250 bg-neutral-50 opacity-40'
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                championPair ? 'bg-neutral-950 text-white border-2 border-neutral-950' : 'bg-white text-neutral-400'
              }`}>
                🏆
              </div>
              <div>
                <h4 className="text-neutral-500 uppercase tracking-widest font-mono text-[9px] font-black">Campeón</h4>
                {championPair ? (
                  <div className="text-neutral-950 font-black text-xs mt-1 space-y-0.5">
                    <p className="truncate">{championPair.player1}</p>
                    <p className="truncate text-neutral-500 font-extrabold">{championPair.player2}</p>
                  </div>
                ) : (
                  <p className="text-neutral-400 font-black text-xs uppercase font-mono tracking-wider mt-1">En juego</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
