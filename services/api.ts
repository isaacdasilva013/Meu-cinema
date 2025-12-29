
import { createClient } from '@supabase/supabase-js';
import { User, ContentItem, Episode } from '../types';

const SUPABASE_URL = 'https://vgscajduffmicbbuvxj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E3rCZG9u6RgQGWLS6ud_0g_wxJraAbi';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WATCHMODE_API_KEY = 'zleHlQKjhqmnQnfSMpVh1ql8kMdMKz3WVdgWXbrt'; 
const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1';

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
];

const getRandomVideo = () => SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];

const mapContentFromDB = (item: any, type: 'movie' | 'series'): ContentItem => ({
  id: item.id || Math.random().toString(),
  title: item.titulo || item.title,
  description: item.descricao || item.plot_overview || 'Sem sinopse disponível.',
  posterUrl: item.url_poster || item.poster,
  backdropUrl: item.url_backdrop || item.backdrop || item.url_poster || item.poster,
  videoUrl: item.url_video || (type === 'movie' ? getRandomVideo() : ''),
  genre: item.genero || (item.genre_names ? item.genre_names[0] : 'Geral'),
  year: item.ano || item.year || 2024,
  type: type,
  createdAt: item.created_at || new Date().toISOString()
});

export const api = {
  auth: {
    initialize: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      return api.users.getProfile(session.user.id, session.user.email!);
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: error.message };
      const user = await api.users.getProfile(data.user.id, email);
      return { user, error: null };
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
      } catch {
        return { id, email, name: email.split('@')[0], role: 'user', subscriptionStatus: 'active' };
      }
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
  content: {
    // BUSCA DIRETA DA API (CASO O SUPABASE FALHE OU ESTEJA VAZIO)
    fetchFromWatchmode: async (): Promise<ContentItem[]> => {
      console.log("Buscando diretamente da Watchmode...");
      try {
        const response = await fetch(`${WATCHMODE_BASE_URL}/list-titles/?apiKey=${WATCHMODE_API_KEY}&limit=15&sort_by=popularity_desc`);
        const data = await response.json();
        
        if (!data.titles) return [];

        const detailedItems = await Promise.all(
          data.titles.slice(0, 12).map(async (item: any) => {
            await new Promise(r => setTimeout(r, 200)); // Pequeno delay para evitar rate limit
            const res = await fetch(`${WATCHMODE_BASE_URL}/title/${item.id}/details/?apiKey=${WATCHMODE_API_KEY}`);
            return res.json();
          })
        );

        return detailedItems
          .filter(d => d.poster)
          .map(d => mapContentFromDB(d, d.type === 'movie' ? 'movie' : 'series'));
      } catch (e) {
        console.error("Erro Watchmode direta:", e);
        return [];
      }
    },

    getMovies: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase.from('filmes').select('*');
      if (error || !data || data.length === 0) return [];
      return data.map(m => mapContentFromDB(m, 'movie'));
    },
    getSeries: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase.from('series').select('*');
      if (error || !data || data.length === 0) return [];
      return data.map(s => mapContentFromDB(s, 'series'));
    },
    getAll: async () => {
      const [m, s] = await Promise.all([api.content.getMovies(), api.content.getSeries()]);
      const combined = [...m, ...s];
      if (combined.length === 0) {
        return await api.content.fetchFromWatchmode();
      }
      return combined;
    },
    addContent: async (item: ContentItem) => {
      const table = item.type === 'movie' ? 'filmes' : 'series';
      const payload = {
        titulo: item.title,
        descricao: item.description,
        url_poster: item.posterUrl,
        url_backdrop: item.backdropUrl,
        url_video: item.videoUrl,
        genero: item.genre,
        ano: item.year
      };
      const { data, error } = await supabase.from(table).insert([payload]).select();
      if (error) console.warn("Erro ao salvar no Supabase (ignorando):", error.message);
      return data?.[0]?.id || null;
    },
    deleteContent: async (id: string, type: 'movie' | 'series') => {
      const table = type === 'movie' ? 'filmes' : 'series';
      const { error } = await supabase.from(table).delete().eq('id', id);
      return !error;
    },
    getEpisodes: async (serieId: string): Promise<Episode[]> => {
      const { data } = await supabase.from('episodios').select('*').eq('serie_id', serieId).order('temporada').order('numero');
      return (data || []).map(e => ({ id: e.id, serieId: e.serie_id, title: e.titulo, season: e.temporada, number: e.numero, videoUrl: e.url_video }));
    },
    addEpisode: async (ep: Omit<Episode, 'id'>) => {
      await supabase.from('episodios').insert([{ serie_id: ep.serieId, titulo: ep.title, temporada: ep.season, numero: ep.number, url_video: ep.videoUrl }]);
      return true;
    },
    deleteEpisode: async (id: string) => {
      const { error } = await supabase.from('episodios').delete().eq('id', id);
      return !error;
    },
    populateDemoContent: async () => {
       const data = await api.content.fetchFromWatchmode();
       for (const item of data) {
         await api.content.addContent(item);
       }
       return true;
    }
  },
  storage: {
    uploadFile: async (file: File, bucket: string) => {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    }
  }
};
