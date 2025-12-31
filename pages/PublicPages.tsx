
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Play, Plus, ChevronRight, Loader2, Star, Info, Volume2, Search, ArrowDown, User as UserIcon, Calendar, Film, Trophy, Radio, Signal, RefreshCw, ExternalLink, ShieldAlert, WifiOff, Filter, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { ContentItem, Episode } from '../types';
import { Button, MovieCard, Input } from '../components/Common';

// --- HOME PAGE ---
export const Home = () => {
  const [featured, setFeatured] = useState<ContentItem | null>(null);
  const [rows, setRows] = useState<{title: string, items: ContentItem[]}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadHome = async () => {
      try {
        const [trendingMovies, trendingSeries, liveChannels] = await Promise.all([
            api.tmdb.getTrending('movie', 'week'),
            api.tmdb.getTrending('tv', 'week'),
            api.live.getChannels()
        ]);

        if (mounted) {
            if (trendingMovies.length > 0) setFeatured(trendingMovies[0]);
            setRows([
                { title: "Filmes em Alta", items: trendingMovies },
                ...(liveChannels.length > 0 ? [{ title: "Canais Recomendados", items: liveChannels.slice(0, 10) }] : []),
                { title: "Séries do Momento", items: trendingSeries },
            ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadHome();
    return () => { mounted = false; };
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="bg-[#0F172A] min-h-screen text-white overflow-x-hidden">
      {featured && (
        <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center">
           <div className="absolute inset-0">
             <img src={featured.backdropUrl} className="w-full h-full object-cover brightness-[0.4]" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/20 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/40 to-transparent" />
           </div>
           <div className="relative z-10 px-8 md:px-16 max-w-4xl mt-10">
              <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded mb-4 inline-block shadow-lg shadow-red-600/40">Destaque</span>
              <h1 className="text-4xl md:text-7xl font-black mb-6 leading-[0.9] tracking-tighter uppercase italic">{featured.title}</h1>
              <p className="text-gray-300 text-sm md:text-lg line-clamp-3 mb-8 max-w-2xl font-medium drop-shadow-md">{featured.description}</p>
              <div className="flex gap-4">
                  <Button onClick={() => navigate(`/title/${featured.id}?type=${featured.type}`)} className="bg-white text-black hover:bg-gray-200 border-none px-8 py-3 text-lg rounded-full">
                      <Info className="mr-2" size={20} /> Detalhes
                  </Button>
              </div>
           </div>
        </div>
      )}

      <div className="relative z-20 space-y-12 px-4 md:px-8 pb-10 mt-8">
          {rows.map((row, idx) => (
              <div key={idx} className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                      {row.title}
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                      {row.items.map(item => (
                          <div key={item.id} className="min-w-[140px] md:min-w-[200px] snap-center">
                              {item.type === 'channel' || item.type === 'sport' ? (
                                  <MovieCard item={item} onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(item.videoUrl || '')}&title=${encodeURIComponent(item.title)}`)} />
                              ) : (
                                  <MovieCard item={item} onClick={() => navigate(`/title/${item.id}?type=${item.type}`)} />
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

// --- LIVE TV PAGE ---
export const LiveTV = () => {
    const [channels, setChannels] = useState<ContentItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchChannels = async (cat: string) => {
        setLoading(true);
        const items = await api.live.getChannels(cat);
        setChannels(items);
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const cats = await api.live.getCategories();
            setCategories(cats);
            await fetchChannels('');
        };
        init();
    }, []);

    return (
        <div className="bg-[#0F172A] min-h-screen p-4 md:p-12 text-white">
            <div className="flex items-center gap-4 mb-8">
                <Radio className="w-8 h-8 md:w-10 md:h-10 text-red-600 animate-pulse" />
                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">TV Ao Vivo</h1>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                <button 
                    onClick={() => { setSelectedCategory(''); fetchChannels(''); }}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedCategory === '' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                    Todas
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); fetchChannels(cat); }}
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20"><Loader2 className="animate-spin w-12 h-12 mx-auto text-blue-500"/></div>
            ) : channels.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-24 text-center gap-6 border border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                    <div className="p-6 bg-white/5 rounded-full"><XCircle size={48} className="text-gray-600" /></div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Nenhum canal encontrado</h3>
                    </div>
                 </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                    {channels.map((item, idx) => (
                        <MovieCard 
                            key={`${item.id}-${idx}`} 
                            item={item} 
                            onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(item.videoUrl || '')}&title=${encodeURIComponent(item.title)}`)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- SPORTS PAGE ---
export const SportsEvents = () => {
    const [events, setEvents] = useState<ContentItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'live' | 'upcoming' | ''>('live');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchEvents = async () => {
        setLoading(true);
        const items = await api.live.getSports(selectedCategory, statusFilter);
        setEvents(items);
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            const cats = await api.live.getSportsCategories();
            setCategories(cats);
            fetchEvents();
        };
        init();
    }, []);

    useEffect(() => { fetchEvents(); }, [selectedCategory, statusFilter]);

    return (
        <div className="bg-[#0F172A] min-h-screen p-4 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-yellow-500/10 p-3 rounded-2xl"><Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" /></div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Esportes</h1>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button 
                        onClick={() => setStatusFilter('live')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'live' ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Signal size={14} className={statusFilter === 'live' ? 'animate-pulse' : ''}/> Ao Vivo
                    </button>
                    <button 
                        onClick={() => setStatusFilter('upcoming')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'upcoming' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Calendar size={14} /> Agendados
                    </button>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                <button 
                    onClick={() => setSelectedCategory('')}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedCategory === '' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20"><Loader2 className="animate-spin w-12 h-12 mx-auto text-blue-500"/></div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-6 border border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                    <Trophy size={48} className="text-gray-600"/>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Nenhum evento esportivo</h3>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {events.map((item, idx) => (
                        <MovieCard 
                            key={`${item.id}-${idx}`} 
                            item={item} 
                            onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(item.videoUrl || '')}&title=${encodeURIComponent(item.title)}`)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- CATALOG PAGE (ROBUST FILTERS) ---
export const Catalog = ({ type }: { type: 'movie' | 'series' | 'anime' }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<{id: number, name: string}[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // A busca agora vem principalmente da URL se estiver presente, mas mantemos o estado local para filtros
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const querySearch = searchParams.get('q') || '';

  // Gerar lista de anos
  const years = Array.from({ length: 2025 - 1980 + 1 }, (_, i) => 2025 - i);

  useEffect(() => {
    const loadGenres = async () => {
        const data = await api.tmdb.getGenres(type === 'movie' ? 'movie' : 'tv');
        setGenres(data);
    };
    loadGenres();
  }, [type]);

  const loadData = async (pageNum: number, isNewSearch = false) => {
      setLoading(true);
      try {
          let newItems: ContentItem[] = [];
          
          if (querySearch) {
              // Se tiver busca na URL, usa ela
              newItems = await api.tmdb.search(querySearch, type);
          } else {
              // Senão usa os filtros
              newItems = await api.tmdb.getPopular(type, pageNum, {
                  genreId: selectedGenre,
                  year: selectedYear
              });
          }
          
          setItems(prev => isNewSearch ? newItems : [...prev, ...newItems]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
  };

  // Reset quando muda o tipo ou a query da URL
  useEffect(() => {
      setItems([]);
      setPage(1);
      setSelectedGenre('');
      setSelectedYear('');
      loadData(1, true);
  }, [type, querySearch]);

  // Atualiza quando filtros mudam
  useEffect(() => {
      if (!querySearch) {
        setPage(1);
        loadData(1, true);
      }
  }, [selectedGenre, selectedYear]);

  const getTitle = () => {
      if (querySearch) return `Busca: "${querySearch}"`;
      if (type === 'movie') return 'Filmes';
      if (type === 'series') return 'Séries';
      if (type === 'anime') return 'Animes';
      return 'Catálogo';
  };

  return (
    <div className="bg-[#0F172A] min-h-screen p-4 md:p-12 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-8">
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">
                {getTitle()}
            </h1>
        </div>

        {/* Barra de Filtros (Escondida se estiver buscando texto) */}
        {!querySearch && (
            <div className="flex flex-wrap items-center gap-4 mb-8 bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-3 px-4 py-2 border-r border-white/10 hidden md:flex">
                    <Filter size={18} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Filtrar por:</span>
                </div>

                <select 
                    className="bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer hover:bg-white/5 transition-all w-full md:w-auto"
                    value={selectedGenre}
                    onChange={e => setSelectedGenre(e.target.value)}
                >
                    <option value="">Todos os Gêneros</option>
                    {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                <select 
                    className="bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer hover:bg-white/5 transition-all w-full md:w-auto"
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                >
                    <option value="">Qualquer Ano</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                {(selectedGenre || selectedYear) && (
                    <button 
                        onClick={() => { setSelectedGenre(''); setSelectedYear(''); }}
                        className="ml-auto text-xs text-blue-500 hover:text-white font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        <XCircle size={14}/> Limpar
                    </button>
                )}
            </div>
        )}

        {items.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-6 border border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                <div className="p-6 bg-white/5 rounded-full"><Film size={48} className="text-gray-600" /></div>
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Nada por aqui</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Não encontramos resultados.</p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                {items.map((item, idx) => (
                    <MovieCard key={`${item.id}-${idx}`} item={item} onClick={() => navigate(`/title/${item.id}?type=${item.type}`)} />
                ))}
            </div>
        )}

        {items.length > 0 && (
            <div className="mt-16 flex justify-center">
                <Button onClick={() => { const next = page + 1; setPage(next); loadData(next); }} isLoading={loading} className="rounded-full px-12 py-5 text-xl shadow-blue-900/40 border border-white/10">
                    <ArrowDown size={24} /> Carregar Mais
                </Button>
            </div>
        )}
        {loading && items.length === 0 && <div className="text-center py-24"><Loader2 className="animate-spin w-12 h-12 mx-auto text-blue-500"/></div>}
    </div>
  );
};

// --- DETAILS PAGE (Sinopse, Elenco, Temporadas) ---
export const DetailsPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const typeQuery = searchParams.get('type');
    const typeParam = (typeQuery === 'series' || typeQuery === 'anime') ? 'series' : 'movie'; 
    const navigate = useNavigate();

    const [item, setItem] = useState<ContentItem | null>(null);
    const [cast, setCast] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [seasons] = useState([1,2,3,4,5,6,7,8,9,10]); 
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if(id) {
                const typeApi = typeParam === 'movie' ? 'movie' : 'tv';
                try {
                    const [data, credits, revs] = await Promise.all([
                        api.tmdb.getDetails(id, typeApi),
                        api.tmdb.getCredits(id, typeApi),
                        api.tmdb.getReviews(id, typeApi)
                    ]);
                    if (data) {
                        data.type = typeQuery === 'anime' ? 'anime' : typeParam;
                        setItem(data);
                    }
                    setCast(credits);
                    setReviews(revs);
                } catch (e) { console.error(e); }
            }
            setLoading(false);
        };
        load();
    }, [id, typeParam]);

    useEffect(() => {
        const fetchEps = async () => {
            if ((item?.type === 'series' || item?.type === 'anime') && id) {
                setLoadingEpisodes(true);
                const eps = await api.tmdb.getSeasons(id, selectedSeason);
                setEpisodes(eps);
                setLoadingEpisodes(false);
            }
        };
        fetchEps();
    }, [selectedSeason, item, id]);

    if (loading) return <LoadingScreen />;
    if (!item) return <div className="text-center p-24 text-white font-black uppercase tracking-widest">Conteúdo não encontrado.</div>;

    return (
        <div className="bg-[#0F172A] min-h-screen text-white pb-20">
            <div className="relative w-full h-[60vh] md:h-[70vh]">
                <div className="absolute inset-0">
                    <img src={item.backdropUrl} className="w-full h-full object-cover brightness-[0.3]" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 flex flex-col md:flex-row gap-8 items-end">
                    <img src={item.posterUrl} className="w-40 md:w-64 rounded-[2rem] shadow-2xl border border-white/10 hidden md:block transform hover:scale-105 transition-transform duration-500" alt={item.title}/>
                    <div className="mb-4">
                        <div className="flex gap-2 mb-6">
                            <span className="bg-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40">
                                {item.type === 'movie' ? 'Filme' : item.type === 'anime' ? 'Anime' : 'Série'}
                            </span>
                            <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">{item.genre}</span>
                            <span className="flex items-center gap-1.5 text-yellow-500 font-black text-xs bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md"><Star size={14} fill="currentColor"/> {item.year}</span>
                        </div>
                        <h1 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-none drop-shadow-2xl">{item.title}</h1>
                        <p className="text-gray-300 max-w-2xl text-lg leading-relaxed font-medium drop-shadow-md line-clamp-3 md:line-clamp-none">{item.description}</p>
                        
                        {item.type === 'movie' && (
                            <div className="mt-10">
                                <Button 
                                    onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(item.videoUrl || '')}&title=${encodeURIComponent(item.title)}`)} 
                                    className="bg-white text-black hover:bg-blue-600 hover:text-white px-12 py-5 text-2xl rounded-full shadow-2xl transition-all scale-100 hover:scale-105"
                                >
                                    <Play fill="currentColor" className="mr-3" size={28}/> ASSISTIR AGORA
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-16 mt-16 grid grid-cols-1 md:grid-cols-3 gap-16">
                <div className="md:col-span-2 space-y-16">
                    {(item.type === 'series' || item.type === 'anime') && (
                        <div className="bg-[#1E293B] border border-white/5 rounded-[2.5rem] p-6 md:p-12 shadow-2xl">
                            <h3 className="text-2xl md:text-3xl font-black mb-8 flex items-center gap-3 text-blue-500 uppercase italic tracking-tighter"><Film size={32}/> Episódios</h3>
                            
                            <div className="flex gap-3 overflow-x-auto pb-6 mb-8 border-b border-white/5 scrollbar-hide">
                                {seasons.map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setSelectedSeason(s)}
                                        className={`px-8 py-3 rounded-2xl whitespace-nowrap font-black text-[10px] uppercase tracking-widest transition-all ${selectedSeason === s ? 'bg-white text-black shadow-xl scale-105' : 'bg-black/30 text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Temporada {s}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {loadingEpisodes ? (
                                    <div className="text-center py-16"><Loader2 className="animate-spin mx-auto text-blue-500" size={32}/></div>
                                ) : episodes.length > 0 ? (
                                    episodes.map(ep => (
                                        <div 
                                            key={ep.id} 
                                            onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(ep.videoUrl)}&title=${encodeURIComponent(`${item.title} - T${ep.season}:E${ep.number} ${ep.title}`)}`)}
                                            className="flex items-center justify-between p-6 bg-[#0F172A] rounded-3xl border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/50 cursor-pointer group transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-900/20 flex items-center justify-center text-blue-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                                                    {ep.number}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm md:text-lg text-white group-hover:text-blue-300 uppercase tracking-tighter transition-colors">{ep.title}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Episódio {ep.number}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600 group-hover:text-blue-400 transition-colors">
                                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">Reproduzir</span>
                                                <div className="p-3 bg-white/5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all"><Play size={20} fill="currentColor" /></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Aguardando disponibilidade.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase italic tracking-tighter"><UserIcon size={24} className="text-blue-500"/> Elenco</h3>
                        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
                            {cast.map((actor, i) => (
                                <div key={i} className="min-w-[140px] text-center group">
                                    <div className="w-28 h-28 mx-auto rounded-[2rem] overflow-hidden bg-slate-800 mb-4 border border-white/10 shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                                        {actor.profileUrl ? (
                                            <img src={actor.profileUrl} className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-black text-2xl">{actor.name[0]}</div>
                                        )}
                                    </div>
                                    <p className="text-sm font-black text-white truncate uppercase tracking-tighter">{actor.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest font-bold">{actor.character}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[#1E293B] p-8 rounded-[2.5rem] border border-white/5 md:sticky md:top-24 shadow-2xl">
                        <h4 className="font-black text-gray-500 uppercase text-[10px] tracking-widest mb-6 pb-4 border-b border-white/5">Ficha Técnica</h4>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Ano</span>
                                <span className="font-black text-sm text-white">{item.year}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Gênero</span>
                                <span className="font-black text-sm text-blue-500 uppercase italic tracking-tighter">{item.genre}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PLAYER PAGE ---
export const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const videoUrlParam = searchParams.get('videoUrl');
  const titleParam = searchParams.get('title');

  const isMixedContent = window.location.protocol === 'https:' && videoUrlParam?.startsWith('http:');
  const [showMixedContentWarning, setShowMixedContentWarning] = useState(isMixedContent);

  const handleBack = () => (window.history.length > 2 ? navigate(-1) : navigate('/home'));
  const handleOpenExternal = () => videoUrlParam && window.open(videoUrlParam, '_blank');

  if (!videoUrlParam) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center flex-col text-gray-500 z-50">
         <Info size={64} className="mb-6 text-gray-800"/>
         <p className="font-black uppercase tracking-widest text-xs">Erro: Fonte de vídeo indisponível</p>
         <button onClick={handleBack} className="mt-8 bg-white/5 px-8 py-3 rounded-full text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all border border-white/10">Voltar</button>
    </div>
  );

  const isM3U8 = videoUrlParam.includes('.m3u8');
  let finalVideoUrl = videoUrlParam;
  if (isM3U8 && isMixedContent) finalVideoUrl = `https://corsproxy.io/?${encodeURIComponent(videoUrlParam)}`;

  let contentHtml = isM3U8 ? `
        <!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js"></script><style>body{margin:0;background:#000;height:100vh;display:flex;align-items:center;justify-content:center;}</style></head><body><div id="p" style="width:100%;height:100%"></div><script>new Clappr.Player({source:"${finalVideoUrl}",parentId:"#p",width:"100%",height:"100%",autoPlay:true});</script></body></html>
     ` : `
        <iframe src="${videoUrlParam}" width="100%" height="100%" frameborder="0" allowfullscreen referrerpolicy="no-referrer" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;"></iframe>
      `;

  if (!isM3U8 && isMixedContent && showMixedContentWarning) {
      return (
          <div className="fixed inset-0 bg-[#0F172A] z-[200] flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-yellow-500/10 p-8 rounded-[3rem] mb-8 animate-pulse"><ShieldAlert size={80} className="text-yellow-500"/></div>
              <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter leading-none">Proteção Ativada</h2>
              <p className="text-gray-500 max-w-md mb-12 font-medium">Este servidor utiliza uma conexão antiga que seu navegador pode bloquear. Recomendamos abrir em uma nova janela dedicada.</p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                  <Button onClick={handleOpenExternal} className="w-full bg-blue-600 hover:bg-white hover:text-black py-5 text-lg font-black rounded-3xl">
                      <ExternalLink size={20} className="mr-2"/> ABRIR NOVA ABA
                  </Button>
                  <Button onClick={() => setShowMixedContentWarning(false)} variant="secondary" className="w-full border-white/10 py-5 rounded-3xl">
                      <WifiOff size={20} className="mr-2"/> FORÇAR REPRODUÇÃO
                  </Button>
                  <button onClick={handleBack} className="mt-4 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Cancelar e Voltar</button>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100]">
        <div className="absolute top-0 left-0 right-0 p-8 z-[110] flex justify-between items-start pointer-events-none group hover:bg-gradient-to-b hover:from-black/90 hover:to-transparent transition-all duration-500">
            <button onClick={handleBack} className="pointer-events-auto bg-black/40 hover:bg-white hover:text-black text-white p-4 rounded-full backdrop-blur-xl transition-all shadow-2xl border border-white/10"><ChevronRight className="rotate-180" size={32}/></button>
            <div className="flex gap-3 pointer-events-auto">
                 <button onClick={handleOpenExternal} className="bg-blue-600/90 hover:bg-blue-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-xl flex items-center gap-2 shadow-2xl transition-all"><ExternalLink size={16}/> Link Externo</button>
            </div>
        </div>
        
        <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 z-[110] transform translate-y-4 group-hover:translate-y-0">
             <h2 className="text-white font-black uppercase italic tracking-tighter text-3xl shadow-black drop-shadow-2xl">{titleParam || 'Reproduzindo'}</h2>
             {isM3U8 && <div className="mt-4 flex justify-center"><span className="text-[10px] text-green-400 font-black uppercase tracking-widest bg-green-950/60 px-4 py-1.5 rounded-full border border-green-500/30 backdrop-blur-md">Sinal Digital 4K Disponível</span></div>}
        </div>

        {isM3U8 ? (
            <iframe srcDoc={contentHtml} className="w-full h-full border-0 absolute inset-0 z-10" allowFullScreen allow="autoplay"/>
        ) : (
            <div className="w-full h-full relative" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        )}
    </div>
  );
};

const LoadingScreen = () => (
    <div className="h-screen w-screen bg-[#0F172A] flex flex-col items-center justify-center z-[500] fixed top-0 left-0">
        <div className="relative mb-12">
            <div className="w-24 h-24 rounded-[2rem] border-4 border-white/5"></div>
            <div className="absolute inset-0 w-24 h-24 rounded-[2rem] border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-8 h-8 opacity-50"/>
        </div>
        <div className="text-center">
            <p className="text-sm font-black text-white uppercase tracking-[0.4em] mb-2 animate-pulse">Sintonizando</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">Meu Cinema Premium Experience</p>
        </div>
    </div>
);
