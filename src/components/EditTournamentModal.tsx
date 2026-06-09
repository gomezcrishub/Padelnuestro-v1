import { useState, FormEvent } from 'react';
import { Tournament, TournamentType, GroupMode, TournamentFormat } from '../types';
import { Trophy, Award, Users, Hourglass, X, Trash2, Coins } from 'lucide-react';

interface EditTournamentModalProps {
  tournament: Tournament;
  onClose: () => void;
  onSave: (
    name: string,
    category: string,
    type: TournamentType,
    groupMode: GroupMode,
    format: TournamentFormat,
    costPerPair?: string
  ) => void;
  onDelete?: () => void;
}

const CATEGORIES_PRESETS = [
  'Octava',
  'Séptima',
  'Sexta',
  'Quinta',
  'Cuarta',
  'Tercera',
  'LIBRE',
  'OTRA',
];

export default function EditTournamentModal({
  tournament,
  onClose,
  onSave,
  onDelete,
}: EditTournamentModalProps) {
  const [name, setName] = useState(tournament.name);
  
  // Detect if previous category was a custom one
  const isPreset = CATEGORIES_PRESETS.filter(c => c !== 'OTRA').includes(tournament.category);
  const [selectedPreset, setSelectedPreset] = useState(isPreset ? tournament.category : 'OTRA');
  const [customCategory, setCustomCategory] = useState(isPreset ? '' : tournament.category);

  const [type, setType] = useState<TournamentType>(tournament.type);
  const [groupMode, setGroupMode] = useState<GroupMode>(tournament.groupMode);
  const [format, setFormat] = useState<TournamentFormat>(tournament.format || 'Largo');
  const [costPerPair, setCostPerPair] = useState(tournament.costPerPair || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalCategory = selectedPreset === 'OTRA' ? customCategory.trim() : selectedPreset;
    if (!finalCategory) return;
    onSave(name.trim(), finalCategory, type, groupMode, format, costPerPair.trim());
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-955/65 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl border-2 border-neutral-950 shadow-none overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-neutral-950 bg-neutral-100 p-5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-black text-neutral-950 text-base sm:text-lg uppercase tracking-wide">Editar Detalles del Torneo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-450 hover:text-neutral-950 hover:bg-neutral-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5 font-black" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto pr-2">
          
          {/* Name Input */}
          <div>
            <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 font-mono">
              Nombre del Torneo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-50 border-2 border-neutral-950 text-neutral-950 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition font-medium"
              placeholder="Ej: Copa Master - Primavera"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="block text-neutral-955 text-xs font-black uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5">
              <Award className="w-4 h-4 text-neutral-950" />
              Categoría del Torneo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPreset(cat)}
                  className={`py-2 px-2.5 text-xs font-black rounded-lg border transition ${
                    selectedPreset === cat
                      ? 'bg-neutral-955 border-2 border-neutral-955 text-white font-black shadow-none'
                      : 'bg-white border text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 border-neutral-300 hover:border-neutral-950'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {selectedPreset === 'OTRA' && (
              <div className="mt-2.5 animate-fade-in">
                <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                  Escribe la categoría personalizada:
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ej: Segunda, Iniciados, Senior..."
                  className="w-full bg-neutral-50 border-2 border-neutral-950 text-neutral-950 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition font-medium"
                />
              </div>
            )}
          </div>

          {/* Tipo (CABALLEROS / DAMAS / MIXTO) */}
          <div>
            <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-neutral-950" />
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-1.5 rounded-xl border-2 border-neutral-950">
              <button
                type="button"
                onClick={() => setType('CABALLEROS')}
                className={`py-2 px-2 text-xs font-black rounded-lg uppercase tracking-wide transition ${
                  type === 'CABALLEROS'
                    ? 'bg-neutral-950 border border-neutral-950 text-white font-black'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                CABALLEROS
              </button>
              <button
                type="button"
                onClick={() => setType('DAMAS')}
                className={`py-2 px-2 text-xs font-black rounded-lg uppercase tracking-wide transition ${
                  type === 'DAMAS'
                    ? 'bg-neutral-950 border border-neutral-950 text-white font-black'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                DAMAS
              </button>
              <button
                type="button"
                onClick={() => setType('MIXTO')}
                className={`py-2 px-2 text-xs font-black rounded-lg uppercase tracking-wide transition ${
                  type === 'MIXTO'
                    ? 'bg-neutral-950 border border-neutral-950 text-white font-black'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                MIXTO
              </button>
            </div>
          </div>

          {/* Formato de partidos */}
          <div>
            <label className="block text-neutral-955 text-xs font-black uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Hourglass className="w-4 h-4 text-neutral-950" />
              Formato de Partidos
            </label>
            <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-1.5 rounded-xl border-2 border-neutral-950">
              <button
                type="button"
                onClick={() => setFormat('Largo')}
                className={`py-3 px-4 text-xs font-black rounded-lg transition text-center flex flex-col items-center justify-center ${
                  format === 'Largo'
                    ? 'bg-neutral-955 text-white font-black'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                <span>Largo (3 Sets)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('Mini')}
                className={`py-3 px-4 text-xs font-black rounded-lg transition text-center flex flex-col items-center justify-center ${
                  format === 'Mini'
                    ? 'bg-neutral-955 text-white font-black'
                    : 'text-neutral-500 hover:text-neutral-955'
                }`}
              >
                <span>Mini (1 Set)</span>
              </button>
            </div>
          </div>

          {/* Costo por Pareja */}
          <div>
            <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-neutral-950" />
              Costo por Pareja
            </label>
            <div className="relative rounded-xl shadow-none">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-neutral-950 text-sm font-black">$</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={costPerPair}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setCostPerPair(val);
                }}
                placeholder="Ej: 15000"
                className="w-full bg-neutral-50 border-2 border-neutral-950 text-neutral-950 placeholder-neutral-400 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none transition font-medium"
              />
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-4 border-t-2 border-neutral-950">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Estás seguro de que deseas eliminar el torneo "${tournament.name}"? Se perderán todos sus datos.`)) {
                    onDelete();
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-neutral-500 hover:text-white bg-white hover:bg-neutral-950 border-2 border-neutral-300 hover:border-neutral-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Torneo</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border-2 border-neutral-300 hover:border-neutral-950 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-950 text-xs font-black transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-neutral-955 text-white hover:bg-neutral-800 text-xs font-black transition cursor-pointer uppercase tracking-widest"
              >
                Guardar Cambios
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
