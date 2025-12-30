
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked' | 'pending_payment';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  age?: number;
  avatarUrl?: string;
  subscriptionStatus: UserStatus;
}

export interface Embed {
  provider: string;
  quality: string;
  embed_url: string;
}

export interface ContentItem {
  id: string;
  tmdbId?: number;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  videoUrl?: string;
  genre: string;
  year: number | string;
  type: 'movie' | 'series' | 'channel' | 'sport' | 'anime';
  isLive?: boolean;
  status?: 'upcoming' | 'live' | 'ended';
  createdAt: string;
}

export interface Episode {
  id: string;
  serieId: string;
  title: string;
  season: number;
  number: number;
  videoUrl: string;
}

export interface Ad {
  id: string;
  url: string;
  duration: number;
}
