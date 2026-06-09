import { Tournament } from '../types';
import { Award, Edit2, Trash2, Trophy, Users } from 'lucide-react';

interface TournamentHeaderProps {
  tournament: Tournament;
  onDelete: () => void;
  onEdit: () => void;
  activeStage: 'registration' | 'groups' | 'playoffs';
  onSetStage: (stage: 'registration' | 'groups' | 'playoffs') => void;
}

export default function TournamentHeader({
  tournament,
  onDelete,
  onEdit,
  activeStage,
  onSetStage,
}: TournamentHeaderProps) {
  
  return (
    <div className="bg-white border-2 border-neutral-950 rounded-2xl p-6 shadow-none space-y-6">
      
      {/* Primary Row: Name & Badges & Close action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="space-y-2">
          {/* Badges capsule list */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-wider text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-300 uppercase">
              🏆 {tournament.category}
            </span>
            <span className="text-[10px] font-bold font-mono tracking-wider text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-300 uppercase">
              {tournament.type === 'CABALLEROS' ? 'Caballeros' : tournament.type === 'DAMAS' ? 'Damas' : 'Mixto'}
            </span>
          </div>

          {/* Tournament Name */}
          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight leading-tight uppercase">
            {tournament.name}
          </h1>
        </div>

        {/* Action button CTAs Group */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          
          {/* Edit button */}
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-neutral-950 bg-white hover:bg-neutral-950 hover:text-white border-2 border-neutral-950 px-3.5 py-2 rounded-lg transition-colors cursor-pointer font-black uppercase tracking-wide"
            title="Editar torneo actual"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Torneo</span>
          </button>
        </div>

      </div>

      {/* Secondary Row: Step Navigation Wizard Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-xl border border-neutral-300 max-w-lg">
        {/* Registration Tab button */}
        <button
          type="button"
          onClick={() => onSetStage('registration')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeStage === 'registration'
              ? 'bg-neutral-950 text-white shadow-none font-black'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          <span>INSCRIPTOS</span>
        </button>

        {/* Group Stage Tab button */}
        <button
          type="button"
          onClick={() => onSetStage('groups')}
          disabled={tournament.pairs.length === 0}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
            tournament.pairs.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            activeStage === 'groups'
              ? 'bg-neutral-950 text-white shadow-none font-black'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          <span>GRUPOS</span>
        </button>

        {/* Playoff stage button */}
        <button
          type="button"
          onClick={() => onSetStage('playoffs')}
          disabled={tournament.pairs.length === 0}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
            tournament.pairs.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
          } ${
            activeStage === 'playoffs'
              ? 'bg-neutral-950 text-white shadow-none font-black'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          <span>PLAYOFFS</span>
        </button>
      </div>

    </div>
  );
}
