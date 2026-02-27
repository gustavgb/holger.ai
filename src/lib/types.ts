export interface Bookmark {
  id: number;
  url: string;
  title: string;
  note: string;
  tags: string[];
  lastUpdated: string;
}

export interface Project {
  id: number;
  title: string;
  note: string;
  bookmarks: number[]; // bookmark IDs
  lastUpdated: string;
}

export interface Data {
  idCounter: number;
  projects: Project[];
  bookmarks: Bookmark[];
}

export const EMPTY_DATA: Data = {
  idCounter: 0,
  projects: [],
  bookmarks: [],
};
