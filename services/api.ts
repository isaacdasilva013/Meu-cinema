
import { createClient } from '@supabase/supabase-js';
import { User, ContentItem, Episode } from '../types';

// CONFIGURAÇÃO DO SUPABASE (Apenas para Auth agora)
const SUPABASE_URL = 'https://vgscgajduffmicbbuvxj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E3rCZG9u6RgQGWLS6ud_0g_wxJraAbi';
const TMDB_API_KEY = 'd6cdd588a4405dad47a55194c1efa29c'; // Chave TMDB

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  db: { schema: 'public' },
});

// BASE URL DA PLAYER API
// Ajustado para garantir funcionamento. Muitas vezes APIs de embed precisam de estrutura especifica.
const PLAYER_API_BASE = "https://playerflixapi.com";

// GENRE MAP (TMDB IDs -> String)
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

// Helper CRÍTICO: Converte dados do TMDB para nosso formato e GERA OS LINKS
const mapTMDBToContent = (item: any, type: 'movie' | 'tv'): ContentItem => {
    const isMovie = type === 'movie';
    const tmdbId = item.id;
    
    // GERAÇÃO DO LINK DO FILME
    // Se for série, DEIXAR VAZIO. Isso impede que o botão "Assistir" apareça na página de detalhes.
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
        type: isMovie ? 'movie' : 'series',
        createdAt: new Date().toISOString()
    };
};

export const api = {
  auth: {
    initialize: async (): Promise<User | null> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;
        return api.users.getProfile(session.user.id, session.user.email!);
      } catch (e) { return null; }
    },
    onAuthStateChange: (callback: (user: User | null) => void) => {
      return supabase.auth.onAuthStateChange(async (_event, session) => {
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
      if (data.user) await api.users.createProfile(data.user.id, email);
      return { user: null, error: error?.message || null };
    },
    logout: async () => { await supabase.auth.signOut(); }
  },
  users: {
    createProfile: async (id: string, email: string) => {
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
        await supabase.from('profiles').insert([{ id, email, nome: email.split('@')[0], role, status: 'active', created_at: new Date().toISOString() }]);
    },
    getProfile: async (id: string, email: string): Promise<User | null> => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (!data) return { id, email, name: email.split('@')[0], role: 'user', subscriptionStatus: 'active' };
        return { id: data.id, email: data.email, name: data.nome, role: data.role, age: data.idade, avatarUrl: data.avatar_url, subscriptionStatus: data.status || 'active' };
      } catch { return { id, email, name: email.split('@')[0], role: 'user', subscriptionStatus: 'active' }; }
    },
    updateProfile: async (id: string, updates: Partial<User>) => {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.nome = updates.name;
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
      return !error;
    },
    getAll: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return (data || []).map(p => ({ id: p.id, email: p.email, name: p.nome, role: p.role, subscriptionStatus: p.status || 'active' }));
    },
    deleteUser: async (id: string) => {
       const { error } = await supabase.from('profiles').delete().eq('id', id);
       return !error;
    }
  },

  // --- NOVA CAMADA DE CONTEÚDO (DIRETO DO TMDB) ---
  tmdb: {
      importFromTMDB: async (apiKey: string, type: 'movie'|'tv', pages: number, onProgress: any) => { return 0; },

      getTrending: async (type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week'): Promise<ContentItem[]> => {
          try {
              const res = await fetch(`https://api.themoviedb.org/3/trending/${type}/${timeWindow}?api_key=${TMDB_API_KEY}&language=pt-BR`);
              const data = await res.json();
              return (data.results || []).map((i: any) => mapTMDBToContent(i, type));
          } catch(e) { return []; }
      },

      getByGenre: async (type: 'movie' | 'tv', genreId: number, page = 1): Promise<ContentItem[]> => {
          try {
              const res = await fetch(`https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=${genreId}&sort_by=popularity.desc&page=${page}&include_adult=false`);
              const data = await res.json();
              return (data.results || []).map((i: any) => mapTMDBToContent(i, type));
          } catch(e) { return []; }
      },

      getPopular: async (type: 'movie' | 'tv', page = 1): Promise<ContentItem[]> => {
          try {
              const res = await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`);
              const data = await res.json();
              return (data.results || []).map((i: any) => mapTMDBToContent(i, type));
          } catch(e) { return []; }
      },
      
      search: async (query: string): Promise<ContentItem[]> => {
          try {
             const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${query}&include_adult=false`);
             const data = await res.json();
             return (data.results || [])
                .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
                .map((i: any) => mapTMDBToContent(i, i.media_type === 'movie' ? 'movie' : 'tv'))
                .filter((i: ContentItem) => i.posterUrl);
          } catch(e) { return []; }
      },

      getDetails: async (id: string, type: 'movie' | 'tv'): Promise<ContentItem | null> => {
           try {
               const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`);
               if (!res.ok) return null;
               const data = await res.json();
               return mapTMDBToContent(data, type);
           } catch(e) { return null; }
      },
      
      getCredits: async (id: string, type: 'movie' | 'tv') => {
          try {
            const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
            const data = await res.json();
            return (data.cast || []).slice(0, 10).map((c:any) => ({
                name: c.name,
                character: c.character,
                profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null
            }));
          } catch (e) { return []; }
      },

      getReviews: async (id: string, type: 'movie' | 'tv') => {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/reviews?api_key=${TMDB_API_KEY}`);
            const data = await res.json();
            return (data.results || []).slice(0, 5).map((r:any) => ({
                author: r.author,
                content: r.content,
                rating: r.author_details?.rating
            }));
        } catch (e) { return []; }
      },

      // Episódios (Para Séries) - Gera link PlayerFlix para cada episódio
      // Formato: https://playerflixapi.com/tv/{id}/{season}/{episode}
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
                  // GERAÇÃO AUTOMÁTICA DE LINK DA PLAYERFLIX PARA EPISÓDIOS
                  videoUrl: `${PLAYER_API_BASE}/tv/${tvId}/${seasonNumber}/${ep.episode_number}` 
              }));
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
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw new Error("Falha no upload.");
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    }
  }
};
