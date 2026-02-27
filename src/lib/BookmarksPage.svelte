<script lang="ts">
  import { store } from "./store.svelte";
  import BookmarkPanel from "./BookmarkPanel.svelte";
  import AddBookmarkDialog from "./AddBookmarkDialog.svelte";
  import type { Bookmark } from "./types";
  import { fuzzyScore } from "./utils";

  let search = $state("");
  let activeBookmark = $state<Bookmark | null>(null);
  let showAddDialog = $state(false);

  const filtered = $derived.by(() => {
    const q = search.trim();
    if (!q) return store.sortedBookmarks;
    return store.sortedBookmarks
      .map((b) => ({
        b,
        score: Math.max(
          fuzzyScore(q, b.title) * 3,
          fuzzyScore(q, b.url) * 2,
          ...b.tags.map((t) => fuzzyScore(q, t) * 2.5),
          fuzzyScore(q, b.note),
          fuzzyScore(q, String(b.id)),
        ),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.b);
  });

  async function handleAdd(url: string) {
    showAddDialog = false;
    if (!store.filePath) {
      await store.saveAs();
      if (!store.filePath) return;
    }
    const bookmark = store.addBookmark({
      url,
      title: "",
      note: "",
      tags: [],
      summary: "",
    });
    activeBookmark = bookmark;
    await store.save();
  }
</script>

<!-- Toolbar -->
<div
  class="flex items-center gap-2 px-3 py-2 border-b border-base-300 shrink-0"
>
  <input
    type="search"
    bind:value={search}
    placeholder="Search bookmarks…"
    class="input input-sm flex-1 min-w-0"
  />
  <button
    class="btn btn-sm btn-primary shrink-0"
    onclick={() => (showAddDialog = true)}>+ Add</button
  >
</div>

<!-- Split pane -->
<div class="flex flex-1 overflow-hidden">
  <!-- List -->
  <div
    class="flex flex-col overflow-y-auto border-r border-base-300"
    style="width: 300px; min-width: 220px;"
  >
    {#if filtered.length === 0 && store.filePath}
      <div class="py-12 px-4 text-center text-base-content/60 text-sm">
        {search
          ? "No results."
          : "No bookmarks yet. Click + Add to get started."}
      </div>
    {/if}
    {#each filtered as b (b.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="px-3 py-3 border-b border-base-300 cursor-pointer transition-colors hover:bg-base-200 {activeBookmark?.id ===
        b.id
          ? 'bg-base-200'
          : ''}"
        onclick={() => (activeBookmark = b)}
      >
        <div class="flex items-baseline gap-1.5 mb-1 flex-wrap">
          <span class="text-xs text-base-content/50 font-mono shrink-0"
            >#{b.id}</span
          >
          <span class="text-sm font-medium flex-1 min-w-0 truncate"
            >{b.title || "(untitled)"}</span
          >
        </div>
        {#if b.tags.length > 0}
          <div class="flex flex-wrap gap-1 mb-2">
            {#each b.tags as tag}
              <span class="badge badge-outline badge-xs">{tag}</span>
            {/each}
          </div>
        {/if}
        <div class="text-xs text-primary font-mono truncate opacity-70 mb-1">
          {b.url}
        </div>
        {#if b.note}
          <div
            class="text-xs text-base-content/50 mt-1 line-clamp-3 whitespace-pre-wrap"
          >
            {b.note}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Detail panel -->
  <div class="flex-1 overflow-hidden">
    {#if activeBookmark}
      {#key activeBookmark.id}
        <BookmarkPanel
          bookmark={store.data.bookmarks.find(
            (b) => b.id === activeBookmark!.id,
          ) ?? activeBookmark}
          onclose={() => (activeBookmark = null)}
        />
      {/key}
    {:else}
      <div
        class="h-full flex items-center justify-center text-base-content/40 text-sm"
      >
        Select a bookmark to view it
      </div>
    {/if}
  </div>
</div>

{#if showAddDialog}
  <AddBookmarkDialog
    onconfirm={handleAdd}
    oncancel={() => (showAddDialog = false)}
  />
{/if}

<style></style>
