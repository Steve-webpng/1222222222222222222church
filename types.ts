export enum Page {
  HOME = 'HOME',
  SERMONS = 'SERMONS',
  EVENTS = 'EVENTS',
  MEETINGS = 'MEETINGS',
  PRAYER = 'PRAYER',
  GIVING = 'GIVING',
  ADMIN = 'ADMIN',
  SEARCH = 'SEARCH'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  MODERATOR = 'MODERATOR',
  FINANCE = 'FINANCE',
  GUEST = 'GUEST'
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  description: string;
  imageUrl: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface Meeting {
  id: string;
  title: string;
  host: string;
  startTime: string;
  participants: number;
}

export interface PrayerRequest {
  id: string;
  name: string;
  content: string;
  status: 'PENDING' | 'APPROVED';
  aiResponse?: string;
  date: string;
}

export interface Donation {
  id: string;
  name: string;
  email: string;
  amount: number;
  date: string;
}

export interface SearchResult {
  id: string;
  type: 'SERMON' | 'EVENT' | 'MEETING';
  title: string;
  description: string;
  score: number; // For ranking
}