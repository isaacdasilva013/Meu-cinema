
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Play, Plus, ChevronRight, Loader2, Star, Info, Volume2, Search, ArrowDown, User as UserIcon, Calendar, Film, Trophy, Radio, Signal, RefreshCw } from 'lucide-react';
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
        const [trendingMovies, trendingSeries, liveChannels, liveSports] = await Promise.all([
            api.tmdb.getTrending('movie', 'week'),
            api.tmdb.getTrending('tv', 'week'),
            api.live.getChannels(),
            api.live.getSports(undefined, 'live') // Apenas ao vivo
        ]);

        if (mounted) {
            if (trendingMovies.length > 0) setFeatured(trendingMovies[0]);
            
            setRows([
                // Prioridade para esportes ao vivo se houver
                ...(liveSports.length > 0 ? [{ title: "Esportes Ao Vivo 🔥", items: liveSports.slice(0, 10) }] : []),
                { title: "Filmes em Alta", items: trendingMovies },
                ...(liveChannels.length > 0 ? [{ title: "Canais Recomendados", items: liveChannels.slice(0, 10) }] : []),
                { title: "Séries do Momento", items: trendingSeries },
            ]);
        }
      } catch (e) {
        console.error("Home error", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadHome();
    return () => { mounted = false; };
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="bg-[#0F172A] min-h-screen text-white pb-20 overflow-x-hidden">
      {featured && (
        <div className="relative w-full h-[85vh] md:h-[95vh] flex items-center">
           <div className="absolute inset-0">
             <img src={featured.backdropUrl} className="w-full h-full object-cover brightness-[0.4]" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/20 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/40 to-transparent" />
           </div>
           <div className="relative z-10 px-8 md:px-16 max-w-4xl mt-20">
              <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded mb-4 inline-block shadow-lg shadow-red-600/40">Destaque</span>
              <h1 className="text-5xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter uppercase italic">{featured.title}</h1>
              <p className="text-gray-300 text-lg md:text-xl line-clamp-3 mb-8 max-w-2xl font-medium drop-shadow-md">{featured.description}</p>
              <div className="flex gap-4">
                  <Button onClick={() => navigate(`/title/${featured.id}?type=${featured.type}`)} className="bg-white text-black hover:bg-gray-200 border-none px-10 py-4 text-xl rounded-full">
                      <Info className="mr-2" /> Detalhes
                  </Button>
              </div>
           </div>
        </div>
      )}

      <div className="relative z-20 -mt-32 space-y-12 px-8 pb-10">
          {rows.map((row, idx) => (
              <div key={idx} className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                      {row.title}
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x">
                      {row.items.map(item => (
                          <div key={item.id} className="min-w-[160px] md:min-w-[220px] snap-center">
                              {item.type === 'channel' || item.type === 'sport' ? (
                                  // Canais e Esportes vão direto pro player
                                  <MovieCard item={item} onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(item.videoUrl || '')}&title=${encodeURIComponent(item.title)}`)} />
                              ) : (
                                  // Filmes e Séries vão para detalhes
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

    const handleCategoryClick = (cat: string) => {
        setSelectedCategory(cat);
        fetchChannels(cat);
    };

    return (
        <div className="bg-[#0F172A] min-h-screen p-8 md:p-16 text-white">
            <div className="flex items-center gap-4 mb-8">
                <Radio className="w-10 h-10 text-red-600" />
                <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">TV Ao Vivo</h1>
            </div>

            {/* Categorias */}
            <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                <button 
                    onClick={() => handleCategoryClick('')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide whitespace-nowrap transition-all border ${selectedCategory === '' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#1E293B] border-white/10 text-gray-400 hover:text-white'}`}
                >
                    Todas
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#1E293B] border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20"><Loader2 className="animate-spin w-12 h-12 mx-auto text-blue-500"/></div>
            ) : channels.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-auto max-w-2xl">
                    <Radio size={48} className="text-gray-500" />
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum canal encontrado.</h3>
                        <p className="text-gray-400 text-sm">Pode haver um problema temporário na conexão com a API de canais.</p>
                    </div>
                    <Button onClick={() => fetchChannels(selectedCategory)} variant="secondary" className="mt-2">
                        <RefreshCw size={16} className="mr-2"/> Tentar Novamente
                    </Button>
                 </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
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

    // Effect para recarregar quando filtros mudam
    useEffect(() => {
        fetchEvents();
    }, [selectedCategory, statusFilter]);

    return (
        <div className="bg-[#0F172A] min-h-screen p-8 md:p-16 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Esportes</h1>
                </div>
                
                {/* Status Toggle */}
                <div className="flex bg-[#1E293B] p-1 rounded-xl border border-white/10">
                    <button 
                        onClick={() => setStatusFilter('live')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'live' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Signal size={14} className={statusFilter === 'live' ? 'animate-pulse' : ''}/> Ao Vivo
                    </button>
                    <button 
                        onClick={() => setStatusFilter('upcoming')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'upcoming' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Calendar size={14} /> Agendados
                    </button>
                </div>
            </div>

            {/* Categorias */}
            <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                <button 
                    onClick={() => setSelectedCategory('')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide whitespace-nowrap transition-all border ${selectedCategory === '' ? 'bg-white text-black border-white' : 'bg-[#1E293B] border-white/10 text-gray-400 hover:text-white'}`}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-[#1E293B] border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20"><Loader2 className="animate-spin w-12 h-12 mx-auto text-blue-500"/></div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-auto max-w-2xl">
                    <Trophy size={48} className="text-gray-500"/>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum evento encontrado.</h3>
                        <p className="text-gray-400 text-sm">Tente mudar os filtros ou atualizar a lista.</p>
                    </div>
                    <Button onClick={fetchEvents} variant="secondary" className="mt-2">
                        <RefreshCw size={16} className="mr-2"/> Atualizar Lista
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

// --- CATALOG PAGE ---
export const Catalog = ({ type }: { type: 'movie' | 'series' }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const loadData = async (pageNum: number, isNewSearch = false) => {
      setLoading(true);
      try {
          let newItems: ContentItem[] = [];
          if (search) {
              newItems = await api.tmdb.search(search);
              // Filtra no cliente para garantir que só mostre o tipo correto
              newItems = newItems.filter(i => i.type === type);
          } else {
              newItems = await api.tmdb.getPopular(type === 'movie' ? 'movie' : 'tv', pageNum);
          }
          setItems(prev => isNewSearch ? newItems : [...prev, ...newItems]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
  };

  useEffect(() => {
      setItems([]);
      setPage(1);
      setSearch('');
      loadData(1, true);
  }, [type]);

  useEffect(() => {
      const delay = setTimeout(() => {
          if (search) {
              setIsSearching(true);
              setPage(1);
              loadData(1, true);
          } else if (isSearching) {
              setIsSearching(false);
              setPage(1);
              loadData(1, true);
          }
      }, 800);
      return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="bg-[#0F172A] min-h-screen p-8 md:p-16 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
                {type === 'movie' ? 'Filmes' : 'Séries'}
            </h1>
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder={`Pesquisar ${type === 'movie' ? 'filmes' : 'séries'}...`}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-full py-3 pl-12 pr-6 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
            {items.map((item, idx) => (
                <MovieCard key={`${item.id}-${idx}`} item={item} onClick={() => navigate(`/title/${item.id}?type=${item.type}`)} />
            ))}
        </div>

        {!isSearching && items.length > 0 && (
            <div className="mt-16 flex justify-center">
                <Button onClick={() => { const next = page + 1; setPage(next); loadData(next); }} isLoading={loading} className="rounded-full px-12 py-4 text-lg shadow-blue-900/40">
                    <ArrowDown size={20} /> Carregar Mais
                </Button>
            </div>
        )}
        {loading && items.length === 0 && <div className="text-center py-20"><Loader2 className="animate-spin w-10 h-10 mx-auto text-blue-500"/></div>}
    </div>
  );
};

// --- DETAILS PAGE (Sinopse, Elenco, Temporadas) ---
export const DetailsPage = () => {
    const { id } = useParams();
    // CORREÇÃO: Usar useLocation para pegar o query param em HashRouter
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const typeParam = (searchParams.get('type') === 'series' ? 'series' : 'movie'); 
    const navigate = useNavigate();

    const [item, setItem] = useState<ContentItem | null>(null);
    const [cast, setCast] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Series Specific
    const [seasons] = useState([1,2,3,4,5,6,7,8,9,10]); 
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if(id) {
                // Converte 'series' para 'tv' que é o endpoint do TMDB
                const typeApi = typeParam === 'movie' ? 'movie' : 'tv';
                
                try {
                    const [data, credits, revs] = await Promise.all([
                        api.tmdb.getDetails(id, typeApi),
                        api.tmdb.getCredits(id, typeApi),
                        api.tmdb.getReviews(id, typeApi)
                    ]);
                    
                    if (data) {
                        data.type = typeParam;
                        setItem(data);
                    }
                    setCast(credits);
                    setReviews(revs);
                } catch (e) {
                    console.error("Erro ao carregar detalhes", e);
                }
            }
            setLoading(false);
        };
        load();
    }, [id, typeParam]);

    // Load Episodes when season changes (Só para séries)
    useEffect(() => {
        const fetchEps = async () => {
            if (item?.type === 'series' && id) {
                setLoadingEpisodes(true);
                const eps = await api.tmdb.getSeasons(id, selectedSeason);
                setEpisodes(eps);
                setLoadingEpisodes(false);
            }
        };
        fetchEps();
    }, [selectedSeason, item, id]);

    if (loading) return <LoadingScreen />;
    if (!item) return <div className="text-center p-20 text-white">Conteúdo não encontrado.</div>;

    return (
        <div className="bg-[#0F172A] min-h-screen text-white pb-20">
            {/* Header / Backdrop */}
            <div className="relative w-full h-[60vh] md:h-[70vh]">
                <div className="absolute inset-0">
                    <img src={item.backdropUrl} className="w-full h-full object-cover brightness-[0.3]" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 flex flex-col md:flex-row gap-8 items-end">
                    <img src={item.posterUrl} className="w-40 md:w-64 rounded-xl shadow-2xl border border-white/20 hidden md:block" alt={item.title}/>
                    <div className="mb-4">
                        <div className="flex gap-2 mb-4">
                            <span className="bg-blue-600 px-2 py-1 rounded text-xs font-bold uppercase">{item.type === 'movie' ? 'Filme' : 'Série'}</span>
                            <span className="bg-white/10 border border-white/10 px-2 py-1 rounded text-xs font-bold">{item.genre}</span>
                            <span className="flex items-center gap-1 text-yellow-500 font-bold text-xs"><Star size={12} fill="currentColor"/> {item.year}</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-4">{item.title}</h1>
                        <p className="text-gray-300 max-w-2xl text-lg leading-relaxed">{item.description}</p>
                        
                        {/* BOTÃO ASSISTIR - ESTRITAMENTE PARA FILMES */}
                        {item.type === 'movie' && (
                            <div className="mt-8">
                                <Button 
                                    onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(item.videoUrl || '')}&title=${encodeURIComponent(item.title)}`)} 
                                    className="bg-blue-600 hover:bg-white hover:text-blue-900 px-12 py-5 text-xl rounded-full shadow-lg shadow-blue-900/50"
                                >
                                    <Play fill="currentColor" className="mr-2"/> ASSISTIR FILME
                                </Button>
                            </div>
                        )}
                        {/* Se for série, NÃO mostra botão aqui. Apenas na lista de episódios abaixo. */}
                    </div>
                </div>
            </div>

            <div className="px-8 md:px-16 mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                
                {/* Left Column: Details & Cast */}
                <div className="md:col-span-2 space-y-12">
                    
                    {/* Series Seasons Section (EXCLUSIVO PARA SÉRIES) */}
                    {item.type === 'series' && (
                        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-400"><Film size={24}/> Episódios & Temporadas</h3>
                            
                            {/* Season Selector */}
                            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 border-b border-white/5">
                                {seasons.map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setSelectedSeason(s)}
                                        className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${selectedSeason === s ? 'bg-white text-black' : 'bg-black/30 text-gray-400 hover:text-white'}`}
                                    >
                                        Temporada {s}
                                    </button>
                                ))}
                            </div>

                            {/* Episode List */}
                            <div className="space-y-2">
                                {loadingEpisodes ? (
                                    <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-500"/></div>
                                ) : episodes.length > 0 ? (
                                    episodes.map(ep => (
                                        <div 
                                            key={ep.id} 
                                            // Ao clicar, leva para o Player com a URL ESPECÍFICA DO EPISÓDIO
                                            onClick={() => navigate(`/player/${item.id}?videoUrl=${encodeURIComponent(ep.videoUrl)}&title=${encodeURIComponent(`${item.title} - T${ep.season}:E${ep.number} ${ep.title}`)}`)}
                                            className="flex items-center justify-between p-4 bg-[#0F172A] rounded-xl border border-white/5 hover:bg-white/5 hover:border-blue-500/50 cursor-pointer group transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {ep.number}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-blue-300">{ep.title}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Episódio {ep.number}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 group-hover:text-blue-400">
                                                <span className="text-xs font-bold uppercase tracking-widest hidden md:block">Assistir</span>
                                                <Play size={16} fill="currentColor" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Nenhum episódio encontrado para esta temporada.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Cast Carousel */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><UserIcon size={20} className="text-gray-400"/> Elenco Principal</h3>
                        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                            {cast.map((actor, i) => (
                                <div key={i} className="min-w-[120px] text-center">
                                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-slate-800 mb-3 border-2 border-white/10">
                                        {actor.profileUrl ? (
                                            <img src={actor.profileUrl} className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">{actor.name[0]}</div>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{actor.character}</p>
                                </div>
                            ))}
                            {cast.length === 0 && <p className="text-gray-500 text-sm">Informações de elenco indisponíveis.</p>}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div>
                        <h3 className="text-xl font-bold mb-6">Comentários da Comunidade (TMDB)</h3>
                        <div className="space-y-4">
                            {reviews.length > 0 ? reviews.map((rev, i) => (
                                <div key={i} className="bg-[#1E293B] p-5 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-blue-400 text-sm">{rev.author}</p>
                                        {rev.rating && <span className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><Star size={10} fill="currentColor"/> {rev.rating}/10</span>}
                                    </div>
                                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 italic">"{rev.content}"</p>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-sm italic">Nenhum comentário encontrado ainda.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Info Card */}
                <div className="space-y-6">
                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/5 sticky top-8">
                        <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Informações</h4>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-gray-500">Ano</span>
                                <span className="font-medium">{item.year}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-gray-500">Gênero</span>
                                <span className="font-medium text-right">{item.genre}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-gray-500">TMDB Rating</span>
                                <span className="font-medium text-yellow-500 font-bold">8.5/10</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- PLAYER PAGE (HÍBRIDO: Clappr Nativo ou Iframe No-Referrer) ---
export const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const videoUrlParam = searchParams.get('videoUrl');
  const titleParam = searchParams.get('title');

  const handleBack = () => {
      if (window.history.length > 2) {
          navigate(-1);
      } else {
          navigate('/home');
      }
  };

  if (!videoUrlParam) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center flex-col text-gray-500 z-50">
         <Info size={48} className="mb-4 text-gray-700"/>
         <p>Erro: Link de vídeo não fornecido.</p>
         <button onClick={handleBack} className="mt-4 text-white hover:underline">Voltar</button>
    </div>
  );

  const isM3U8 = videoUrlParam.includes('.m3u8');
  let contentHtml = '';

  if (isM3U8) {
     // PLAYER NATIVO (BYPASS COMPLETO DE SITE EXTERNO)
     // Usa Clappr para tocar o stream direto. Zero anúncios, zero bloqueio de domínio.
     contentHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js"></script>
            <style>
                body { margin: 0; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                #player-wrapper { width: 100%; height: 100%; }
            </style>
        </head>
        <body>
            <div id="player-wrapper"></div>
            <script>
                var player = new Clappr.Player({
                    source: "${videoUrlParam}",
                    parentId: "#player-wrapper",
                    width: "100%",
                    height: "100%",
                    autoPlay: true,
                    disableVideoTagContextMenu: true
                });
            </script>
        </body>
        </html>
     `;
  } else {
      // IFRAME EXTERNO (EMBED)
      // Solução Radical para "Sandbox Detected":
      // 1. referrerpolicy="no-referrer": Esconde que o site é 'meucinema.online'. O player acha que é acesso direto.
      // 2. SEM atributo sandbox: O player tem permissão total, evitando erros de script que checam "privelegios".
      // 3. allow="...": Lista completa de permissões para evitar feature detection falha.
      contentHtml = `
        <iframe 
            src="${videoUrlParam}" 
            width="100%" 
            height="100%" 
            frameborder="0" 
            scrolling="no" 
            allowfullscreen="true" 
            webkitallowfullscreen="true" 
            mozallowfullscreen="true" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; camera; microphone; display-capture; geolocation; payment; usb; vr; xr-spatial-tracking" 
            referrerpolicy="no-referrer"
            style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; z-index:1;"
        ></iframe>
      `;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
        {/* Header Flutuante */}
        <div className="absolute top-0 left-0 right-0 p-6 z-[60] flex justify-between items-start pointer-events-none group hover:bg-gradient-to-b hover:from-black/80 hover:to-transparent transition-all duration-300">
            <button 
                onClick={handleBack}
                className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all"
            >
                <ChevronRight className="rotate-180" size={24}/>
            </button>
            <div className="text-right pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <h2 className="text-white font-black uppercase tracking-wider text-lg shadow-black drop-shadow-md">{titleParam || 'Reproduzindo'}</h2>
                {isM3U8 && <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest bg-green-900/40 px-2 py-1 rounded border border-green-500/20">Sinal Direto (Premium)</span>}
            </div>
        </div>

        {/* Renderização Condicional */}
        {isM3U8 ? (
            <iframe 
                srcDoc={contentHtml}
                className="w-full h-full border-0 absolute inset-0 z-10"
                allowFullScreen
                allow="autoplay; encrypted-media"
            />
        ) : (
            <div 
                className="w-full h-full relative"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
        )}
    </div>
  );
};

const LoadingScreen = () => (
    <div className="h-screen w-screen bg-[#0F172A] flex flex-col items-center justify-center z-[100] fixed top-0 left-0">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <p className="text-white/50 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Carregando...</p>
    </div>
);
