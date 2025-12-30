
import { createClient } from '@supabase/supabase-js';
import { User, ContentItem, Episode } from '../types';

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://vgscgajduffmicbbuvxj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E3rCZG9u6RgQGWLS6ud_0g_wxJraAbi';
const TMDB_API_KEY = 'd6cdd588a4405dad47a55194c1efa29c'; 
const REIDOSCANAIS_API = 'https://api.reidoscanais.io';
const PLAYER_API_BASE = "https://playerflixapi.com";

let supabase: any;

const createMockClient = (errorMsg: string) => ({
    auth: {
        getSession: async () => ({ data: { session: null }, error: errorMsg }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: "Erro de Conexão" } }),
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
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    supabase = createMockClient("Cliente inválido");
}

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

const extractArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.channels && Array.isArray(data.channels)) return data.channels;
    if (data.sports && Array.isArray(data.sports)) return data.sports;
    if (data.events && Array.isArray(data.events)) return data.events;
    if (data.matches && Array.isArray(data.matches)) return data.matches;
    return [];
};

const fetchWithCors = async (url: string) => {
    const cacheBuster = (u: string) => `${u}${u.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const tryFetch = async (targetUrl: string) => {
        try {
            const res = await fetch(targetUrl);
            if (!res.ok) return null;
            return await res.json();
        } catch { return null; }
    };

    let data = await tryFetch(cacheBuster(url));
    if (!data) data = await tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(cacheBuster(url))}`);
    if (!data) data = await tryFetch(`https://corsproxy.io/?${encodeURIComponent(cacheBuster(url))}`);
    
    return extractArray(data);
};

const findStreamDeep = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') {
        const s = obj.trim();
        if (s.includes('iframe') && s.includes('src=')) {
            const match = s.match(/src=['"](.*?)['"]/);
            return match ? match[1] : '';
        }
        if (s.startsWith('http') && (s.includes('.m3u8') || s.includes('stream') || s.includes('player'))) return s;
        return '';
    }
    const keys = ['embed_url', 'stream_url', 'url', 'link', 'm3u8', 'iframe', 'player'];
    for (const key of keys) {
        if (obj[key]) {
            const found = findStreamDeep(obj[key]);
            if (found) return found;
        }
    }
    return '';
};

// Fixed type mapping for TMDB content to match ContentItem interface
const mapTMDBToContent = (item: any, type: 'movie' | 'tv' | 'anime'): ContentItem => {
    return {
        id: String(item.id),
        tmdbId: item.id,
        title: item.title || item.name,
        description: item.overview || 'Sinopse indisponível.',
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
        videoUrl: type === 'movie' ? `${PLAYER_API_BASE}/movie/${item.id}` : '', 
        genre: getGenreName(item.genre_ids),
        year: (item.release_date || item.first_air_date || '2024').substring(0, 4),
        type: type === 'tv' ? 'series' : type,
        createdAt: new Date().toISOString()
    };
};

export const api = {
  auth: {
    initialize: async (): Promise<User | null> => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) return null;
        return await api.users.getProfile(data.session.user.id, data.session.user.email!);
      } catch { return null; }
    },
    onAuthStateChange: (callback: (user: User | null) => void) => {
      return supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (session?.user) {
          callback(await api.users.getProfile(session.user.id, session.user.email!));
        } else { callback(null); }
      });
    },
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: error.message };
      return { user: await api.users.getProfile(data.user.id, email), error: null };
    },
    loginWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
    register: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (data?.user) await api.users.createProfile(data.user.id, email);
      return { user: null, error: error?.message || null };
    },
    logout: () => supabase.auth.signOut()
  },
  users: {
    createProfile: async (id: string, email: string) => {
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
        await supabase.from('profiles').insert([{ id, email, nome: email.split('@')[0], role, status: 'active' }]);
    },
    getProfile: async (id: string, email: string): Promise<User | null> => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (!data) return { id, email, name: email.split('@')[0], role: 'user', subscriptionStatus: 'active' };
      return { id: data.id, email: data.email, name: data.nome, role: data.role, age: data.idade, avatarUrl: data.avatar_url, subscriptionStatus: data.status || 'active' };
    },
    updateProfile: async (id: string, updates: Partial<User>) => {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.nome = updates.name;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.subscriptionStatus) dbUpdates.status = updates.subscriptionStatus;
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
      return !error;
    },
    getAll: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return (data || []).map((p:any) => ({ id: p.id, email: p.email, name: p.nome, role: p.role, subscriptionStatus: p.status || 'active' }));
    },
    deleteUser: (id: string) => supabase.from('profiles').delete().eq('id', id)
  },
  tmdb: {
      getTrending: async (type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week') => {
          const res = await fetch(`https://api.themoviedb.org/3/trending/${type}/${timeWindow}?api_key=${TMDB_API_KEY}&language=pt-BR`);
          const data = await res.json();
          // Fixed type mapping call: pass 'tv' instead of 'series'
          return (data.results || []).map((i: any) => mapTMDBToContent(i, type === 'movie' ? 'movie' : 'tv'));
      },
      getPopular: async (type: 'movie' | 'series' | 'anime', page = 1) => {
          let url = '';
          if (type === 'anime') {
              url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=16&with_original_language=ja&page=${page}`;
          } else {
              const tmdbType = type === 'movie' ? 'movie' : 'tv';
              url = `https://api.themoviedb.org/3/${tmdbType}/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
          }
          const res = await fetch(url);
          const data = await res.json();
          // Fixed type mapping call: map 'series' to 'tv'
          return (data.results || []).map((i: any) => mapTMDBToContent(i, type === 'series' ? 'tv' : type));
      },
      search: async (query: string) => {
          const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${query}`);
          const data = await res.json();
          // Fixed type mapping call: pass 'tv' instead of 'series'
          return (data.results || []).filter((i: any) => i.media_type !== 'person').map((i: any) => mapTMDBToContent(i, i.media_type === 'movie' ? 'movie' : 'tv'));
      },
      getDetails: async (id: string, type: 'movie' | 'tv' | 'anime') => {
          const tmdbType = type === 'movie' ? 'movie' : 'tv';
          const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`);
          // Fixed type mapping call: pass 'tv' instead of 'series'
          return res.ok ? mapTMDBToContent(await res.json(), type === 'movie' ? 'movie' : type === 'anime' ? 'anime' : 'tv') : null;
      },
      getCredits: async (id: string, type: 'movie' | 'tv' | 'anime') => {
        const tmdbType = type === 'movie' ? 'movie' : 'tv';
        const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const data = await res.json();
        return (data.cast || []).slice(0, 10).map((c:any) => ({ name: c.name, character: c.character, profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null }));
      },
      getReviews: async (id: string, type: 'movie' | 'tv' | 'anime') => {
        const tmdbType = type === 'movie' ? 'movie' : 'tv';
        const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}/reviews?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        return (data.results || []).slice(0, 5).map((r:any) => ({ author: r.author, content: r.content, rating: r.author_details?.rating }));
      },
      getSeasons: async (tvId: string, seasonNumber: number) => {
          const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`);
          const data = await res.json();
          return (data.episodes || []).map((ep: any) => ({ id: String(ep.id), title: ep.name, season: seasonNumber, number: ep.episode_number, videoUrl: `${PLAYER_API_BASE}/tv/${tvId}/${seasonNumber}/${ep.episode_number}` }));
      },
      importFromTMDB: async (apiKey: string, type: 'movie' | 'tv', pages: number, onProgress: any) => {
          let totalImported = 0;
          for (let page = 1; page <= pages; page++) {
              const res = await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=${apiKey}&language=pt-BR&page=${page}`);
              if (!res.ok) break;
              const data = await res.json();
              for (const item of (data.results || [])) {
                  totalImported++;
                  onProgress(totalImported, pages * 20, item.title || item.name);
              }
          }
          return totalImported;
      }
  },
  live: {
      getChannels: async (category?: string) => {
          const url = category ? `${REIDOSCANAIS_API}/channels?category=${encodeURIComponent(category)}` : `${REIDOSCANAIS_API}/channels`;
          const items = await fetchWithCors(url);
          return items.map(c => ({
              id: String(c.id),
              title: c.name || c.title,
              description: 'TV Ao Vivo',
              posterUrl: c.logo || c.image || 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=200',
              videoUrl: findStreamDeep(c),
              genre: c.category || 'TV',
              year: 'AO VIVO',
              type: 'channel',
              isLive: true,
              createdAt: new Date().toISOString()
          }));
      },
      getCategories: () => fetchWithCors(`${REIDOSCANAIS_API}/channels/categories`).then(items => items.map(i => typeof i === 'string' ? i : i.name)),
      getSports: async (category?: string, status?: string): Promise<ContentItem[]> => {
          let url = `${REIDOSCANAIS_API}/sports`;
          const params = new URLSearchParams();
          if (category) params.append('category', category);
          if (status) params.append('status', status);
          if (params.toString()) url += `?${params.toString()}`;
          
          const items = await fetchWithCors(url);
          return items.map(item => {
              const date = item.start_time ? new Date(item.start_time) : new Date();
              return {
                  id: String(item.id || Math.random()),
                  title: item.title || item.name || `${item.home_team} vs ${item.away_team}`,
                  description: item.category || 'Transmissão Esportiva',
                  posterUrl: item.poster || item.image || item.logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=500',
                  videoUrl: findStreamDeep(item),
                  genre: item.category || 'Esporte',
                  year: `${date.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} ${date.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`,
                  type: 'sport',
                  isLive: true,
                  createdAt: new Date().toISOString()
              };
          });
      },
      getSportsCategories: () => fetchWithCors(`${REIDOSCANAIS_API}/sports/categories`).then(items => items.map(i => typeof i === 'string' ? i : i.name))
  },
  content: {
    getMovies: () => api.tmdb.getTrending('movie'),
    getSeries: () => api.tmdb.getTrending('tv'),
    getAnimes: () => api.tmdb.getPopular('anime'),
    getEpisodes: (id: string) => api.tmdb.getSeasons(id, 1),
    // Updated mock functions to accept required arguments
    addContent: async (item: ContentItem) => true,
    updateContent: async (id: string, updates: Partial<ContentItem>, type?: 'movie' | 'series') => true,
    deleteContent: async (id: string, type?: 'movie' | 'series') => true,
    addEpisode: async (episode: any) => true,
    deleteEpisode: async (id: string) => true,
  },
  storage: {
    uploadFile: async (file: File, bucket: string) => {
        const fileName = `${Date.now()}_${file.name}`;
        await supabase.storage.from(bucket).upload(fileName, file);
        return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    }
  }
};
