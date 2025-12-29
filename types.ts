
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

export interface ContentItem {
  id: string;
  tmdbId?: number; // ID para integração com PlayerFlix
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  videoUrl?: string;
  genre: string;
  year: number;
  type: 'movie' | 'series';
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
