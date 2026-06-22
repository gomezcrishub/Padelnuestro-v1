import { useState, useEffect } from 'react';
import { Tournament, ThemeType, ActiveTabType } from './types';
import { INITIAL_TOURNAMENTS, THEMES } from './data';
import { TournamentForm } from './components/TournamentForm';
import { TournamentCard } from './components/TournamentCard';
import { TabsSection } from './components/TabsSection';

export default function App() {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('padel_tournaments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TOURNAMENTS;
      }
    }
    return INITIAL_TOURNAMENTS;
  });

  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('padel_theme');
    return (saved as ThemeType) || 'lined';
  });

  const [activeTab, setActiveTab] = useState<ActiveTabType>('jugadores');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(() => {
    const saved = localStorage.getItem('padel_selected_tournament_id');
    if (saved) return saved;
    const initialSavedTournaments = localStorage.getItem('padel_tournaments');
    if (initialSavedTournaments) {
      try {
        const parsed = JSON.parse(initialSavedTournaments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch {}
    }
    return INITIAL_TOURNAMENTS[0]?.id || null;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    localStorage.setItem('padel_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem('padel_theme', selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    if (selectedTournamentId) {
      localStorage.setItem('padel_selected_tournament_id', selectedTournamentId);
    } else {
      localStorage.removeItem('padel_selected_tournament_id');
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    if (tournaments.length > 0) {
      const activeExists = tournaments.some(t => t.id === selectedTournamentId);
      if (!activeExists) {
        setSelectedTournamentId(tournaments[0].id);
      }
    } else {
      setSelectedTournamentId(null);
    }
  }, [tournaments, selectedTournamentId]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const activeThemeConfig = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  const handleCreateOrUpdateTournament = (formData: Omit<Tournament, 'id' | 'createdAt'> & { id?: string }) => {
    if (formData.id) {
      setTournaments(prev => prev.map(item => {
        if (item.id === formData.id) {
          return {
            ...item,
            ...formData,
            id: item.id,
            createdAt: item.createdAt,
          };
        }
        return item;
      }));
      showFeedback('Torneo actualizado con éxito ✔️', 'success');
    } else {
      const newTournament: Tournament = {
        ...formData,
        id: 'torneo-' + Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
      };
      setTournaments(prev => [newTournament, ...prev]);
      showFeedback('¡Nuevo torneo registrado en el sistema oficial! 🎾', 'success');
    }
    setIsFormOpen(false);
    setEditingTournament(null);
  };

  const handleEditClick = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsFormOpen(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    const tournamentToDelete = tournaments.find(t => t.id === id);
    if (!tournamentToDelete) return;

    setTournaments(prev => prev.filter(item => item.id !== id));
    showFeedback(`Torneo de ${tournamentToDelete.nombre.toUpperCase()} removido correctamente de la Base de Datos.`, 'info');
  };

  const showFeedback = (message: string, type: 'success' | 'info' | 'error') => {
    setFeedback({ message, type });
  };

  const handleAddNewClick = () => {
    setEditingTournament(null);
    setIsFormOpen(true);
  };

  const resetAllTournaments = () => {
    setTournaments(INITIAL_TOURNAMENTS);
    showFeedback('Torneos de prueba restaurados exitosamente.', 'info');
  };

  return (
    <div className={`min-h-screen ${activeThemeConfig.bgClass} theme-transition py-12 px-4 sm:px-8 text-black selection:bg-black selection:text-white`}>
      <div className="max-w-6xl mx-auto">
        
        {/* EDITORIAL HEADER ROW WITH DOUBLE BARS & BRAND STATEMENTS */}
        <header className="flex flex-col sm:flex-row justify-between items-end border-b-4 border-black pb-8 mb-8 relative font-mono select-none">
          
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-[0.35em] uppercase mb-1.5 flex items-center gap-1.5 opacity-80">
              ⚡ plataforma de gestion gratuita
            </span>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
              TORNEOS DE PADEL
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-3 opacity-60">
              sistema de planificacion -version 2.3
            </p>
          </div>

          {/* Elegant Circular Theme Variant Switches */}
          <div className="mt-6 sm:mt-0 flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
              Estilo Gráfico:
            </span>
            <div className="flex items-center gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  title={theme.name}
                  className={`w-7 h-7 rounded-none border-2 border-black cursor-pointer transition-all duration-150 flex items-center justify-center font-black text-xs ${
                    theme.id === 'lined' ? 'bg-white text-black' :
                    theme.id === 'yellow' ? 'bg-amber-100 text-yellow-950' :
                    theme.id === 'grid' ? 'bg-stone-100 text-gray-800' :
                    'bg-[#e5dacb] text-[#332211]'
                  } ${selectedTheme === theme.id ? 'ring-2 ring-black ring-offset-2 scale-110 bg-black text-white' : 'hover:scale-105 bg-white'}`}
                >
                  {theme.id === 'lined' ? 'O' : theme.id === 'yellow' ? 'Y' : theme.id === 'grid' ? 'G' : 'K'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* FEEDBACK & FEED SYSTEM */}
        {feedback && (
          <div className="my-5 p-4 border-4 border-black bg-white flex items-center justify-between font-mono animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">📢</span>
              <p className="text-xs font-black uppercase tracking-wide">{feedback.message}</p>
            </div>
            <button 
              onClick={() => setFeedback(null)} 
              className="text-[10px] font-black uppercase border-b-2 border-black hover:bg-black hover:text-white transition-colors px-1"
            >
              CERRAR
            </button>
          </div>
        )}

        {/* HERO WIDE CREATION BTN */}
        <section className="mb-8 font-mono">
          <button 
            onClick={handleAddNewClick}
            className="w-full py-4 border-4 border-black font-black text-base sm:text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 bg-[#ffeb2a] hover:bg-[#ffe31a] text-black"
          >
            + CREAR TORNEO
          </button>
        </section>

        {/* COMPACT REGISTRATION FORM POPUP */}
        {isFormOpen && (
          <section className="mb-10 animate-fade-in">
            <div className="flex items-center justify-between max-w-2xl mx-auto px-1 mb-2 font-mono">
              <span className="text-xs font-black uppercase tracking-widest">📝 RELLENAR EXPEDIENTE</span>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingTournament(null);
                }}
                className="text-xs font-black uppercase hover:underline cursor-pointer"
              >
                Cerrar [X]
              </button>
            </div>
            <TournamentForm
              initialTournament={editingTournament}
              onSave={handleCreateOrUpdateTournament}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTournament(null);
              }}
              fontClass={activeThemeConfig.fontClass}
              inkColor={activeThemeConfig.inkColor}
            />
          </section>
        )}

        {/* TOURNAMENT INSTANCE SHEET */}
        <section className="bg-white border-4 border-black overflow-hidden font-mono mb-6">
          
          {/* Header row from Design HTML (visible on md+) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b-4 border-black text-[10px] font-black uppercase tracking-widest bg-stone-100/90 select-none">
            <div className="col-span-3">Nombramiento / Club</div>
            <div className="col-span-2">Fecha Oficial</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-2">Tipo / Formato</div>
            <div className="col-span-2 text-right">Monto Inscripción</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {/* List or Empty State */}
          {tournaments.length > 0 ? (
            <div className="divide-y-2 divide-black">
              {tournaments.map(tournament => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isSelected={tournament.id === selectedTournamentId}
                  onSelect={() => setSelectedTournamentId(tournament.id)}
                  fontClass={activeThemeConfig.fontClass}
                  inkColor={activeThemeConfig.inkColor}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-stone-50 select-none px-6">
              <span className="text-4xl block mb-2">📒</span>
              <p className="text-sm font-black uppercase tracking-widest">EXPEDIENTES EN BLANCO</p>
              <p className="text-xs opacity-70 mt-1 max-w-md mx-auto">
                No hay ingresos. Añade un nuevo registro de torneo o restablece la base de datos predeterminada abajo.
              </p>
            </div>
          )}
        </section>

        {/* REQUIRED TABS SECTION FOR JUGADORES, GRUPOS, PLAYOFFS */}
        <TabsSection
          key={selectedTournamentId || 'no-torneo'}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedTournamentId={selectedTournamentId}
          selectedTournament={selectedTournament}
          fontClass={activeThemeConfig.fontClass}
          inkColor={activeThemeConfig.inkColor}
        />

        {/* SMALL DECORATIVE FOOTER */}
        <footer className="flex flex-col sm:flex-row justify-between mt-8 text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.35em] opacity-50 font-mono select-none gap-2">
          <span>plataforma libre de gestion de torneos</span>
          <button 
            onClick={resetAllTournaments}
            className="hover:underline cursor-pointer font-black text-left sm:text-right"
          >
            [ RESTAURAR DEMO ]
          </button>
        </footer>

      </div>
    </div>
  );
}
