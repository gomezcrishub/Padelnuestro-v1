import { useState } from 'react';
import { Group, Pair, Match, TournamentFormat } from '../types';
import { calculateGroupStandings } from '../utils/tournamentSolver';
import { Edit2, Play, Trophy, Users, Copy, Check } from 'lucide-react';

interface GroupStageViewProps {
  groups: Group[];
  pairs: Pair[];
  onGenerateGroups: () => void;
  onSelectMatch: (match: Match) => void;
  onAdvanceToPlayoffs: () => void;
  canAdvance: boolean;
  format?: TournamentFormat;
  onResetGroups?: () => void;
}

// Helper function to calculate and format match results badges for a pair
function getMatchBadges(group: Group, pairId: string, format: TournamentFormat = 'Largo') {
  const completedMatches = group.matches.filter(
    (m) => m.played && !m.annulled && (m.teamAId === pairId || m.teamBId === pairId)
  );

  return completedMatches.map((match) => {
    const isTeamA = match.teamAId === pairId;
    
    // Determine win state
    const isWin = match.winnerId === pairId;

    // Calculate set scores
    let setsWon = 0;
    let setsLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    // Set 1
    const s1A = match.set1 ? match.set1.teamA : 0;
    const s1B = match.set1 ? match.set1.teamB : 0;
    if (s1A > 0 || s1B > 0) {
      if (isTeamA) {
        gamesWon += s1A;
        gamesLost += s1B;
        if (s1A > s1B) setsWon++; else if (s1B > s1A) setsLost++;
      } else {
        gamesWon += s1B;
        gamesLost += s1A;
        if (s1B > s1A) setsWon++; else if (s1A > s1B) setsLost++;
      }
    }

    // Set 2
    const s2A = match.set2 ? match.set2.teamA : 0;
    const s2B = match.set2 ? match.set2.teamB : 0;
    if (s2A > 0 || s2B > 0) {
      if (isTeamA) {
        gamesWon += s2A;
        gamesLost += s2B;
        if (s2A > s2B) setsWon++; else if (s2B > s2A) setsLost++;
      } else {
        gamesWon += s2B;
        gamesLost += s2A;
        if (s2B > s2A) setsWon++; else if (s2A > s2B) setsLost++;
      }
    }

    // Set 3 (only in Largo)
    if (format === 'Largo') {
      const s3A = match.set3 ? match.set3.teamA : 0;
      const s3B = match.set3 ? match.set3.teamB : 0;
      if (s3A > 0 || s3B > 0) {
        if (isTeamA) {
          gamesWon += s3A;
          gamesLost += s3B;
          if (s3A > s3B) setsWon++; else if (s3B > s3A) setsLost++;
        } else {
          gamesWon += s3B;
          gamesLost += s3A;
          if (s3B > s3A) setsWon++; else if (s3A > s3B) setsLost++;
        }
      }
    }

    const setDiff = setsWon - setsLost;
    const gameDiff = gamesWon - gamesLost;

    // Format badge text
    let text = '';
    if (format === 'Mini') {
      // Mini format is 1 set, e.g. +4 or -4
      const sign = gameDiff > 0 ? '+' : '';
      text = `${sign}${gameDiff}`;
    } else {
      // Largo format, e.g. +2(+4) or -2(-4)
      const setSign = setDiff > 0 ? '+' : '';
      const gameSign = gameDiff > 0 ? '+' : '';
      text = `${setSign}${setDiff}(${gameSign}${gameDiff})`;
    }

    return {
      matchId: match.id,
      isWin,
      text,
      tooltip: `Sets: ${setsWon}-${setsLost}, Games: ${gamesWon}-${gamesLost}`
    };
  });
}

export default function GroupStageView({
  groups,
  pairs,
  onGenerateGroups,
  onSelectMatch,
  onAdvanceToPlayoffs,
  canAdvance,
  format = 'Largo',
  onResetGroups,
}: GroupStageViewProps) {
  const [copied, setCopied] = useState(false);

  const renderMatchResultCell = (group: Group, pairId: string, idx1: number, idx2: number) => {
    const id1 = group.pairIds[idx1];
    const id2 = group.pairIds[idx2];
    
    // If either of the pair IDs doesn't exist, we can't show a match
    if (!id1 || !id2) return <span className="text-neutral-300 font-mono text-[10px]">—</span>;

    // The current row's pair MUST be one of the two pairs to see it from their perspective,
    // otherwise they are not part of this column's match, so show a neutral spacer.
    if (pairId !== id1 && pairId !== id2) {
      return <span className="text-neutral-300 font-mono text-[10px]">—</span>;
    }

    const match = group.matches.find(m => 
      (m.teamAId === id1 && m.teamBId === id2) ||
      (m.teamAId === id2 && m.teamBId === id1)
    );

    if (!match) {
      return <span className="text-neutral-300 font-mono text-[10px]">—</span>;
    }

    if (!match.played) {
      return <span className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Pnd</span>;
    }

    if (match.annulled) {
      return <span className="text-neutral-400 text-[10px] line-through font-sans uppercase">Anul</span>;
    }

    const isTeamA = match.teamAId === pairId;
    
    // Extract set scores
    const s1Self = isTeamA ? match.set1.teamA : match.set1.teamB;
    const s1Opp = isTeamA ? match.set1.teamB : match.set1.teamA;
    
    const s2Self = isTeamA ? match.set2.teamA : match.set2.teamB;
    const s2Opp = isTeamA ? match.set2.teamB : match.set2.teamA;
    
    const s3Self = isTeamA ? match.set3.teamA : match.set3.teamB;
    const s3Opp = isTeamA ? match.set3.teamB : match.set3.teamA;

    const isWin = match.winnerId === pairId;

    let scoreText = '';
    if (format === 'Mini') {
      scoreText = `${s1Self}-${s1Opp}`;
    } else {
      const parts = [`${s1Self}-${s1Opp}`, `${s2Self}-${s2Opp}`];
      if (s3Self > 0 || s3Opp > 0) {
        parts.push(`${s3Self}-${s3Opp}`);
      }
      scoreText = parts.join(' | ');
    }

    return (
      <span className={`inline-flex items-center justify-center font-mono font-black text-[9.5px] px-1 py-0.5 rounded leading-none border shrink-0 min-w-[32px] text-center ${
        isWin 
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
          : 'bg-rose-50 text-rose-800 border-rose-200'
      }`}>
        {scoreText}
      </span>
    );
  };
  
  if (groups.length === 0) {
    return (
      <div className="bg-white border-2 border-neutral-950 p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[350px] shadow-none">
        <div className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center text-3xl mb-4">
          📊
        </div>
        <h3 className="text-neutral-950 font-black text-lg uppercase tracking-tight">Generar Fase de Grupos</h3>
        <p className="text-neutral-500 text-sm max-w-sm mt-2 mb-6">
          Tenemos {pairs.length} parejas inscriptas. Al generar la fase de grupos, el sistema organizará automáticamente las zonas de juego y creará el fixture de partidos correspondientes.
        </p>

        <button
          type="button"
          onClick={onGenerateGroups}
          disabled={pairs.length < 2}
          className="bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 text-white font-black px-6 py-3.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer uppercase tracking-widest"
        >
          <Users className="w-4 h-4 text-white" />
          <span>Generar Fase de Grupos</span>
        </button>
        {pairs.length < 2 && (
          <p className="text-neutral-500 font-mono text-xs mt-3">Se necesitan al menos 2 parejas inscriptas para iniciar grupos.</p>
        )}
      </div>
    );
  }

  const handleCopyResults = () => {
    // Generate CSV headers
    const headers = ['Grupo', 'Pareja1', 'Pareja2', 'GamePareja1', 'GamePareja2', 'Estado'];
    
    // Rows list
    const rows = [headers.join(',')];

    groups.forEach((group) => {
      group.matches.forEach((match) => {
        const pairA = pairs.find((p) => p.id === match.teamAId);
        const pairB = pairs.find((p) => p.id === match.teamBId);

        const nameA = pairA ? `${pairA.player1} - ${pairA.player2}` : 'Pareja A';
        const nameB = pairB ? `${pairB.player1} - ${pairB.player2}` : 'Pareja B';

        let game1 = '';
        let game2 = '';
        let estado = 'Pendiente';

        if (match.played) {
          if (match.annulled) {
            estado = 'Anulado';
          } else {
            estado = 'jugado';
            if (format === 'Mini') {
              game1 = String(match.set1?.teamA ?? 0);
              game2 = String(match.set1?.teamB ?? 0);
            } else {
              game1 = String(
                (match.set1?.teamA ?? 0) + 
                (match.set2?.teamA ?? 0) + 
                (match.set3?.teamA ?? 0)
              );
              game2 = String(
                (match.set1?.teamB ?? 0) + 
                (match.set2?.teamB ?? 0) + 
                (match.set3?.teamB ?? 0)
              );
            }
          }
        }

        // Clean names of commas or double quotes to prevent messing up the CSV format
        const cleanNameA = nameA.replace(/"/g, '""');
        const cleanNameB = nameB.replace(/"/g, '""');
        const groupLetter = group.name.replace(/Grupo\s+/i, '').trim();

        // CSV line
        rows.push(`"${groupLetter}","${cleanNameA}","${cleanNameB}",${game1},${game2},"${estado}"`);
      });
    });

    const csvContent = rows.join('\r\n');
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
    <div className="space-y-4 font-sans">
      
      {/* Advance to playoffs Callout Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h3 className="text-neutral-950 font-black text-sm flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-950 animate-pulse"></span>
            Fase de Grupos en Curso
          </h3>
          <p className="text-neutral-500 text-[11px] mt-0.5 font-medium">
            Una vez finalizados los partidos de zona, puedes avanzar para armar los cruces de play-off directos.
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyResults}
            className={`px-3.5 py-2 text-xs font-black rounded border-2 transition cursor-pointer font-sans inline-flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600'
                : 'bg-white border-neutral-300 hover:border-neutral-950 text-neutral-950 hover:bg-neutral-50'
            }`}
            title="Copiar resultados de grupo al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Resultados Copiados</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-800" />
                <span>Copiar Resultados</span>
              </>
            )}
          </button>

          {onResetGroups && (
            <button
              type="button"
              onClick={onResetGroups}
              className="px-3.5 py-2 text-xs font-black rounded bg-white border-2 border-neutral-300 hover:border-neutral-950 text-neutral-950 hover:bg-neutral-50 transition cursor-pointer font-sans"
            >
              Reiniciar
            </button>
          )}

          <button
            type="button"
            onClick={onAdvanceToPlayoffs}
            className={`px-4 py-2 text-xs font-black rounded transition overflow-hidden uppercase tracking-wider ${
              canAdvance
                ? 'bg-neutral-950 text-white hover:bg-neutral-800 cursor-pointer shadow-none'
                : 'bg-white text-neutral-400 border border-neutral-200 cursor-not-allowed'
            }`}
          >
            Avanzar a Eliminatorias
          </button>
        </div>
      </div>

      {/* Main Groups Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {groups.map((group) => {
          const standings = calculateGroupStandings(group, pairs);
          const N = group.pairIds.length;
          const matchCombinations: { idx1: number; idx2: number; label: string }[] = [];
          for (let maxIdx = 1; maxIdx < N; maxIdx++) {
            for (let i = 0; i < maxIdx; i++) {
              matchCombinations.push({
                idx1: i,
                idx2: maxIdx,
                label: `${i + 1}vs${maxIdx + 1}`
              });
            }
          }
          
          return (
            <div key={group.id} className="bg-white border-2 border-neutral-950 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-none">
              
              {/* Header Group */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-neutral-950">
                  <h3 className="notranslate text-neutral-950 font-black text-sm flex items-center gap-2 uppercase tracking-wide" translate="no">
                    <span className="w-2.5 h-2.5 bg-neutral-950 rounded-full" />
                    {group.name}
                  </h3>
                  <span className="text-neutral-500 font-mono text-xs font-bold uppercase">{group.pairIds.length} parejas</span>
                </div>

                {/* Standings Table - Simple Grid with gray separators */}
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead>
                      <tr className="text-neutral-400 font-black uppercase tracking-wider border-b border-neutral-200 text-[9px]">
                        <th className="py-2.5 px-2">Posición Parejas</th>
                        {matchCombinations.map((combo) => {
                          const id1 = group.pairIds[combo.idx1];
                          const id2 = group.pairIds[combo.idx2];
                          const match = group.matches.find(m => 
                            (m.teamAId === id1 && m.teamBId === id2) ||
                            (m.teamAId === id2 && m.teamBId === id1)
                          );

                          return (
                            <th key={combo.label} className="py-2 px-1 text-center w-14 pb-1">
                              {match ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectMatch(match)}
                                  className="mx-auto block text-center hover:bg-neutral-100 hover:text-neutral-950 font-black font-mono text-[9px] uppercase tracking-wider py-1 px-1.5 rounded border border-neutral-300 transition bg-neutral-50 cursor-pointer w-full max-w-[56px] truncate"
                                  title={`Registrar resultado de ${combo.label}`}
                                >
                                  {combo.label}
                                </button>
                              ) : (
                                <span className="font-mono text-[9px] text-neutral-400 block py-1">
                                  {combo.label}
                                </span>
                              )}
                            </th>
                          );
                        })}
                        {format !== 'Mini' && (
                          <th className="py-2.5 px-2 text-center w-24">diferencia de SET</th>
                        )}
                        <th className="py-2.5 px-2 text-center w-20">dif. GAMES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {group.pairIds.map((pairId, staticIdx) => {
                        const row = standings.find(s => s.pairId === pairId);
                        if (!row) return null;

                        const standingRank = standings.findIndex(s => s.pairId === pairId) + 1;
                        const isClassifying = standingRank <= 2; // Top 2 classify
                        const setsDiffText = row.setsDiff > 0 ? `+${row.setsDiff}` : String(row.setsDiff);
                        const gamesDiffText = row.gamesDiff > 0 ? `+${row.gamesDiff}` : String(row.gamesDiff);

                        return (
                          <tr 
                            key={row.pairId} 
                            className={`transition hover:bg-neutral-50 ${
                              isClassifying 
                                ? 'text-neutral-950 font-medium'
                                : 'opacity-70 hover:opacity-100 text-neutral-500 hover:bg-neutral-50/40' 
                            }`}
                          >
                            {/* Posición Parejas */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center font-mono text-[9px] font-black shrink-0 ${
                                  standingRank === 1 
                                    ? 'bg-emerald-600 text-white border border-emerald-600' 
                                    : standingRank === 2
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-white text-neutral-400 border border-neutral-200'
                                }`}>
                                  {standingRank}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className={`font-extrabold text-[11px] truncate leading-tight ${
                                    standingRank === 1 
                                      ? 'text-emerald-700' 
                                      : standingRank === 2
                                      ? 'text-amber-700'
                                      : 'text-neutral-950'
                                  }`}>
                                    {row.pair.player1}
                                  </span>
                                  <span className={`text-[10px] truncate leading-tight ${
                                    standingRank === 1 
                                      ? 'text-emerald-600 font-semibold' 
                                      : standingRank === 2
                                      ? 'text-amber-600 font-semibold'
                                      : 'text-neutral-500 font-medium'
                                  }`}>
                                    {row.pair.player2}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Dynamic match cells */}
                            {matchCombinations.map((combo) => (
                              <td key={`${combo.label}-${row.pairId}`} className="py-2.5 px-1 text-center align-middle">
                                {renderMatchResultCell(group, row.pairId, combo.idx1, combo.idx2)}
                              </td>
                            ))}

                            {/* diferencia de SET */}
                            {format !== 'Mini' && (
                              <td className="py-2.5 px-2 text-center align-middle font-mono font-black text-[10.5px] text-neutral-800">
                                {setsDiffText}
                              </td>
                            )}

                            {/* dif. GAMES */}
                            <td className="py-2.5 px-2 text-center align-middle font-mono font-black text-[10.5px] text-neutral-800">
                              {gamesDiffText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
