export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  videoUrl?: string; // For movies or episodes
  genre: string;
  year: number;
  type: 'movie' | 'series';
  createdAt: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  title: string;
  season: number;
  number: number;
  videoUrl: string;
}

export interface Ad {
  id: string;
  url: string; // Image or short video URL
  duration: number; // in seconds
}
