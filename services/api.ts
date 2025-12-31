import { createClient } from '@supabase/supabase-js';
import { User, ContentItem, Episode } from '../types';

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://vgscgajduffmicbbuvxj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E3rCZG9u6RgQGWLS6ud_0g_wxJraAbi';
const TMDB_API_KEY = 'd6cdd588a4405dad47a55194c1efa29c'; 
const REIDOSCANAIS_API = 'https://api.reidoscanais.io';

// Inicialização segura do Cliente Supabase
let supabase: any;

const createMockClient = (errorMsg: string) => ({
    auth: {
        getSession: async () => ({ data: { session: null }, error: errorMsg }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: "Erro de Conexão: Verifique sua API Key." } }),
        signUp: async () => ({ data: { user: null }, error: { message: "Erro de Configuração." } }),
        signInWithOAuth: async () => ({ error: { message: "Configuração inválida" } }),
        signOut: async () => {},
    },
    from: () => ({ 
        select: () => ({ 
            eq: () => ({ single: () => ({ data: null }), order: () => ({ data: [] }) }),
            order: () => ({ data: [] }),
            insert: () => ({ error: { message: "Modo Offline" } }),
            update: () => ({ error: { message: "Modo Offline" } }),
            delete: () => ({ error: { message: "Modo Offline" } })
        }),
        upload: () => ({ error: { message: "Offline" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } })
    }),
    storage: {
        from: () => ({
            upload: async () => ({ error: { message: "Offline" } }),
            getPublicUrl: () => ({ data: { publicUrl: "" } })
        })
    }
});

try {
    if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY.length < 10) {
        throw new Error("Chave Inválida");
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
        db: { schema: 'public' },
    });
} catch (e) {
    console.error("AVISO: Usando cliente Mock devido a erro na API Key.", e);
    supabase = createMockClient("Cliente inválido");
}

// BASE URL DA PLAYER API
const PLAYER_API_BASE = "https://playerflixapi.com";

const GENRE_MAP: Record<number, string> = {
  28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
  99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia", 36: "História",
  27: "Terror", 10402: "Música", 9648: "Mistério", 10749: "Romance", 878: "Ficção Científica",
  10770: "Cinema TV", 53: "Suspense", 10752: "Guerra", 37: "Faroeste",
  10759: "Ação & Aventura", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

const getGenreName = (ids: number[]) => {
  if (!ids || ids.length === 0) return 'Geral';
  return GENRE_MAP[ids[0]] || 'Geral';
};

// --- HELPERS AVANÇADOS DE FETCH ---

// Helper para extrair array de qualquer estrutura de resposta JSON
const extractArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.channels && Array.isArray(data.channels)) return data.channels;
    if (data.sports && Array.isArray(data.sports)) return data.sports;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.title || data.name) return [data];
    return [];
};

// Helper para Fetch com Fallback de Proxy
const fetchWithCors = async (url: string) => {
    const tryFetch = async (targetUrl: string) => {
        try {
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch {
                console.warn("Resposta não é JSON válido:", text.substring(0, 100));
                return [];
            }
        } catch (e) {
            return null;
        }
    };

    const cacheBuster = (u: string) => {
        const separator = u.includes('?') ? '&' : '?';
        return `${u}${separator}_t=${Date.now()}`;
    };

    let data = await tryFetch(cacheBuster(url));
    if (data) return extractArray(data);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cacheBuster(url))}`;
    data = await tryFetch(proxyUrl);
    if (data) return extractArray(data);

    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(cacheBuster(url))}`;
    data = await tryFetch(corsProxyUrl);
    if (data) return extractArray(data);

    return []; 
};

// --- ALGORITMO DE BUSCA PROFUNDA DE STREAM (ATUALIZADO) ---
const findStreamDeep = (obj: any, depth = 0): string => {
    if (!obj || depth > 5) return ''; 

    // 1. Se for string direta
    if (typeof obj === 'string') {
        const s = obj.trim();
        // Verifica se é iframe
        if (s.includes('<iframe') && s.includes('src=')) {
             const match = s.match(/src=['"](.*?)['"]/);
             if (match) return match[1];
        }
        // Validação estrita para strings soltas (para evitar falsos positivos)
        if ((s.startsWith('http') || s.startsWith('//')) && 
            (s.includes('.m3u8') || s.includes('.mp4') || s.includes('php?stream=') || s.includes('/live/') || s.includes('rdcanais'))) {
            return s;
        }
        return '';
    }

    // 2. Travessia de Objeto com Prioridade de Chaves
    if (typeof obj === 'object') {
        const priorityKeys = ['embed_url', 'embed', 'iframe', 'stream_url', 'url', 'link', 'm3u8', 'source', 'stream', 'play_url', 'video_url', 'secure_url'];
        
        for (const key of priorityKeys) {
            if (obj[key]) {
                const val = obj[key];
                
                // Se achou uma chave prioritária e o valor é string, valida com menos rigor (aceita embeds)
                if (typeof val === 'string') {
                    const s = val.trim();
                    // Extrai src de iframe
                    if (s.includes('<iframe')) {
                         const match = s.match(/src=['"](.*?)['"]/);
                         if (match) return match[1];
                    }
                    // Aceita URL se começar com http/https e NÃO for imagem
                    if ((s.startsWith('http') || s.startsWith('//')) && !/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(s)) {
                        return s;
                    }
                }
                
                // Recursão no valor (caso seja objeto aninhado na chave prioritária)
                const found = findStreamDeep(val, depth + 1);
                if (found) return found;
            }
        }
        
        // Varredura geral no restante
        if (Array.isArray(obj)) {
             for (const item of obj) {
                 const found = findStreamDeep(item, depth + 1);
                 if (found) return found;
             }
        } else {
             for (const key in obj) {
                 if (priorityKeys.includes(key)) continue; // Já verificado
                 const found = findStreamDeep(obj[key], depth + 1);
                 if (found) return found;
             }
        }
    }
    return '';
};

// --- MAPPERS ---

const mapTMDBToContent = (item: any, type: 'movie' | 'tv' | 'anime'): ContentItem => {
    const isMovie = type === 'movie';
    const tmdbId = item.id;
    const generatedVideoUrl = isMovie ? `${PLAYER_API_BASE}/movie/${tmdbId}` : '';

    return {
        id: String(tmdbId),
        tmdbId: tmdbId,
        title: item.title || item.name,
        description: item.overview || 'Sinopse indisponível.',
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
        videoUrl: generatedVideoUrl, 
        genre: item.genres ? item.genres[0]?.name : getGenreName(item.genre_ids),
        year: parseInt((item.release_date || item.first_air_date || '2024').substring(0, 4)),
        type: type === 'tv' ? 'series' : type,
        createdAt: new Date().toISOString()
    };
};

const fixImageUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/300x450?text=Sem+Logo';
    url = url.trim();
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('http:')) return url.replace('http:', 'https:');
    return url;
};

const fixVideoUrl = (url: string) => {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('//')) return 'https:' + url;
    // IMPORTANTE: NÃO forçar HTTPS em vídeo. Muitos streams são HTTP.
    return url;
};

const mapChannelToContent = (item: any): ContentItem => {
    // Busca profunda pelo link de vídeo ou embed
    let videoUrl = findStreamDeep(item);
    
    // Busca profunda pela imagem
    const rawImage = item.logo || item.logo_url || item.image || item.poster || item.thumb || item.img || item.icon || item.cover || item.picture;
    const posterUrl = fixImageUrl(rawImage);

    // Título fallback
    const title = item.title || item.name || item.channel_name || 'Canal TV';

    return {
        id: String(item.id || item._id || Math.random()),
        title: title,
        description: item.description || 'Transmissão Ao Vivo',
        posterUrl: posterUrl,
        backdropUrl: posterUrl,
        videoUrl: fixVideoUrl(videoUrl),
        genre: item.category || 'TV',
        year: 'AO VIVO', 
        type: 'channel',
        isLive: true,
        createdAt: new Date().toISOString()
    };
};

const mapSportToContent = (item: any): ContentItem => {
    // Busca profunda pelo link de vídeo
    let videoUrl = findStreamDeep(item);
    
    // Fallback: Tenta construir título baseado em times se 'title' não existir
    const title = item.title || `${item.home_team || 'Time A'} vs ${item.away_team || 'Time B'}`;

    const date = item.start_time ? new Date(item.start_time) : new Date();
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const rawImage = item.poster || item.image || item.logo || item.thumb || item.home_team_logo || item.away_team_logo;

    return {
        id: String(item.id || Math.random()),
        title: title,
        description: item.description || item.category || 'Transmissão Esportiva',
        posterUrl: fixImageUrl(rawImage),
        backdropUrl: '',
        videoUrl: fixVideoUrl(videoUrl),
        genre: item.category || 'Esporte',
        year: `${formattedDate} às ${formattedTime}`,
        type: 'sport',
        status: item.status || 'live',
        isLive: item.status === 'live' || !item.status,
        createdAt: new Date().toISOString()
    };
};

export const api = {
  auth: {
    initialize: async (): Promise<User | null> => {
      try {
        if (!supabase || !supabase.auth) return null;
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) return null;
        try {
            return await api.users.getProfile(data.session.user.id, data.session.user.email!);
        } catch {
            return { id: data.session.user.id, email: data.session.user.email!, name: data.session.user.email!.split('@')[0], role: 'user', subscriptionStatus: 'active' };
        }
      } catch (e) { return null; }
    },
    onAuthStateChange: (callback: (user: User | null) => void) => {
      if (!supabase?.auth) return { data: { subscription: { unsubscribe: () => {} } } };
      return supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (session?.user) {
          const user = await api.users.getProfile(session.user.id, session.user.email!);
          callback(user);
        } else {
          callback(null);
        }
      });
    },
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { user: null, error: error.message };
        const user = await api.users.getProfile(data.user.id, email);
        return { user, error: null };
      } catch (e) { return { user: null, error: "Erro de conexão." }; }
    },
    loginWithGoogle: async () => {
      return await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    },
    register: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (data?.user) await api.users.createProfile(data.user.id, email);
      return { user: null, error: error?.message || null };
    },
    logout: async () => { await supabase.auth.signOut(); }
  },
  users: {
    createProfile: async (id: string, email: string) => {
        try {
            const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
            await supabase.from('profiles').insert([{ id, email, nome: email.split('@')[0], role, status: 'active', created_at: new Date().toISOString() }]);
        } catch (e) {}
    },
    getProfile: async (id: string, email: string): Promise<User | null> => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (error || !data) return { id, email, name: email.split('@')[0], role: 'user', subscriptionStatus: 'active' };
        return { id: data.id, email: data.email, name: data.nome, role: data.role, age: data.idade, avatarUrl: data.avatar_url, subscriptionStatus: data.status || 'active' };
      } catch { return { id, email, name: email.split('@')[0], role: 'user', subscriptionStatus: 'active' }; }
    },
    updateProfile: async (id: string, updates: Partial<User>) => {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.nome = updates.name;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.subscriptionStatus !== undefined) dbUpdates.status = updates.subscriptionStatus;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.age !== undefined) dbUpdates.idade = updates.age;
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
      return !error;
    },
    getAll: async () => {
      try {
          const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          return (data || []).map((p:any) => ({ id: p.id, email: p.email, name: p.nome, role: p.role, subscriptionStatus: p.status || 'active', avatarUrl: p.avatar_url }));
      } catch { return []; }
    },
    deleteUser: async (id: string) => {
       const { error } = await supabase.from('profiles').delete().eq('id', id);
       return !error;
    }
  },

  tmdb: {
      importFromTMDB: async (apiKey: string, type: 'movie'|'tv', pages: number, onProgress: any) => { return 0; },
      getTrending: async (type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week'): Promise<ContentItem[]> => {
          try {
              const res = await fetch(`https://api.themoviedb.org/3/trending/${type}/${timeWindow}?api_key=${TMDB_API_KEY}&language=pt-BR`);
              const data = await res.json();
              return (data.results || []).map((i: any) => mapTMDBToContent(i, type));
          } catch(e) { return []; }
      },
      getPopular: async (type: 'movie' | 'series' | 'anime', page = 1, filters?: { genreId?: string, year?: string }): Promise<ContentItem[]> => {
          try {
              let url = '';
              const tmdbType = type === 'series' ? 'tv' : type === 'anime' ? 'tv' : 'movie';
              
              if (type === 'anime') {
                  url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=16&with_original_language=ja&page=${page}`;
                  if (filters?.year) url += `&first_air_date_year=${filters.year}`;
              } else if (filters?.genreId || filters?.year) {
                   url = `https://api.themoviedb.org/3/discover/${tmdbType}?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&page=${page}`;
                   if (filters.genreId) url += `&with_genres=${filters.genreId}`;
                   if (filters.year) {
                        if (tmdbType === 'movie') url += `&primary_release_year=${filters.year}`;
                        else url += `&first_air_date_year=${filters.year}`;
                   }
              } else {
                  url = `https://api.themoviedb.org/3/${tmdbType}/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
              }
              
              const res = await fetch(url);
              const data = await res.json();
              return (data.results || []).map((i: any) => mapTMDBToContent(i, tmdbType));
          } catch(e) { return []; }
      },
      search: async (query: string, type?: 'movie' | 'series' | 'anime'): Promise<ContentItem[]> => {
          try {
             const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&include_adult=false`);
             const data = await res.json();
             let results = data.results || [];
             
             if (type) {
                 const targetMediaType = type === 'movie' ? 'movie' : 'tv';
                 results = results.filter((i: any) => i.media_type === targetMediaType);
             } else {
                 results = results.filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv');
             }

             return results
                .map((i: any) => mapTMDBToContent(i, i.media_type === 'movie' ? 'movie' : 'tv'))
                .filter((i: ContentItem) => i.posterUrl);
          } catch(e) { return []; }
      },
      getGenres: async (type: 'movie' | 'tv'): Promise<{id: number, name: string}[]> => {
          try {
              const res = await fetch(`https://api.themoviedb.org/3/genre/${type}/list?api_key=${TMDB_API_KEY}&language=pt-BR`);
              const data = await res.json();
              return data.genres || [];
          } catch (e) { return []; }
      },
      getDetails: async (id: string, type: 'movie' | 'tv' | 'anime'): Promise<ContentItem | null> => {
           try {
               const tmdbType = type === 'movie' ? 'movie' : 'tv';
               const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`);
               if (!res.ok) return null;
               const data = await res.json();
               return mapTMDBToContent(data, type);
           } catch(e) { return null; }
      },
      getCredits: async (id: string, type: 'movie' | 'tv' | 'anime') => {
          try {
            const tmdbType = type === 'movie' ? 'movie' : 'tv';
            const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
            const data = await res.json();
            return (data.cast || []).slice(0, 10).map((c:any) => ({
                name: c.name,
                character: c.character,
                profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null
            }));
          } catch (e) { return []; }
      },
      getReviews: async (id: string, type: 'movie' | 'tv' | 'anime') => {
        try {
            const tmdbType = type === 'movie' ? 'movie' : 'tv';
            const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}/reviews?api_key=${TMDB_API_KEY}`);
            const data = await res.json();
            return (data.results || []).slice(0, 5).map((r:any) => ({
                author: r.author,
                content: r.content,
                rating: r.author_details?.rating
            }));
        } catch (e) { return []; }
      },
      getSeasons: async (tvId: string, seasonNumber: number): Promise<Episode[]> => {
          try {
              const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`);
              const data = await res.json();
              if (!data.episodes) return [];
              return data.episodes.map((ep: any) => ({
                  id: String(ep.id),
                  serieId: tvId,
                  title: ep.name,
                  season: seasonNumber,
                  number: ep.episode_number,
                  videoUrl: `${PLAYER_API_BASE}/tv/${tvId}/${seasonNumber}/${ep.episode_number}` 
              }));
          } catch (e) { return []; }
      }
  },

  live: {
      getChannels: async (category?: string): Promise<ContentItem[]> => {
          const url = category 
            ? `${REIDOSCANAIS_API}/channels?category=${encodeURIComponent(category)}`
            : `${REIDOSCANAIS_API}/channels`;
          try {
              const items = await fetchWithCors(url);
              return items.map(mapChannelToContent);
          } catch (e) { return []; }
      },
      getCategories: async (): Promise<string[]> => {
          try {
              const items = await fetchWithCors(`${REIDOSCANAIS_API}/channels/categories`);
              return items.map((i: any) => typeof i === 'string' ? i : i.name || i.category || 'Outros');
          } catch (e) { return []; }
      },
      getSports: async (category?: string, status?: string): Promise<ContentItem[]> => {
          let url = `${REIDOSCANAIS_API}/sports`;
          const params = new URLSearchParams();
          if (category) params.append('category', category);
          if (status) params.append('status', status);
          if (params.toString()) url += `?${params.toString()}`;
          try {
              const items = await fetchWithCors(url);
              return items.map(mapSportToContent);
          } catch (e) { return []; }
      },
      getSportsCategories: async (): Promise<string[]> => {
          try {
              const items = await fetchWithCors(`${REIDOSCANAIS_API}/sports/categories`);
              return items.map((i: any) => typeof i === 'string' ? i : i.name || i.category || 'Outros');
          } catch (e) { return []; }
      }
  },

  content: {
    getMovies: async () => api.tmdb.getTrending('movie'),
    getSeries: async () => api.tmdb.getTrending('tv'),
    getAll: async () => [], 
    getEpisodes: async (id: string) => api.tmdb.getSeasons(id, 1),
    addContent: async (i: any) => { return ''; },
    updateContent: async (id: string, updates: any, type: string) => { return true; },
    deleteContent: async (id: string, type: string) => { return true; },
    addEpisode: async (episode: any) => { return true; },
    deleteEpisode: async (id: string) => { return true; },
  },

  storage: {
    uploadFile: async (file: File, bucket: string) => {
      try {
          const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
          const { error } = await supabase.storage.from(bucket).upload(fileName, file);
          if (error) throw new Error("Falha no upload.");
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
          return data.publicUrl;
      } catch (e) { return ''; }
    }
  }
};