<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { confirm } from "@tauri-apps/plugin-dialog";
  import { store } from "./lib/store.svelte";
  import { settings } from "./lib/settings.svelte";
  import BookmarkPanel from "./lib/BookmarkPanel.svelte";
  import ProjectPanel from "./lib/ProjectPanel.svelte";
  import AddBookmarkDialog from "./lib/AddBookmarkDialog.svelte";
  import type { Bookmark, Project } from "./lib/types";

  // ─── State ────────────────────────────────────────────────────────────────
  type Tab = "bookmarks" | "projects";
  let activeTab = $state<Tab>("bookmarks");
  let bookmarkSearch = $state("");
  let projectSearch = $state("");
  let activeBookmark = $state<Bookmark | null>(null);
  let activeProject = $state<Project | null>(null);
  let showAddDialog = $state(false);

  // ─── Init ─────────────────────────────────────────────────────────────────
  onMount(async () => {
    await settings.init();
    const initialPath = await invoke<string | null>("get_initial_file");
    if (initialPath) {
      await store.openPath(initialPath);
    } else if (settings.lastOpenedFile) {
      await store.openPath(settings.lastOpenedFile);
    }
  });

  // ─── Menu actions from Rust ───────────────────────────────────────────────
  $effect(() => {
    const unlisten = listen<string>("menu-action", async ({ payload: id }) => {
      if (id === "open") {
        await store.open();
      } else if (id === "save") {
        await store.save();
      } else if (id === "save_as") {
        await store.saveAs();
      } else if (id === "quit") {
        invoke("close_app");
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault();
      store.saveAs();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      store.save();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "o") {
      e.preventDefault();
      store.open();
    }
  }

  // ─── Fuzzy search ─────────────────────────────────────────────────────────
  function fuzzyScore(q: string, target: string): number {
    const ql = q.toLowerCase(),
      tl = target.toLowerCase();
    if (tl.includes(ql)) return 1000 - tl.indexOf(ql);
    let qi = 0,
      score = 0,
      last = -1;
    for (let ti = 0; ti < tl.length && qi < ql.length; ti++) {
      if (tl[ti] === ql[qi]) {
        score +=
          last === ti - 1 ? 10 : /[\s\-_.]/.test(tl[ti - 1] ?? "") ? 8 : 1;
        last = ti;
        qi++;
      }
    }
    return qi === ql.length ? score : -1;
  }

  const filteredBookmarks = $derived.by(() => {
    const q = bookmarkSearch.trim();
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

  const filteredProjects = $derived.by(() => {
    const q = projectSearch.trim();
    if (!q) return store.sortedProjects;
    return store.sortedProjects
      .map((p) => ({
        p,
        score: Math.max(
          fuzzyScore(q, p.title) * 3,
          fuzzyScore(q, p.note),
          fuzzyScore(q, String(p.id)),
        ),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p);
  });

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function ensureFile() {
    if (!store.filePath) {
      await store.saveAs();
    }
    return !!store.filePath;
  }

  async function handleAddBookmark(url: string) {
    showAddDialog = false;
    if (!(await ensureFile())) return;
    const bookmark = store.addBookmark({ url, title: "", note: "", tags: [] });
    activeBookmark = bookmark;
    await store.save();
  }

  async function handleAddProject() {
    if (!(await ensureFile())) return;
    const project = store.addProject({ title: "", note: "", bookmarks: [] });
    activeProject = project;
    await store.save();
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex flex-col h-full bg-base-100 overflow-hidden">
  <!-- ─── Tabs ──────────────────────────────────────────────────────────── -->
  <div
    role="tablist"
    class="tabs tabs-border shrink-0 px-2 pt-1 border-b border-base-300"
  >
    <button
      role="tab"
      class="tab {activeTab === 'bookmarks' ? 'tab-active' : ''}"
      onclick={() => (activeTab = "bookmarks")}>Bookmarks</button
    >
    <button
      role="tab"
      class="tab {activeTab === 'projects' ? 'tab-active' : ''}"
      onclick={() => (activeTab = "projects")}>Projects</button
    >
  </div>

  <!-- ─── No file bar ──────────────────────────────────────────────────── -->
  {#if !store.filePath}
    <div
      class="px-4 py-2 text-xs text-base-content/60 border-b border-base-300 shrink-0"
    >
      No data file open.
      <button class="link link-primary text-xs" onclick={() => store.open()}
        >Open a file</button
      >
      or
      <button class="link link-primary text-xs" onclick={() => store.saveAs()}
        >create a new one</button
      >.
    </div>
  {/if}

  <!-- ─── Bookmarks tab ─────────────────────────────────────────────────── -->
  {#if activeTab === "bookmarks"}
    <!-- Toolbar -->
    <div
      class="flex items-center gap-2 px-3 py-2 border-b border-base-300 shrink-0"
    >
      <input
        type="search"
        bind:value={bookmarkSearch}
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
        {#if filteredBookmarks.length === 0 && store.filePath}
          <div class="py-12 px-4 text-center text-base-content/60 text-sm">
            {bookmarkSearch
              ? "No results."
              : "No bookmarks yet. Click + Add to get started."}
          </div>
        {/if}
        {#each filteredBookmarks as b (b.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="px-3 py-3 border-b border-base-300 cursor-pointer transition-colors hover:bg-base-200 {activeBookmark?.id ===
            b.id
              ? 'bg-base-200'
              : ''}"
            onclick={() => (activeBookmark = b)}
          >
            <div class="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
              <span class="text-xs text-base-content/50 font-mono shrink-0"
                >#{b.id}</span
              >
              <span class="text-sm font-medium flex-1 min-w-0 truncate"
                >{b.title || "(untitled)"}</span
              >
            </div>
            {#if b.tags.length > 0}
              <div class="flex flex-wrap gap-1 mb-1">
                {#each b.tags as tag}
                  <span class="badge badge-outline badge-xs">{tag}</span>
                {/each}
              </div>
            {/if}
            <div class="text-xs text-primary font-mono truncate opacity-70">
              {b.url}
            </div>
            {#if b.note}
              <div class="text-xs text-base-content/50 mt-0.5 truncate">
                {b.note.slice(0, 80)}
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

    <!-- ─── Projects tab ──────────────────────────────────────────────────── -->
  {:else}
    <!-- Toolbar -->
    <div
      class="flex items-center gap-2 px-3 py-2 border-b border-base-300 shrink-0"
    >
      <input
        type="search"
        bind:value={projectSearch}
        placeholder="Search projects…"
        class="input input-sm flex-1 min-w-0"
      />
      <button class="btn btn-sm btn-primary shrink-0" onclick={handleAddProject}
        >+ Add</button
      >
    </div>

    <!-- Split pane -->
    <div class="flex flex-1 overflow-hidden">
      <!-- List -->
      <div
        class="flex flex-col overflow-y-auto border-r border-base-300"
        style="width: 300px; min-width: 220px;"
      >
        {#if filteredProjects.length === 0 && store.filePath}
          <div class="py-12 px-4 text-center text-base-content/60 text-sm">
            {projectSearch
              ? "No results."
              : "No projects yet. Click + Add to get started."}
          </div>
        {/if}
        {#each filteredProjects as p (p.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="px-3 py-3 border-b border-base-300 cursor-pointer transition-colors hover:bg-base-200 {activeProject?.id ===
            p.id
              ? 'bg-base-200'
              : ''}"
            onclick={() => (activeProject = p)}
          >
            <div class="flex items-baseline gap-1.5 mb-0.5">
              <span class="text-xs text-base-content/50 font-mono shrink-0"
                >#{p.id}</span
              >
              <span class="text-sm font-medium flex-1 min-w-0 truncate"
                >{p.title || "(untitled project)"}</span
              >
            </div>
            <div class="text-xs text-base-content/50">
              {p.bookmarks.length} bookmark{p.bookmarks.length !== 1 ? "s" : ""}
              · {formatDate(p.lastUpdated)}
            </div>
            {#if p.note}
              <div class="text-xs text-base-content/50 mt-0.5 truncate">
                {p.note.slice(0, 80)}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Detail panel -->
      <div class="flex-1 overflow-hidden">
        {#if activeProject}
          {#key activeProject.id}
            <ProjectPanel
              project={store.data.projects.find(
                (p) => p.id === activeProject!.id,
              ) ?? activeProject}
              onclose={() => (activeProject = null)}
            />
          {/key}
        {:else}
          <div
            class="h-full flex items-center justify-center text-base-content/40 text-sm"
          >
            Select a project to view it
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- ─── Add Bookmark Dialog ───────────────────────────────────────────────── -->
{#if showAddDialog}
  <AddBookmarkDialog
    onconfirm={handleAddBookmark}
    oncancel={() => (showAddDialog = false)}
  />
{/if}

<style></style>
