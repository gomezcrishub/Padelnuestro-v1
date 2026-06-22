import React from 'react';
import { Tournament } from '../types';
import { CATEGORIES_LABELS, TYPE_LABELS } from '../data';
import { Edit3, Trash2, Calendar, MapPin, Award, Layers, CreditCard, ShieldAlert } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  fontClass?: string;
  inkColor?: string;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  fontClass = 'font-mono',
  inkColor = 'text-black',
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  React.useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  const currentCategoryLabel = 
    tournament.categoria === 'otra' && tournament.categoriaOtro
      ? tournament.categoriaOtro.toUpperCase()
      : (CATEGORIES_LABELS[tournament.categoria] || tournament.categoria).toUpperCase();

  const formattedDate = () => {
    try {
      const d = new Date(tournament.fecha + 'T00:00:00');
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    } catch {
      return tournament.fecha;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirming) {
      onDelete(tournament.id);
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  return (
    <div>
      {/* Ultra Compact Editorial Row: Large screen version */}
      <div 
        onClick={onSelect}
        className={`hidden md:grid grid-cols-12 gap-3 px-4 py-2 border-b-2 border-black transition-all duration-200 items-center cursor-pointer ${
          isSelected 
            ? 'bg-emerald-50 hover:bg-emerald-100/85 border-l-[8px] border-l-emerald-600' 
            : 'hover:bg-black/5 border-l-[8px] border-l-transparent'
        } ${fontClass} ${inkColor}`}
      >
        {/* Nombre / Club */}
        <div className="col-span-3">
          <div className="text-sm font-black uppercase tracking-tight truncate max-w-[210px]" title={tournament.nombre}>
            {isSelected && <span className="inline-block w-2.5 h-2.5 bg-emerald-600 rounded-full mr-1.5 animate-pulse shrink-0" title="Torneo Activo" />}
            {tournament.nombre}
          </div>
          <div className="text-[10px] italic opacity-80 flex items-center gap-1 mt-0.5">
            <MapPin size={10} /> {tournament.club}
          </div>
        </div>

        {/* Fecha */}
        <div className="col-span-2 text-xs font-bold">
          <span className="flex items-center gap-1">
            <Calendar size={11} className="opacity-70" /> {formattedDate()}
          </span>
        </div>

        {/* Categoría */}
        <div className="col-span-2">
          <span className={`border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider block text-center max-w-[110px] truncate transition-colors duration-150 ${
            isSelected 
              ? 'bg-emerald-600 border-emerald-700 text-white' 
              : 'border-black bg-white text-black'
          }`}>
            {currentCategoryLabel.replace(/\(.*\)/g, '')}
          </span>
        </div>

        {/* Tipo / Modo */}
        <div className="col-span-2 text-[10px] uppercase font-mono tracking-tight leading-none">
          <div className="font-bold">
            ⚔️ {TYPE_LABELS[tournament.tipo]?.split(' ')[0] || tournament.tipo}
          </div>
          <div className="underline decoration-dashed mt-0.5 font-bold">
            {tournament.modo === 'largo' ? '3 SETS 🏆' : '1 SET ⚡'}
          </div>
        </div>

        {/* Inscripción formatted as ARS */}
        <div className="col-span-2 text-right font-black text-sm underline tracking-tight">
          ${Number(tournament.inscripcionPareja || 0).toLocaleString('es-AR')} ARS
        </div>

        {/* Actions - Horizontal row for height reduction */}
        <div className="col-span-1 flex gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tournament);
            }}
            className="text-[9px] uppercase font-black tracking-wider border border-black bg-white select-none px-1 py-0.5 hover:bg-black hover:text-white transition-colors cursor-pointer text-center"
            title="Editar"
          >
            EDIT
          </button>
          <button
            onClick={handleDeleteClick}
            className={`text-[9px] uppercase font-black tracking-wider border select-none px-1.5 py-0.5 transition-colors cursor-pointer text-center ${
              isConfirming 
                ? 'border-red-600 bg-red-600 text-white animate-pulse' 
                : 'border-black bg-white text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600'
            }`}
            title={isConfirming ? "Hacer click otra vez para confirmar borrado" : "Borrar torneo"}
          >
            {isConfirming ? '¿REMOVER?' : 'DEL'}
          </button>
        </div>
      </div>

      {/* Ultra Compact Responsive Mobile Stack */}
      <div 
        onClick={onSelect}
        className={`md:hidden p-2.5 border-b-2 border-black transition-all duration-200 cursor-pointer ${
          isSelected 
            ? 'bg-emerald-50 border-l-[8px] border-l-emerald-600' 
            : 'hover:bg-black/5 border-l-[8px] border-l-transparent'
        } ${fontClass} ${inkColor} space-y-2`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight flex items-center">
              {isSelected && <span className="inline-block w-2.5 h-2.5 bg-emerald-600 rounded-full mr-1.5 animate-pulse shrink-0" title="Torneo Activo" />}
              {tournament.nombre}
            </h3>
            <span className="text-[10px] italic opacity-80 block mt-0.5">📍 En {tournament.club}</span>
          </div>
          <span className="text-xs font-black text-red-800 underline shrink-0 mt-0.5">
            ${Number(tournament.inscripcionPareja || 0).toLocaleString('es-AR')} ARS
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono opacity-90 items-center">
          <span className="font-bold">📅 {formattedDate()}</span>
          <span className="opacity-50">|</span>
          <span className={`font-bold border px-1 py-px transition-colors duration-150 ${
            isSelected ? 'bg-emerald-600 border-emerald-700 text-white' : 'border-black/30 bg-white text-black'
          }`}>{currentCategoryLabel}</span>
          <span className="opacity-50">|</span>
          <span className="font-bold uppercase">{TYPE_LABELS[tournament.tipo]} ({tournament.modo === 'largo' ? 'Largo' : 'Mini'})</span>
        </div>

        <div className="flex gap-2 pt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tournament);
            }}
            className="flex-1 text-[10px] uppercase font-black border border-black bg-white py-1 hover:bg-black hover:text-white transition-colors cursor-pointer text-center"
          >
            Editar
          </button>
          <button
            onClick={handleDeleteClick}
            className={`flex-1 text-[10px] uppercase font-black border py-1 transition-colors cursor-pointer text-center ${
              isConfirming 
                ? 'border-red-600 bg-red-600 text-white animate-pulse' 
                : 'border-black bg-white text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600'
            }`}
          >
            {isConfirming ? 'CONFIRMA ELIMINAR' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
