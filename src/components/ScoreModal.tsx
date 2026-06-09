import { Match, Pair } from '../types';
import { useState } from 'react';
import { Minus, Plus, Trophy, X } from 'lucide-react';

interface ScoreModalProps {
  match: Match;
  pairs: Pair[];
  format?: 'Largo' | 'Mini';
  onClose: () => void;
  onSave: (
    set1: { teamA: number; teamB: number },
    set2: { teamA: number; teamB: number },
    set3: { teamA: number; teamB: number },
    winnerId: string | null,
    annulled?: boolean
  ) => void;
}

export default function ScoreModal({ match, pairs, format = 'Largo', onClose, onSave }: ScoreModalProps) {
  const teamA = pairs.find(p => p.id === match.teamAId) || { player1: 'Pareja A', player2: '' };
  const teamB = pairs.find(p => p.id === match.teamBId) || { player1: 'Pareja B', player2: '' };

  const [set1A, setSet1A] = useState(match.set1.teamA);
  const [set1B, setSet1B] = useState(match.set1.teamB);
  const [set2A, setSet2A] = useState(format === 'Mini' ? 0 : match.set2.teamA);
  const [set2B, setSet2B] = useState(format === 'Mini' ? 0 : match.set2.teamB);
  const [set3A, setSet3A] = useState(format === 'Mini' ? 0 : match.set3.teamA);
  const [set3B, setSet3B] = useState(format === 'Mini' ? 0 : match.set3.teamB);

  // Auto determine winner: winner is the one who wins 2 sets (Largo) or 1 set (Mini)
  const determineWinner = (): string | null => {
    if (format === 'Mini') {
      if (set1A > set1B) return match.teamAId;
      if (set1B > set1A) return match.teamBId;
      return null;
    }

    let setsA = 0;
    let setsB = 0;

    // Set 1 Winner
    if (set1A > set1B) setsA++;
    else if (set1B > set1A) setsB++;

    // Set 2 Winner
    if (set2A > set2B) setsA++;
    else if (set2B > set2A) setsB++;

    // Set 3 Winner
    if (set3A > set3B) setsA++;
    else if (set3B > set3A) setsB++;

    if (setsA >= 2) return match.teamAId;
    if (setsB >= 2) return match.teamBId;
    return null;
  };

  const calculatedWinner = determineWinner();

  const handleSave = () => {
    onSave(
      { teamA: set1A, teamB: set1B },
      { teamA: format === 'Mini' ? 0 : set2A, teamB: format === 'Mini' ? 0 : set2B },
      { teamA: format === 'Mini' ? 0 : set3A, teamB: format === 'Mini' ? 0 : set3B },
      calculatedWinner,
      false
    );
  };

  const handleAnnul = () => {
    if (confirm('¿Estás seguro de que deseas anular este partido? No sumará ni restará puntos en las tablas, pero se considerará resuelto para poder continuar.')) {
      onSave(
        { teamA: 0, teamB: 0 },
        { teamA: 0, teamB: 0 },
        { teamA: 0, teamB: 0 },
        null,
        true
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-955/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="score_modal">
      <div className="bg-white border-2 border-neutral-950 rounded-2xl max-w-lg w-full overflow-hidden shadow-none animate-scale-up font-sans" id="score_modal_body">
        
        {/* Header */}
        <div className="bg-neutral-100 px-6 py-4 flex items-center justify-between border-b-2 border-neutral-950">
          <h3 className="text-lg font-black text-neutral-955 uppercase tracking-wide">Registrar Resultado</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-neutral-450 hover:text-neutral-950 transition p-1.5 rounded-lg hover:bg-neutral-200/50 cursor-pointer"
            id="close_modal_btn"
          >
            <X className="w-5 h-5 font-black" />
          </button>
        </div>

        {/* Competitors Summary */}
        <div className="bg-neutral-50 px-6 py-5 flex justify-between items-center text-center gap-4 border-b border-neutral-200">
          <div className="flex-1 min-w-0">
            <p className="text-neutral-950 text-[10px] uppercase tracking-wider font-mono font-black">Pareja A</p>
            <p className="text-neutral-955 font-black text-base mt-1 truncate">{teamA.player1}</p>
            <p className="text-neutral-500 text-xs font-bold truncate">{teamA.player2}</p>
          </div>
          <div className="bg-white text-neutral-950 font-mono text-xs px-2.5 py-1.5 rounded-lg border-2 border-neutral-950 shadow-none font-black">VS</div>
          <div className="flex-1 min-w-0">
            <p className="text-neutral-950 text-[10px] uppercase tracking-wider font-mono font-black">Pareja B</p>
            <p className="text-neutral-955 font-black text-base mt-2 truncate">{teamB.player1}</p>
            <p className="text-neutral-500 text-xs font-bold truncate">{teamB.player2}</p>
          </div>
        </div>

        {/* Match Scores Scorer Container */}
        <div className="px-6 py-6 space-y-5">
                {/* SET 1 */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-neutral-950 text-xs font-mono font-black uppercase tracking-wider">Set 1</span>
              {set1A !== set1B && (
                <span className="text-neutral-950 text-[10px] bg-white px-2.5 py-0.5 rounded border border-neutral-400 font-mono font-black">
                  Ganador: {set1A > set1B ? 'Pareja A' : 'Pareja B'}
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Pair A set 1 controller */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[12px] text-neutral-900 truncate leading-tight">{teamA.player1}</p>
                  {teamA.player2 && <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{teamA.player2}</p>}
                </div>
                <div className="flex items-center gap-2 shrinks-0">
                  <button 
                    type="button"
                    onClick={() => setSet1A(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 text-center text-xl font-mono font-black text-neutral-950 bg-white py-1 rounded-lg border-2 border-neutral-950 shadow-none">
                    {set1A}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSet1A(prev => Math.min(7, prev + 1))}
                    className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pair B set 1 controller */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[12px] text-neutral-900 truncate leading-tight">{teamB.player1}</p>
                  {teamB.player2 && <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{teamB.player2}</p>}
                </div>
                <div className="flex items-center gap-2 shrinks-0">
                  <button 
                    type="button"
                    onClick={() => setSet1B(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 text-center text-xl font-mono font-black text-neutral-955 bg-white py-1 rounded-lg border-2 border-neutral-950 shadow-none">
                    {set1B}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSet1B(prev => Math.min(7, prev + 1))}
                    className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {format === 'Largo' && (
            <>
              {/* SET 2 */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-950 text-xs font-mono font-black uppercase tracking-wider">Set 2</span>
                  {set2A !== set2B && (
                    <span className="text-neutral-950 text-[10px] bg-white px-2.5 py-0.5 rounded border border-neutral-400 font-mono font-black">
                      Ganador: {set2A > set2B ? 'Pareja A' : 'Pareja B'}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Pair A set 2 controller */}
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[12px] text-neutral-900 truncate leading-tight">{teamA.player1}</p>
                      {teamA.player2 && <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{teamA.player2}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrinks-0">
                      <button 
                        type="button"
                        onClick={() => setSet2A(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-12 text-center text-xl font-mono font-black text-neutral-955 bg-white py-1 rounded-lg border-2 border-neutral-950 shadow-none">
                        {set2A}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSet2A(prev => Math.min(7, prev + 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pair B set 2 controller */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[12px] text-neutral-900 truncate leading-tight">{teamB.player1}</p>
                      {teamB.player2 && <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{teamB.player2}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrinks-0">
                      <button 
                        type="button"
                        onClick={() => setSet2B(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-12 text-center text-xl font-mono font-black text-neutral-955 bg-white py-1 rounded-lg border-2 border-neutral-950 shadow-none">
                        {set2B}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSet2B(prev => Math.min(7, prev + 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SET 3 */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-955 text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1">
                    Set 3 <span className="text-[9px] text-neutral-450 capitalize font-mono leading-none">(Super Tiebreak / Desempate)</span>
                  </span>
                  {set3A !== set3B && (
                    <span className="text-neutral-950 text-[10px] bg-white px-2.5 py-0.5 rounded border border-neutral-400 font-mono font-black">
                      Ganador: {set3A > set3B ? 'Pareja A' : 'Pareja B'}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Pair A set 3 controller */}
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[12px] text-neutral-900 truncate leading-tight">{teamA.player1}</p>
                      {teamA.player2 && <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{teamA.player2}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrinks-0">
                      <button 
                        type="button"
                        onClick={() => setSet3A(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-12 text-center text-xl font-mono font-black text-neutral-955 bg-white py-1 rounded-lg border-2 border-neutral-950 shadow-none">
                        {set3A}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSet3A(prev => Math.min(20, prev + 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pair B set 3 controller */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[12px] text-neutral-900 truncate leading-tight">{teamB.player1}</p>
                      {teamB.player2 && <p className="text-[10px] text-neutral-500 truncate leading-none mt-0.5">{teamB.player2}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrinks-0">
                      <button 
                        type="button"
                        onClick={() => setSet3B(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-12 text-center text-xl font-mono font-black text-neutral-955 bg-white py-1 rounded-lg border-2 border-neutral-950 shadow-none">
                        {set3B}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSet3B(prev => Math.min(20, prev + 1))}
                        className="w-8 h-8 rounded-full bg-white border-2 border-neutral-950 text-neutral-950 hover:bg-neutral-50 flex items-center justify-center transition cursor-pointer font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Winner banner announcement */}
          <div className="flex flex-col gap-2 p-3.5 bg-neutral-100 rounded-xl border-2 border-neutral-950 text-center shadow-none">
            {match.annulled && (
              <div className="text-neutral-900 font-extrabold text-xs bg-white border border-neutral-350 py-1.5 px-3 rounded-lg mb-1 animate-pulse">
                ⚠️ Este partido se encuentra ANULADO actualmente. Puedes cambiar los scores y presionar "Guardar" para rehabilitarlo.
              </div>
            )}
            {calculatedWinner ? (
              <div className="flex items-center justify-center gap-2 text-neutral-950 font-black text-sm uppercase tracking-wide">
                <Trophy className="w-4 h-4 text-neutral-950 fill-current animate-pulse" />
                <span>
                  Ganador: {calculatedWinner === match.teamAId ? `${teamA.player1}` : `${teamB.player1}`}
                </span>
              </div>
            ) : (
              <span className="text-neutral-500 text-xs font-bold font-mono uppercase tracking-tight">
                {format === 'Mini'
                  ? 'El ganador se determinará al registrar diferencia de games.'
                  : 'El ganador se determinará al ganar 2 sets.'}
              </span>
            )}
          </div>

        </div>

        {/* Action buttons footer */}
        <div className="bg-neutral-100 px-6 py-4 flex items-center justify-between border-t-2 border-neutral-950">
          <div>
            <button
              type="button"
              onClick={handleAnnul}
              className="px-3 py-2 text-xs font-black text-neutral-500 hover:text-white bg-white hover:bg-neutral-950 border-2 border-neutral-300 hover:border-neutral-950 rounded-xl transition cursor-pointer uppercase tracking-wider"
            >
              Anular Partido
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black text-neutral-500 hover:text-neutral-950 bg-white border-2 border-neutral-300 hover:border-neutral-950 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={calculatedWinner === null && (set1A !== 0 || set1B !== 0)} 
              className="px-5 py-2.5 text-xs font-black text-white bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 rounded-xl transition cursor-pointer uppercase tracking-widest"
            >
              Guardar Resultado
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
