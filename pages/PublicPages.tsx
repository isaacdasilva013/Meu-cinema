
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Play, Plus, ChevronRight, Loader2, Star, Info, Volume2, Search, ArrowDown, User as UserIcon, Calendar, Film } from 'lucide-react';
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
        const [trendingMovies, trendingSeries, actionMovies, comedyMovies, horrorMovies] = await Promise.all([
            api.tmdb.getTrending('movie', 'week'),
            api.tmdb.getTrending('tv', 'week'),
            api.tmdb.getByGenre('movie', 28, 1),
            api.tmdb.getByGenre('movie', 35, 1),
            api.tmdb.getByGenre('movie', 27, 1),
        ]);

        if (mounted) {
            if (trendingMovies.length > 0) setFeatured(trendingMovies[0]);
            setRows([
                { title: "Filmes em Alta", items: trendingMovies },
                { title: "Séries do Momento", items: trendingSeries },
                { title: "Ação e Aventura", items: actionMovies },
                { title: "Comédias Populares", items: comedyMovies },
                { title: "Para Morrer de Medo", items: horrorMovies },
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
                              <MovieCard item={item} onClick={() => navigate(`/title/${item.id}?type=${item.type}`)} />
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
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

// --- PLAYER PAGE (Simplificado - Apenas Toca) ---
export const Player = () => {
  const navigate = useNavigate();
  // CORREÇÃO CRÍTICA: Usar useLocation para pegar query params dentro do HashRouter
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const videoUrlParam = searchParams.get('videoUrl');
  const titleParam = searchParams.get('title');

  const handleBack = () => {
      // Tenta voltar, se nao tiver historico, vai pra home
      if (window.history.length > 2) {
          navigate(-1);
      } else {
          navigate('/home');
      }
  };

  return (
    <div className="h-screen bg-black flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity opacity-0 group-hover:opacity-100">
            <button 
                onClick={handleBack}
                className="pointer-events-auto flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl backdrop-blur-md transition-all font-bold uppercase text-xs tracking-widest"
            >
                <ChevronRight className="rotate-180" size={16}/> Voltar
            </button>
            <div className="text-right pointer-events-none">
                <h2 className="text-white font-black uppercase tracking-wider text-lg shadow-black drop-shadow-md">{titleParam || 'Reproduzindo'}</h2>
            </div>
        </div>

        <div className="flex-1 w-full h-full bg-black relative">
            {videoUrlParam ? (
                <iframe 
                    src={videoUrlParam} 
                    className="w-full h-full border-0" 
                    allowFullScreen 
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                />
            ) : (
                <div className="flex items-center justify-center h-full flex-col text-gray-500">
                    <Info size={48} className="mb-4 text-gray-700"/>
                    <p>Erro: Link de vídeo não fornecido.</p>
                </div>
            )}
        </div>
    </div>
  );
};

const LoadingScreen = () => (
    <div className="h-screen w-screen bg-[#0F172A] flex flex-col items-center justify-center z-[100] fixed top-0 left-0">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <p className="text-white/50 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Carregando...</p>
    </div>
);
