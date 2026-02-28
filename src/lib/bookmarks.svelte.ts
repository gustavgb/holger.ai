import { Bookmark } from "./types";

class BookmarkStore {
  activeBookmark = $state<Bookmark | null>(null);
  addDialogOpen = $state(false);

  showAddDialog = () => this.addDialogOpen = true;
  hideAddDialog = () => this.addDialogOpen = false;
}

export const bookmarks = new BookmarkStore();