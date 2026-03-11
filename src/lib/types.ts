export interface BookmarkSection {
  heading: string;
  body: string;
}

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  tags: string[];
  mtime: number;
  date: string;
  sections: BookmarkSection[];
}

export interface WorkspaceFile {
  idCounter: number;
  quickPrompts: QuickPrompt[];
  idPrefix: string;
}

export const NEW_WORKSPACE: WorkspaceFile = {
  idCounter: 0,
  quickPrompts: [],
  idPrefix: "",
};

export type AIPrompt = {
  title: string;
  promptTemplate: string;
};

export type QuickPrompt = AIPrompt & {
  label: string;
  labelFetching: string;
};
