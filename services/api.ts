import { createClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, ContentItem } from '../types';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://vgscgajduffmicbbuvxj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E3rCZG9u6RgQGWLS6ud_0g_wxJraAbi';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---

// Map Supabase DB snake_case to App camelCase
const mapContentFromDB = (item: any, type: 'movie' | 'series'): ContentItem => ({
  id: item.id,
  title: item.titulo,
  description: item.descricao || '',
  posterUrl: item.url_poster,
  videoUrl: item.url_video,
  genre: item.genero,
  year: item.ano,
  type: type,
  createdAt: item.created_at
});

// Map App camelCase to Supabase DB snake_case
const mapContentToDB = (item: Partial<ContentItem>) => ({
  titulo: item.title,
  descricao: item.description,
  url_poster: item.posterUrl,
  url_video: item.videoUrl,
  genero: item.genre,
  ano: item.year,
});

// Map Supabase User to App User
const mapUser = (sbUser: SupabaseUser | null): User | null => {
  if (!sbUser) return null;
  // Simple check: if email contains 'admin', grant admin role (basic implementation)
  // In a production app, use 'public.users' table or App Metadata
  const role = sbUser.email?.includes('admin') ? 'admin' : 'user';
  
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Usuário',
    role: role
  };
};

export const api = {
  auth: {
    initialize: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      return mapUser(session?.user || null);
    },

    onAuthStateChange: (callback: (user: User | null) => void) => {
      return supabase.auth.onAuthStateChange((_event, session) => {
        callback(mapUser(session?.user || null));
      });
    },

    login: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: error.message };
      return { user: mapUser(data.user), error: null };
    },
    
    register: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      });
      if (error) return { user: null, error: error.message };
      return { user: mapUser(data.user), error: null };
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    // Warning: This is now async in nature, used primarily for synchronous checks where we have local state
    getCurrentUser: (): User | null => {
      // This is a fallback. The App component should hold the source of truth via state.
      return null; 
    }
  },

  content: {
    getAll: async (): Promise<ContentItem[]> => {
      const { data: movies } = await supabase.from('filmes').select('*');
      const { data: series } = await supabase.from('series').select('*');
      
      const mappedMovies = (movies || []).map(m => mapContentFromDB(m, 'movie'));
      const mappedSeries = (series || []).map(s => mapContentFromDB(s, 'series'));
      
      return [...mappedMovies, ...mappedSeries];
    },

    getMovies: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase.from('filmes').select('*');
      if (error) {
        console.error("Error fetching movies:", error);
        return [];
      }
      return (data || []).map(m => mapContentFromDB(m, 'movie'));
    },

    getSeries: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase.from('series').select('*');
      if (error) {
        console.error("Error fetching series:", error);
        return [];
      }
      return (data || []).map(s => mapContentFromDB(s, 'series'));
    },

    addContent: async (item: ContentItem): Promise<boolean> => {
      const table = item.type === 'movie' ? 'filmes' : 'series';
      const dbItem = mapContentToDB(item);
      
      const { error } = await supabase.from(table).insert([dbItem]);
      
      if (error) {
        console.error(`Error adding ${item.type}:`, error);
        throw new Error(error.message);
      }
      return true;
    },

    deleteContent: async (id: string, type: 'movie' | 'series'): Promise<boolean> => {
      const table = type === 'movie' ? 'filmes' : 'series';
      const { error } = await supabase.from(table).delete().eq('id', id);
      
      if (error) {
        console.error("Error deleting item:", error);
        return false;
      }
      return true;
    }
  }
};