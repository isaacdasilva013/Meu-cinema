
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Plus, ChevronRight, Loader2, Star, Info, Volume2, Search } from 'lucide-react';
import { api } from '../services/api';
import { ContentItem, Episode } from '../types';
import { Button, MovieCard } from '../components/Common';

export const Home = () => {
  const [featured, setFeatured] = useState<ContentItem | null>(null);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log("Iniciando carregamento da Home...");
        const allContent = await api.content.getAll();
        
        if (allContent.length > 0) {
          const m = allContent.filter(i => i.type === 'movie');
          const s = allContent.filter(i => i.type === 'series');
          setMovies(m);
          setSeries(s);
          setFeatured(allContent[0]);
          console.log("Conteúdo carregado com sucesso:", allContent.length, "itens.");
        } else {
          console.warn("Nenhum conteúdo retornado da API ou Banco.");
        }
      } catch (error) {
        console.error("Erro fatal ao carregar Home:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-blue-500">
        <Loader2 className="w-16 h-16 animate-spin mb-6" />
        <h2 className="text-xl font-black uppercase tracking-[0.3em] animate-pulse">Meu Cinema</h2>
        <p className="text-gray-500 mt-2 text-sm font-medium">Conectando ao catálogo mundial...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] min-h-screen text-white pb-32 overflow-x-hidden">
      {/* Hero Section Premium */}
      {featured ? (
        <div className="relative w-full h-[85vh] flex items-center">
          <div className="absolute inset-0">
            <img 
              src={featured.backdropUrl} 
              className="w-full h-full object-cover brightness-[0.4] animate-fade-in" 
              alt={featured.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 px-8 md:px-20 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter">Top 10 Mundial</span>
              <span className="text-sm font-bold text-gray-400">{featured.year} • {featured.genre}</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none uppercase italic">
              {featured.title}
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl mb-10 line-clamp-3 max-w-2xl font-medium leading-relaxed">
              {featured.description}
            </p>

            <div className="flex items-center gap-5">
              <Button onClick={() => navigate(`/player/${featured.id}`)} className="px-12 py-5 text-xl rounded-2xl hover:bg-white hover:text-black transition-all">
                <Play fill="currentColor" size={24} /> Assistir
              </Button>
              <Button variant="secondary" className="px-10 py-5 text-xl rounded-2xl border-white/20 bg-white/5 backdrop-blur-md">
                <Info size={24} /> Detalhes
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[50vh] flex items-center justify-center text-gray-500 font-black uppercase tracking-widest">
           Infelizmente o catálogo não pôde ser carregado. Verifique sua chave API.
        </div>
      )}

      {/* Listagens com Grid Moderno */}
      <div className="px-8 md:px-20 -mt-20 relative z-20 space-y-24">
        {movies.length > 0 && <MovieRow title="Filmes Recomendados" items={movies} onWatch={(id) => navigate(`/player/${id}`)} />}
        {series.length > 0 && <MovieRow title="Séries em Destaque" items={series} onWatch={(id) => navigate(`/player/${id}`)} />}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const MovieRow = ({ title, items, onWatch }: { title: string, items: ContentItem[], onWatch: (id: string) => void }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-8 border-l-4 border-blue-600 pl-4">
      <h2 className="text-3xl font-black tracking-tighter uppercase italic">
        {title}
      </h2>
      <button className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">Explorar Tudo</button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
      {items.map(item => (
        <MovieCard key={item.id} item={item} onClick={() => onWatch(item.id)} />
      ))}
    </div>
  </div>
);

export const Catalog = ({ type }: { type: 'movie' | 'series' }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const data = type === 'movie' ? await api.content.getMovies() : await api.content.getSeries();
      setItems(data.length > 0 ? data : (await api.content.fetchFromWatchmode()).filter(i => i.type === type));
    };
    fetch();
  }, [type]);

  return (
    <div className="bg-[#0F172A] min-h-screen p-8 md:p-20">
      <h1 className="text-5xl font-black text-white mb-16 border-l-8 border-blue-600 pl-6 uppercase italic tracking-tighter">
        {type === 'movie' ? 'Cinemateca' : 'Séries Originais'}
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {items.map(item => (
          <MovieCard key={item.id} item={item} onClick={() => navigate(`/player/${item.id}`)} />
        ))}
      </div>
    </div>
  );
};

export const Player = () => {
  const { id } = useParams();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentVideo, setCurrentVideo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const all = await api.content.getAll();
      const found = all.find(i => i.id === id);
      if (found) {
        setItem(found);
        if (found.type === 'series') {
          const eps = await api.content.getEpisodes(found.id);
          setEpisodes(eps);
          if (eps.length > 0) setCurrentVideo(eps[0].videoUrl);
        } else {
          setCurrentVideo(found.videoUrl || '');
        }
      }
      setIsLoading(false);
    };
    load();
  }, [id]);

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="h-screen bg-black relative flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-50 bg-gradient-to-b from-black to-transparent">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white font-black uppercase text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all">
          <ChevronRight className="rotate-180" /> Fechar Player
        </button>
        {item && <h1 className="text-white font-black uppercase tracking-widest text-lg drop-shadow-lg">{item.title}</h1>}
        <div className="w-20" />
      </div>

      <div className="flex-1 bg-black flex items-center justify-center">
        {currentVideo ? (
          <video 
            src={currentVideo} 
            controls 
            autoPlay 
            className="w-full h-full max-h-screen object-contain"
          />
        ) : (
          <div className="text-gray-500 font-black uppercase text-center p-10 border-2 border-dashed border-gray-800 rounded-3xl">
            <Info className="mx-auto mb-4 text-blue-600" size={64} />
            <p>O sinal deste vídeo está indisponível no momento.</p>
          </div>
        )}
      </div>

      {item?.type === 'series' && episodes.length > 0 && (
        <div className="bg-[#0F172A] p-8 h-48 border-t border-white/5">
          <h3 className="text-blue-500 font-black uppercase text-xs tracking-[0.3em] mb-4">Escolher Episódio</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {episodes.map(ep => (
              <button 
                key={ep.id} 
                onClick={() => setCurrentVideo(ep.videoUrl)}
                className={`flex-shrink-0 px-8 py-5 rounded-2xl font-black transition-all ${
                  currentVideo === ep.videoUrl 
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 scale-105' 
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                S{ep.season} E{ep.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
