<script lang="ts">
  import Editor from "./Editor.svelte";
  import type { Project, Bookmark } from "./types";
  import { store } from "./store.svelte";
  import { confirm } from "@tauri-apps/plugin-dialog";

  interface Props {
    project: Project;
    onclose: () => void;
  }

  let { project, onclose }: Props = $props();

  // svelte-ignore state_referenced_locally
  let title = $state(project.title);
  // svelte-ignore state_referenced_locally
  let note = $state(project.note);
  let bookmarkSearch = $state("");
  let searchFocused = $state(false);

  // Auto-save (1.5 s debounced) — only when project is actually saved
  $effect(() => {
    const _t = title,
      _n = note; // track deps
    if (!store.filePath) return;
    const timer = setTimeout(() => save(), 1500);
    return () => clearTimeout(timer);
  });

  function save() {
    store.updateProject({ ...project, title, note });
    if (store.filePath) store.save();
  }

  async function deleteProject() {
    const confirmation = await confirm(
      "Delete project? This cannot be undone!",
      { title: "Delete project?", kind: "warning" },
    );

    if (!confirmation) return;

    store.deleteProject(project.id);
    if (store.filePath) store.save();
    onclose();
  }

  // Bookmarks attached to this project
  const attachedBookmarks = $derived(
    project.bookmarks
      .map((id) => store.data.bookmarks.find((b) => b.id === id))
      .filter((b): b is Bookmark => b !== undefined),
  );

  // Fuzzy search for adding bookmarks
  function fuzzyMatch(query: string, target: string): boolean {
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    if (t.includes(q)) return true;
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) qi++;
    }
    return qi === q.length;
  }

  const searchResults = $derived.by(() => {
    const q = bookmarkSearch.trim();
    if (!q) return [];
    return store.data.bookmarks
      .filter((b) => !project.bookmarks.includes(b.id))
      .filter(
        (b) =>
          fuzzyMatch(q, b.title) ||
          fuzzyMatch(q, b.url) ||
          b.tags.some((t) => fuzzyMatch(q, t)) ||
          fuzzyMatch(q, String(b.id)),
      )
      .slice(0, 10);
  });

  function addBookmark(b: Bookmark) {
    store.updateProject({
      ...project,
      bookmarks: [...project.bookmarks, b.id],
    });
    bookmarkSearch = "";
    if (store.filePath) store.save();
  }

  function removeBookmark(id: number) {
    store.updateProject({
      ...project,
      bookmarks: project.bookmarks.filter((bid) => bid !== id),
    });
    if (store.filePath) store.save();
  }
</script>

<div class="flex flex-col h-full border-l border-base-300 overflow-hidden">
  <!-- Header -->
  <div
    class="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0"
  >
    <span class="text-xs text-base-content/60 font-mono">#{project.id}</span>
    <button class="btn btn-ghost btn-xs btn-circle" onclick={onclose}>✕</button>
  </div>

  <div class="flex-1 overflow-y-auto flex flex-col">
    <!-- Title -->
    <div class="flex flex-col gap-1 px-4 py-3 border-b border-base-300">
      <label
        for="proj-title"
        class="text-xs uppercase tracking-widest text-base-content/50 font-mono"
        >Title</label
      >
      <input
        id="proj-title"
        type="text"
        bind:value={title}
        placeholder="Project title…"
        class="input input-sm w-full"
      />
    </div>

    <!-- Note -->
    <div
      class="flex flex-col gap-1 px-4 py-3 border-b border-base-300"
      style="min-height: 200px;"
    >
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label
        class="text-xs uppercase tracking-widest text-base-content/50 font-mono shrink-0"
        >Note</label
      >
      <div
        class="border border-base-300 rounded flex-1 flex flex-col overflow-hidden min-h-30"
      >
        <Editor
          content={note}
          onchange={(v) => {
            note = v;
          }}
        />
      </div>
    </div>

    <!-- Bookmarks -->
    <div class="flex flex-col gap-2 px-4 py-3 flex-1 min-h-0">
      <label
        for="bookmark-search"
        class="text-xs uppercase tracking-widest text-base-content/50 font-mono"
        >Bookmarks</label
      >

      <!-- Search to add -->
      <div class="relative">
        <input
          type="text"
          bind:value={bookmarkSearch}
          onfocus={() => (searchFocused = true)}
          onblur={() => setTimeout(() => (searchFocused = false), 150)}
          placeholder="Search bookmarks to add…"
          class="input input-sm w-full"
          id="bookmark-search"
        />
        {#if searchFocused && searchResults.length > 0}
          <ul
            class="absolute z-10 left-0 right-0 top-full mt-1 menu bg-base-200 rounded shadow-lg border border-base-300 p-0 max-h-48 overflow-y-auto"
          >
            {#each searchResults as b (b.id)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <li onclick={() => addBookmark(b)}>
                <div class="flex flex-col gap-0.5 py-1">
                  <span class="font-medium">{b.title || b.url}</span>
                  <span class="text-xs text-base-content/60 font-mono truncate"
                    >{b.url}</span
                  >
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Attached bookmarks list -->
      {#if attachedBookmarks.length > 0}
        <ul class="menu p-0 border border-base-300 rounded overflow-hidden">
          {#each attachedBookmarks as b (b.id)}
            <li class="border-b border-base-300 last:border-b-0">
              <div class="flex items-center gap-2">
                <div class="flex-1 flex flex-col gap-0 min-w-0">
                  <span class="font-medium truncate">{b.title || b.url}</span>
                  <span class="text-xs text-base-content/60 font-mono truncate"
                    >{b.url}</span
                  >
                </div>
                <button
                  class="btn btn-ghost btn-xs btn-circle shrink-0"
                  onclick={() => removeBookmark(b.id)}
                  title="Remove from project">✕</button
                >
              </div>
            </li>
          {/each}
        </ul>
      {:else if !bookmarkSearch}
        <p class="text-sm text-base-content/50">
          No bookmarks added yet. Search above to add some.
        </p>
      {/if}
    </div>
  </div>

  <!-- Footer -->
  <div
    class="flex justify-end gap-2 px-4 py-3 border-t border-base-300 shrink-0"
  >
    <button class="btn btn-sm btn-error btn-outline" onclick={deleteProject}
      >Delete</button
    >
    <button
      class="btn btn-sm btn-primary"
      onclick={() => {
        save();
        onclose();
      }}>Close</button
    >
  </div>
</div>

<style></style>
