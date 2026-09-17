/**
 * Mentorini Core Type Definitions
 * Peer-Mentorship for the Tunisian IT Ecosystem
 */

export type Category = 
  | 'kolchay'
  | 'bac_info'
  | 'fac_prep'
  | 'web_mobile'
  | 'devops_cloud'
  | 'data_ai';

export interface CategoryInfo {
  id: Category;
  label: string;
  subLabel: string;
  iconName: string;
}

export interface Mentor {
  id: string;
  name: string;
  status: string; // e.g., "Bac Info Major 2024 -> GL @ INSAT" or "Software Engineer @ Startup"
  whatsappNumber: string; // international format without + or spaces (e.g. 21698123456)
  youtubeUrl: string; // original link
  youtubeVideoId: string; // extracted video ID for embed
  bio: string; // freeform description with URLs for resources, drive, github, notes
  category: Category;
  tags: string[];
  isFlagship?: boolean; // Founder's flagship profile
  feynmanTopic: string; // Concept explained in the video
  createdAt: string;
}

export interface MentorFormData {
  name: string;
  status: string;
  whatsappNumber: string;
  youtubeUrl: string;
  bio: string;
  category: Category;
  feynmanTopic: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';
