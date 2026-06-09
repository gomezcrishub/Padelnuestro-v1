import { useState, FormEvent } from 'react';
import { PadelCategory, TournamentType, GroupMode, TournamentFormat } from '../types';
import { Trophy, Award, Users, Hourglass, Coins } from 'lucide-react';

interface CreateTournamentFormProps {
  onCreate: (
    name: string,
    category: PadelCategory,
    type: TournamentType,
    groupMode: GroupMode,
    format: TournamentFormat,
    costPerPair?: string
  ) => void;
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

export default function CreateTournamentForm({ onCreate }: CreateTournamentFormProps) {
  const [name, setName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('Sexta');
  const [customCategory, setCustomCategory] = useState('');
  const [type, setType] = useState<TournamentType>('CABALLEROS');
  const [groupMode, setGroupMode] = useState<GroupMode>('4 parejas');
  const [format, setFormat] = useState<TournamentFormat>('Largo');
  const [costPerPair, setCostPerPair] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalCategory = selectedPreset === 'OTRA' ? customCategory.trim() : selectedPreset;
    if (!finalCategory) return;
    onCreate(name.trim(), finalCategory, type, groupMode, format, costPerPair.trim());
  };

  return (
    <div className="max-w-xl mx-auto bg-white border-2 border-neutral-950 p-6 sm:p-8 rounded-3xl shadow-none animate-scale-up" id="create_tournament_card">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-neutral-950 flex items-center justify-center text-3xl mx-auto text-neutral-950 font-black mb-4">
          🎾
        </div>
        <h2 className="text-2xl font-black text-neutral-950 font-sans tracking-tight uppercase">Crear Nuevo Torneo</h2>
        <p className="text-neutral-500 text-xs font-bold max-w-sm mx-auto uppercase tracking-tight">
          Configura los detalles iniciales de tu torneo de pádel para comenzar a registrar jugadores.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name Input */}
        <div>
          <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 font-mono">
            Nombre del Torneo
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Open de Otoño - Complejo Padel"
            className="w-full bg-neutral-50 border-2 border-neutral-950 text-neutral-955 placeholder-neutral-400 rounded-xl px-4 py-3 text-sm focus:outline-none transition font-medium"
          />
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <Award className="w-4 h-4 text-neutral-950" />
            Categoría del Torneo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES_PRESETS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedPreset(cat)}
                className={`py-2 px-3 text-xs font-black rounded-lg border transition ${
                  selectedPreset === cat
                    ? 'bg-neutral-955 border-2 border-neutral-955 text-white shadow-none font-black'
                    : 'bg-white border text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 border-neutral-300 hover:border-neutral-950'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {selectedPreset === 'OTRA' && (
            <div className="mt-3 animate-fade-in">
              <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
                Escribe la categoría personalizada:
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ej: Segunda, Iniciados, Súper 50..."
                className="w-full bg-neutral-50 border-2 border-neutral-950 text-neutral-950 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition font-medium"
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
          <div className="grid grid-cols-3 gap-2 bg-neutral-100 p-1.5 rounded-xl border-2 border-neutral-950">
            <button
              type="button"
              onClick={() => setType('CABALLEROS')}
              className={`py-2 px-2 text-xs font-black rounded-lg uppercase tracking-wide transition ${
                type === 'CABALLEROS'
                  ? 'bg-neutral-950 border border-neutral-950 text-white font-black shadow-none'
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
                  ? 'bg-neutral-950 border border-neutral-950 text-white font-black shadow-none'
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
                  ? 'bg-neutral-950 border border-neutral-950 text-white font-black shadow-none'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              MIXTO
            </button>
          </div>
        </div>

        {/* Formato de partidos */}
        <div>
          <label className="block text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <Hourglass className="w-4 h-4 text-neutral-950" />
            Formato de Partidos
          </label>
          <div className="grid grid-cols-2 gap-3 bg-neutral-150 p-1.5 rounded-xl border-2 border-neutral-950">
            <button
              type="button"
              onClick={() => setFormat('Largo')}
              className={`py-2 px-4 text-xs font-black rounded-lg transition text-center flex flex-col items-center justify-center ${
                format === 'Largo'
                  ? 'bg-neutral-955 text-white font-black shadow-none border border-neutral-955'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              <span>Largo (3 Sets)</span>
              <span className="text-[9px] font-normal opacity-70">Mejor de 3 sets (Super Tiebreak)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('Mini')}
              className={`py-2 px-4 text-xs font-black rounded-lg transition text-center flex flex-col items-center justify-center ${
                format === 'Mini'
                  ? 'bg-neutral-955 text-white font-black shadow-none border border-neutral-955'
                  : 'text-neutral-500 hover:text-neutral-955'
              }`}
            >
              <span>Mini (1 Set)</span>
              <span className="text-[9px] font-normal opacity-70">A un solo set directo</span>
            </button>
          </div>
        </div>

        {/* Costo por Pareja */}
        <div>
          <label className="block text-neutral-955 text-xs font-black uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
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
              className="w-full bg-neutral-50 border-2 border-neutral-950 text-neutral-950 placeholder-neutral-400 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none transition font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-black py-3.5 px-4 rounded-xl text-sm transition tracking-widest mt-2 active:scale-95 cursor-pointer text-center uppercase"
        >
          INICIAR TORNEO 🚀
        </button>

      </form>
    </div>
  );
}
