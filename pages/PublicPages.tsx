import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Plus, Info, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { ContentItem } from '../types';
import { Button, MovieCard, Sidebar } from '../components/Common';

// --- HOME PAGE ---

export const Home = () => {
  const [featured, setFeatured] = useState<ContentItem | null>(null);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const allMovies = await api.content.getMovies();
      const allSeries = await api.content.getSeries();
      setMovies(allMovies);
      setSeries(allSeries);
      if (allMovies.length > 0) setFeatured(allMovies[0]);
    };
    loadData();
  }, []);

  const handleWatch = (id: string) => navigate(`/player/${id}`);

  return (
    <div className="bg-[#0F172A] min-h-screen text-white pb-20">
      {/* Hero Section */}
      {featured && (
        <div className="relative w-full h-[70vh]">
          <div className="absolute inset-0">
             <img src={featured.posterUrl} alt={featured.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/60 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
            <span className="px-3 py-1 bg-blue-500 text-xs font-bold rounded uppercase tracking-wider mb-4 inline-block">Destaque</span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">{featured.title}</h1>
            <p className="text-gray-300 text-lg mb-6 line-clamp-3">{featured.description}</p>
            <div className="flex items-center gap-4">
              <Button onClick={() => handleWatch(featured.id)} className="px-8 py-3 text-lg">
                <Play fill="currentColor" size={20} /> Assistir Agora
              </Button>
              <Button variant="secondary" className="px-6 py-3 text-lg">
                <Plus size={20} /> Minha Lista
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Carousels */}
      <div className="px-8 md:px-16 -mt-10 relative z-10 space-y-12">
        <Section title="Filmes em Alta" items={movies} onWatch={handleWatch} />
        <Section title="Séries Populares" items={series} onWatch={handleWatch} />
      </div>
    </div>
  );
};

const Section = ({ title, items, onWatch }: { title: string, items: ContentItem[], onWatch: (id: string) => void }) => (
  <div>
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      {title} <ChevronRight className="text-blue-500" />
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map(item => (
        <MovieCard key={item.id} item={item} onClick={() => onWatch(item.id)} />
      ))}
    </div>
  </div>
);


// --- CATALOG PAGE (Movies & Series) ---

export const Catalog = ({ type }: { type: 'movie' | 'series' }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const data = type === 'movie' ? await api.content.getMovies() : await api.content.getSeries();
      setItems(data);
    };
    fetch();
  }, [type]);

  return (
    <div className="bg-[#0F172A] min-h-screen p-8 md:p-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white capitalize">{type === 'movie' ? 'Filmes' : 'Séries'}</h1>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>Nenhum conteúdo encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map(item => (
            <MovieCard key={item.id} item={item} onClick={() => navigate(`/player/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
};


// --- PLAYER PAGE ---

export const Player = () => {
  const { id } = useParams();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const all = await api.content.getAll();
      const found = all.find(i => i.id === id);
      if (found) {
        setContent(found);
        // Simulate ad trigger
        setTimeout(() => setShowAd(true), 2000);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    let interval: any;
    if (showAd && adTimer > 0) {
      interval = setInterval(() => setAdTimer(p => p - 1), 1000);
    } else if (adTimer === 0) {
      setTimeout(() => {
        setShowAd(false);
      }, 500); // Auto close after 0
    }
    return () => clearInterval(interval);
  }, [showAd, adTimer]);

  if (!content) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="bg-black min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-zinc-900/50 absolute top-0 w-full z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="text-white hover:text-blue-500 font-medium">← Voltar</button>
           <h1 className="text-white font-bold text-lg">{content.title}</h1>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="w-full max-w-6xl aspect-video bg-zinc-900 relative rounded-lg overflow-hidden shadow-2xl">
           <video 
             src={content.videoUrl} 
             controls 
             autoPlay 
             className="w-full h-full object-contain" 
           />

           {/* Ad Overlay */}
           {showAd && (
             <div className="absolute bottom-8 right-8 bg-white p-4 rounded-lg shadow-xl z-30 w-80 animate-slide-up border-l-4 border-red-600">
                <div className="flex justify-between items-start mb-2">
                   <span className="bg-red-600 px-2 py-0.5 rounded text-white text-xs font-bold uppercase">Publicidade</span>
                   <span className="text-gray-400 text-xs">00:0{adTimer}</span>
                </div>
                <div className="bg-gray-100 h-32 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                   Banner Publicitário
                </div>
                <p className="text-sm font-semibold text-gray-800">Assine o Premium hoje!</p>
                <p className="text-xs text-gray-500">Ofertas imperdíveis para membros.</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-8 bg-[#0F172A] text-white">
         <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
         <p className="text-gray-400 max-w-3xl">{content.description}</p>
      </div>
    </div>
  );
};
