import React, { useState, useEffect } from 'react';
import { Tournament, CategoryType, TournamentType, MatchMode } from '../types';
import { Save, X, Calendar, MapPin, Award, Users, DollarSign, Clock, FileEdit, Sliders } from 'lucide-react';

interface TournamentFormProps {
  initialTournament?: Tournament | null;
  onSave: (tournament: Omit<Tournament, 'id' | 'createdAt'> & { id?: string }) => void;
  onCancel: () => void;
  fontClass?: string;
  inkColor?: string;
}

export const TournamentForm: React.FC<TournamentFormProps> = ({
  initialTournament,
  onSave,
  onCancel,
  fontClass = 'font-mono',
  inkColor = 'text-black',
}) => {
  const [nombre, setNombre] = useState('');
  const [club, setClub] = useState('');
  const [fecha, setFecha] = useState('');
  const [categoria, setCategoria] = useState<CategoryType>('sexta');
  const [categoriaOtro, setCategoriaOtro] = useState('');
  const [tipo, setTipo] = useState<TournamentType>('masculino');
  const [inscripcionPareja, setInscripcionPareja] = useState<number | ''>('');
  const [modo, setModo] = useState<MatchMode>('largo');
  const [canchas, setCanchas] = useState<number>(2);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTournament) {
      setNombre(initialTournament.nombre);
      setClub(initialTournament.club);
      setFecha(initialTournament.fecha);
      setCategoria(initialTournament.categoria);
      setCategoriaOtro(initialTournament.categoriaOtro || '');
      setTipo(initialTournament.tipo);
      
      const parsedInscripcion = Number(initialTournament.inscripcionPareja);
      setInscripcionPareja(isNaN(parsedInscripcion) ? '' : parsedInscripcion);

      setModo(initialTournament.modo);
      setCanchas(initialTournament.canchas || 2);
    } else {
      setNombre('');
      setClub('');
      setFecha(new Date().toISOString().split('T')[0]);
      setCategoria('sexta');
      setCategoriaOtro('');
      setTipo('masculino');
      setInscripcionPareja('');
      setModo('largo');
      setCanchas(2);
    }
    setErrors({});
  }, [initialTournament]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) newErrors.nombre = 'Falta el nombre del torneo';
    if (!club.trim()) newErrors.club = 'Falta el nombre del club';
    if (!fecha) newErrors.fecha = 'Falta seleccionar la fecha';
    if (inscripcionPareja === '') {
      newErrors.inscripcionPareja = 'Falta la inscripción';
    }
    if (categoria === 'otra' && !categoriaOtro.trim()) {
      newErrors.categoriaOtro = 'Por favor especifica la otra categoría';
    }
    if (!canchas || canchas < 1) {
      newErrors.canchas = 'Debe haber al menos 1 cancha';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: initialTournament?.id,
      nombre: nombre.trim(),
      club: club.trim(),
      fecha,
      categoria,
      categoriaOtro: categoria === 'otra' ? categoriaOtro.trim() : undefined,
      tipo,
      inscripcionPareja: Number(inscripcionPareja) || 0,
      modo,
      canchas: Number(canchas) || 2,
    });
  };

  return (
    <div className={`p-6 bg-white border-4 border-black max-w-2xl mx-auto my-4 relative ${fontClass} ${inkColor} select-none`}>
      {/* Title tag in the corner */}
      <div className="absolute -top-3.5 left-4 bg-black text-white px-3 py-0.5 text-xs uppercase font-black tracking-widest border-2 border-black">
        {initialTournament ? '📌 EDITANDO REGISTRO' : '✏️ NUEVO REGISTRO'}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Nombre */}
        <div>
          <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileEdit size={14} className="stroke-[2.5]" /> Nombre del Torneo:
          </label>
          <input
            type="text"
            className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm focus:bg-gray-50 uppercase font-black"
            placeholder="Ej. Copa Verano Pádel Pro"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          {errors.nombre && <span className="text-red-600 text-xs font-black uppercase block mt-1">*{errors.nombre}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Club */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="stroke-[2.5]" /> Club / Sede:
            </label>
            <input
              type="text"
              className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm focus:bg-gray-50 uppercase font-bold"
              placeholder="Ej. Terrazas Club"
              value={club}
              onChange={(e) => setClub(e.target.value)}
            />
            {errors.club && <span className="text-red-600 text-xs font-black uppercase block mt-1">*{errors.club}</span>}
          </div>

          {/* Fecha */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="stroke-[2.5]" /> Fecha del Torneo:
            </label>
            <input
              type="date"
              className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm focus:bg-gray-50 font-bold"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            {errors.fecha && <span className="text-red-600 text-xs font-black uppercase block mt-1">*{errors.fecha}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categoria */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <Award size={14} className="stroke-[2.5]" /> Categoría:
            </label>
            <select
              className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm focus:bg-gray-50 font-bold uppercase"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoryType)}
            >
              <option value="octava">Octava (8ª)</option>
              <option value="septima">Séptima (7ª)</option>
              <option value="sexta">Sexta (6ª)</option>
              <option value="quinta">Quinta (5ª)</option>
              <option value="cuarta">Cuarta (4ª)</option>
              <option value="tercera">Tercera (3ª)</option>
              <option value="libre">Libre</option>
              <option value="otra">Otra...</option>
            </select>
          </div>

          {/* Tipo / Rama */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users size={14} className="stroke-[2.5]" /> Tipo / Rama:
            </label>
            <div className="flex gap-4 pt-2 font-bold text-xs uppercase">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === 'masculino'}
                  onChange={() => setTipo('masculino')}
                  className="w-4 h-4 accent-black"
                />
                Masculino
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === 'femenino'}
                  onChange={() => setTipo('femenino')}
                  className="w-4 h-4 accent-black"
                />
                Femenino
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === 'mixto'}
                  onChange={() => setTipo('mixto')}
                  className="w-4 h-4 accent-black"
                />
                Mixto
              </label>
            </div>
          </div>
        </div>

        {/* If category is 'otra', show user custom input */}
        {categoria === 'otra' && (
          <div className="bg-stone-50 p-3 border-2 border-black">
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5">
              Especifica la Categoría:
            </label>
            <input
              type="text"
              className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm uppercase font-bold"
              placeholder="Ej. Master Seniors, Seniors B"
              value={categoriaOtro}
              onChange={(e) => setCategoriaOtro(e.target.value)}
            />
            {errors.categoriaOtro && <span className="text-red-600 text-xs font-black uppercase block mt-1">*{errors.categoriaOtro}</span>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Inscripción por pareja */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <DollarSign size={14} className="stroke-[2.5]" /> Inscripción (NÚMEROS):
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm focus:bg-gray-50 uppercase font-bold"
              placeholder="Ej. 15500"
              value={inscripcionPareja}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '');
                setInscripcionPareja(clean === '' ? '' : Number(clean));
              }}
            />
            {inscripcionPareja !== '' ? (
              <span className="block text-[10px] font-black text-green-700 uppercase mt-1">
                ${Number(inscripcionPareja).toLocaleString('es-AR')} ARS
              </span>
            ) : <span className="block text-[10px] opacity-50 mt-1">SÓLO DÍGITOS</span>}
            {errors.inscripcionPareja && <span className="text-red-600 text-xs font-black uppercase block mt-1">*{errors.inscripcionPareja}</span>}
          </div>

          {/* Modo */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="stroke-[2.5]" /> Modo de juego (Sets):
            </label>
            <div className="flex flex-col gap-1.5 pt-1 font-bold text-xs uppercase">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  checked={modo === 'largo'}
                  onChange={() => setModo('largo')}
                  className="w-4 h-4 accent-black"
                />
                Largo (3 sets)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  checked={modo === 'mini'}
                  onChange={() => setModo('mini')}
                  className="w-4 h-4 accent-black"
                />
                Mini (1 set)
              </label>
            </div>
          </div>

          {/* Canchas */}
          <div>
            <label className="block font-black uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sliders size={14} className="stroke-[2.5]" /> Canchas del torneo:
            </label>
            <select
              className="w-full bg-white border-2 border-black outline-none px-3 py-2 text-sm focus:bg-gray-50 font-bold cursor-pointer"
              value={canchas}
              onChange={(e) => setCanchas(Number(e.target.value))}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Cancha' : 'Canchas'}
                </option>
              ))}
            </select>
            <span className="block text-[10px] opacity-50 mt-1">MENÚ DE 1 A 20 CANCHAS</span>
            {errors.canchas && <span className="text-red-600 text-xs font-black uppercase block mt-1">*{errors.canchas}</span>}
          </div>
        </div>

        {/* Buttons matching editorial style list layout */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs uppercase font-black border-2 border-black bg-white hover:bg-black/5 transition-colors cursor-pointer"
          >
            [✖] Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs uppercase font-black border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            [✔] {initialTournament ? 'Guardar Cambios' : 'Registrar Torneo'}
          </button>
        </div>
      </form>
    </div>
  );
};
