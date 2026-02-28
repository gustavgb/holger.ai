export interface Bookmark {
  id: number;
  url: string;
  title: string;
  note: string;
  tags: string[];
  summary: string;
  lastUpdated: string;
}

export interface Data {
  idCounter: number;
  bookmarks: Bookmark[];
}

export const EMPTY_DATA: Data = {
  idCounter: 0,
  bookmarks: [],
};
