import { useState, FormEvent } from 'react';
import { Pair } from '../types';
import { ChevronDown, ChevronUp, UserPlus, Copy, Check } from 'lucide-react';

interface PairsListProps {
  pairs: Pair[];
  onAddPair: (player1: string, player2: string) => void;
  onRemovePair: (id: string) => void;
  onReorderPairs: (newPairs: Pair[]) => void;
  onAssignGroup?: (pairId: string, groupLetter: string) => void;
  onUpdateGroups?: () => void;
  costPerPair?: string;
  tournamentName?: string;
  tournamentCategory?: string;
  tournamentType?: string;
}

// Map of customized high-contrast color badges for different group letters to prevent visual monotony
const groupColorMap: Record<string, string> = {
  A: 'bg-sky-500 border-sky-600 text-white hover:bg-sky-600',
  B: 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600',
  C: 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600',
  D: 'bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600',
  E: 'bg-fuchsia-500 border-fuchsia-600 text-white hover:bg-fuchsia-600',
  F: 'bg-rose-500 border-rose-600 text-white hover:bg-rose-600',
  G: 'bg-teal-500 border-teal-600 text-white hover:bg-teal-600',
  H: 'bg-violet-500 border-violet-600 text-white hover:bg-violet-600',
  I: 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600',
  J: 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600',
  K: 'bg-lime-500 border-lime-600 text-slate-900 hover:bg-lime-600',
  L: 'bg-red-500 border-red-600 text-white hover:bg-red-600',
};

export default function PairsList({
  pairs,
  onAddPair,
  onRemovePair,
  onReorderPairs,
  onAssignGroup,
  onUpdateGroups,
  costPerPair = '',
  tournamentName = '',
  tournamentCategory = '',
  tournamentType = '',
}: PairsListProps) {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');

  const [copied, setCopied] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});

  const toggleExpandPair = (id: string) => {
    setExpandedPairs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };


  const handleCopyTournamentInfo = () => {
    const headerLine = `Torneo: ${tournamentName || 'Torneo sin nombre'}\n`;
    
    let typeTranslated = '';
    if (tournamentType === 'CABALLEROS') {
      typeTranslated = 'Caballeros';
    } else if (tournamentType === 'DAMAS') {
      typeTranslated = 'Damas';
    } else if (tournamentType === 'MIXTO') {
      typeTranslated = 'Mixto';
    } else if (tournamentType) {
      typeTranslated = tournamentType;
    }

    const categoryLine = tournamentCategory ? `${tournamentCategory}${typeTranslated ? ` ${typeTranslated}` : ''}\n` : '';
    const pairsLine = `Parejas Inscriptas:\n` + pairs.map((p, idx) => {
      const groupPrefix = p.groupLetter ? `(${p.groupLetter}) ` : '';
      return `${idx + 1}. ${groupPrefix}${p.player1} - ${p.player2}`;
    }).join('\n');
    
    const fullText = `${headerLine}${categoryLine}${pairsLine}`;
    
    navigator.clipboard.writeText(fullText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar: ', err);
      });
  };

  // States for inline editing of pairs
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlayer1, setEditPlayer1] = useState('');
  const [editPlayer2, setEditPlayer2] = useState('');

  // States for inline editing of payment amounts
  const [activePaymentInputId, setActivePaymentInputId] = useState<string | null>(null);
  const [tempPaymentValue, setTempPaymentValue] = useState('');

  const handleStartPaymentEdit = (pairId: string, currentValue: string) => {
    setActivePaymentInputId(pairId);
    setTempPaymentValue(currentValue);
  };

  const handleSavePaymentAmount = (pairId: string) => {
    // Only keep up to 3 digits
    let sanitized = tempPaymentValue.replace(/\D/g, '');
    if (sanitized.length > 3) {
      sanitized = sanitized.slice(0, 3);
    }
    const updated = pairs.map((p) => {
      if (p.id === pairId) {
        return { ...p, paymentAmount: sanitized };
      }
      return p;
    });
    onReorderPairs(updated);
    setActivePaymentInputId(null);
  };

  const handleStartEdit = (id: string, p1: string, p2: string) => {
    setEditingId(id);
    setEditPlayer1(p1);
    setEditPlayer2(p2);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPlayer1('');
    setEditPlayer2('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editPlayer1.trim() || !editPlayer2.trim()) return;
    const updated = pairs.map((p) => {
      if (p.id === id) {
        return { ...p, player1: editPlayer1.trim(), player2: editPlayer2.trim() };
      }
      return p;
    });
    onReorderPairs(updated);
    setEditingId(null);
  };

  const handleConfirmDelete = (id: string) => {
    onRemovePair(id);
    setEditingId(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!player1.trim() || !player2.trim()) return;
    onAddPair(player1.trim(), player2.trim());
    setPlayer1('');
    setPlayer2('');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...pairs];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    onReorderPairs(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === pairs.length - 1) return;
    const reordered = [...pairs];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    onReorderPairs(reordered);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left column: Add/Inscribe Pair Form */}
        <div className={`space-y-4 font-sans ${isListExpanded ? 'hidden lg:hidden' : 'lg:col-span-2'}`}>
          <div className="bg-white border-2 border-neutral-950 p-6 rounded-2xl shadow-none">
            <h3 className="text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b-2 border-neutral-950 pb-2">
              <UserPlus className="w-5 h-5 text-neutral-950" />
              <span>Inscribir Pareja</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-1.5 font-mono">
                  Jugador 1
                </label>
                <input
                  type="text"
                  required
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  placeholder="Ej: Alejandro Galán"
                  className="w-full bg-white border-2 border-neutral-300 text-neutral-950 placeholder-neutral-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-950 transition"
                />
              </div>

              <div>
                <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-1.5 font-mono">
                  Jugador 2
                </label>
                <input
                  type="text"
                  required
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  placeholder="Ej: Juan Lebrón"
                  className="w-full bg-white border-2 border-neutral-300 text-neutral-950 placeholder-neutral-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-950 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-neutral-950 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Registrar Pareja</span>
              </button>
            </form>
          </div>
          
          <div className="bg-white p-5 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 text-xs leading-relaxed space-y-1 shadow-none">
            <p className="font-black text-neutral-950 uppercase">💡 Cómo ordenar la lista:</p>
            <p>Usa las flechas de subir o bajar al lado de cada pareja para reordenar la siembra del torneo.</p>
          </div>
        </div>

        {/* Right column: Registered Pairs List */}
        <div className={`space-y-4 transition-all duration-300 ${isListExpanded ? 'lg:col-span-12 xl:col-span-5 lg:col-span-5' : 'lg:col-span-3'}`}>
          <div className="bg-white border-2 border-neutral-950 p-6 rounded-2xl flex flex-col h-full min-h-[400px] shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b-2 border-neutral-950">
              <div className="flex items-center gap-3">
                <h3 className="text-neutral-950 font-black text-sm uppercase tracking-wider">
                  Parejas Inscriptas ({pairs.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsListExpanded(!isListExpanded)}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-black border-2 border-neutral-950 hover:bg-neutral-100 rounded-lg transition-all cursor-pointer shadow-3xs"
                  title={isListExpanded ? "Reducir listado" : "Desplegar listado a la derecha"}
                >
                  <span>{isListExpanded ? '⟨ CONTRAER' : 'EXPANDIR ⟩'}</span>
                </button>
              </div>
              {pairs.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto text-[10px]">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider animate-pulse mr-1">
                    ℹ️ Toca nombres para no abreviar
                  </span>
                  <span className="bg-neutral-100 text-neutral-900 px-2.5 py-1 rounded border border-neutral-300 font-mono font-black uppercase tracking-wider">
                    Siembra
                  </span>
                </div>
              )}
            </div>

            {pairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center text-neutral-400 mb-4 text-3xl">
                  🎾
                </div>
                <h4 className="text-neutral-450 text-sm font-black uppercase tracking-wider">No hay parejas inscriptas</h4>
                <p className="text-neutral-500 text-xs px-6 mt-1 max-w-sm">
                  Utiliza el formulario de la izquierda para registrar a los jugadores para el torneo.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {pairs.map((pair, index) => {
                  const isEditingThis = editingId === pair.id;
                  const numAmount = Number(pair.paymentAmount) || 0;
                  const numCost = costPerPair ? Number(costPerPair) : 0;
                  const isPaidInFull = numCost > 0 && (numAmount * 1000) >= numCost;

                  return (
                    <div
                      key={pair.id}
                      className={`relative flex items-center gap-2 p-2.5 rounded-xl border transition-all select-none group ${
                        isEditingThis
                          ? 'bg-white border-2 border-neutral-950 shadow-none'
                          : 'bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-950 text-neutral-900'
                      }`}
                    >
                      {/* Number list identifier */}
                      <div className="w-5 h-5 rounded-full bg-neutral-950 text-white text-[10px] font-mono flex items-center justify-center flex-shrink-0 font-black">
                        {index + 1}
                      </div>

                      {/* Small round button to choose group */}
                      <div className="relative flex-shrink-0 notranslate" translate="no">
                        <button
                          type="button"
                          translate="no"
                          className={`w-7 h-7 rounded-md font-sans font-black text-[11px] flex items-center justify-center transition-all border notranslate ${
                            pair.groupLetter
                              ? groupColorMap[pair.groupLetter] || 'bg-neutral-950 text-white border-neutral-950'
                              : 'bg-white hover:bg-neutral-100 text-neutral-500 border-neutral-300'
                          }`}
                          title={pair.groupLetter ? `Grupo ${pair.groupLetter}` : 'Asignar Grupo'}
                        >
                          <span translate="no" className="notranslate">{pair.groupLetter || '-'}</span>
                        </button>
                        <select
                          value={pair.groupLetter || ''}
                          onChange={(e) => onAssignGroup?.(pair.id, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full notranslate"
                          translate="no"
                        >
                          <option value="" translate="no" className="notranslate">--</option>
                          {['A','B','C','D','E','F','G','H','I','J','K','L'].map((letter) => (
                            <option key={letter} value={letter} translate="no" className="notranslate">
                              Grupo {letter}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* White circular button to enter/edit 1-3 digits payment amount */}
                      <div className="relative flex-shrink-0">
                        {(() => {
                          const tempNumAmount = Number(tempPaymentValue) || 0;
                          const isTempPaidInFull = numCost > 0 && (tempNumAmount * 1000) >= numCost;

                          return activePaymentInputId === pair.id ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoFocus
                              maxLength={3}
                              value={tempPaymentValue}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                setTempPaymentValue(val);
                              }}
                              onBlur={() => handleSavePaymentAmount(pair.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSavePaymentAmount(pair.id);
                                } else if (e.key === 'Escape') {
                                  setActivePaymentInputId(null);
                                }
                              }}
                              className={`w-7 h-7 rounded-full text-center focus:outline-none focus:ring-1 text-[10px] font-mono font-bold shadow-3xs p-0 flex items-center justify-center transition-all ${
                                isTempPaidInFull
                                  ? 'bg-emerald-500 text-white border border-emerald-600 focus:ring-emerald-400'
                                  : 'bg-white text-slate-800 border border-lime-500 focus:ring-lime-550'
                              }`}
                              title="Ingresar monto (hasta 3 cifras)"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartPaymentEdit(pair.id, pair.paymentAmount || '')}
                              className={`w-7 h-7 rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all shadow-3xs cursor-pointer ${
                                isPaidInFull
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                              }`}
                              title="Registrar monto (haga clic para editar)"
                            >
                              {pair.paymentAmount || '-'}
                            </button>
                          );
                        })()}
                      </div>

                      {isEditingThis ? (
                        /* INLINE EDIT MODE FORM */
                        <div className="flex-1 min-w-0 py-1 px-1 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-0.5">Jugador 1</label>
                              <input
                                type="text"
                                value={editPlayer1}
                                onChange={(e) => setEditPlayer1(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-lime-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-0.5">Jugador 2</label>
                              <input
                                type="text"
                                value={editPlayer2}
                                onChange={(e) => setEditPlayer2(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-lime-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800 font-extrabold"
                            >
                              Cancelar
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(pair.id)}
                                className="px-2 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-100 font-extrabold rounded-md shadow-2xs"
                              >
                                Borrar Pareja
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(pair.id)}
                                className="px-2.5 py-1 text-[10px] bg-lime-500 hover:bg-lime-450 text-slate-950 font-extrabold rounded-md shadow-2xs"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* PLAIN READ-ONLY DISPLAY */
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Players info ordered for mobile screen */}
                          <div 
                            onClick={() => toggleExpandPair(pair.id)}
                            className="w-full py-0.5 pr-1 select-text cursor-pointer hover:bg-neutral-50 rounded px-1 transition duration-150"
                            title="Haga clic para expandir y ver no abreviado"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center">
                                <p className={`text-xs font-black leading-snug transition-colors ${
                                  expandedPairs[pair.id] ? 'whitespace-normal break-words' : 'truncate'
                                } ${isPaidInFull ? 'text-emerald-700 font-black animate-pulse-once' : 'text-neutral-950'}`}>
                                  {pair.player1}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <p className={`text-xs font-bold leading-snug transition-colors ${
                                  expandedPairs[pair.id] ? 'whitespace-normal break-words' : 'truncate'
                                } ${isPaidInFull ? 'text-emerald-700 font-bold' : 'text-neutral-500'}`}>
                                  {pair.player2}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Controls shown below name only when expanded */}
                          {expandedPairs[pair.id] && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-100 flex-shrink-0 self-start">
                              
                              {/* Up button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveUp(index);
                                }}
                                disabled={index === 0}
                                className={`p-1 rounded border transition-all ${
                                  index === 0 
                                    ? 'text-neutral-200 border-transparent cursor-not-allowed opacity-30'
                                    : 'text-neutral-500 border-neutral-250 hover:text-neutral-950 hover:bg-white'
                                }`}
                                title="Subir de posición"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Down button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDown(index);
                                }}
                                disabled={index === pairs.length - 1}
                                className={`p-1 rounded border transition-all ${
                                  index === pairs.length - 1
                                    ? 'text-neutral-200 border-transparent cursor-not-allowed opacity-40'
                                    : 'text-neutral-500 border-neutral-250 hover:text-neutral-950 hover:bg-white'
                                }`}
                                title="Bajar de posición"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(pair.id, pair.player1, pair.player2);
                                }}
                                className="px-2 py-1 text-[10px] font-black text-neutral-900 bg-white border border-neutral-300 hover:border-neutral-950 hover:bg-neutral-50 rounded transition"
                                title="Editar pareja"
                              >
                                Editar
                              </button>

                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {pairs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col gap-2">
                {onUpdateGroups && (
                  <>
                    <button
                      type="button"
                      onClick={onUpdateGroups}
                      className="w-full bg-white hover:bg-neutral-50 text-neutral-950 border-2 border-neutral-950 font-black py-3 px-4 rounded-xl transition text-xs uppercase tracking-wider cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      🔄 Actualizar Fase de Grupos
                    </button>
                    <p className="text-[10px] text-neutral-400 text-center leading-normal mb-2 font-medium">
                      Actualiza la fase para registrar nuevas parejas o cambios de grupo conservando partidos ya jugados.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCopyTournamentInfo}
                  className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-black py-3.5 px-4 rounded-xl transition text-xs uppercase tracking-widest cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Copiar Info del Torneo</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
