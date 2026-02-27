<script lang="ts">
  import { store } from "./store.svelte";
  import ProjectPanel from "./ProjectPanel.svelte";
  import type { Project } from "./types";
  import { fuzzyScore, formatDate } from "./utils";

  let search = $state("");
  let activeProject = $state<Project | null>(null);

  const filtered = $derived.by(() => {
    const q = search.trim();
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

  async function handleAdd() {
    if (!store.filePath) {
      await store.saveAs();
      if (!store.filePath) return;
    }
    const project = store.addProject({ title: "", note: "", bookmarks: [] });
    activeProject = project;
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
    placeholder="Search projects…"
    class="input input-sm flex-1 min-w-0"
  />
  <button class="btn btn-sm btn-primary shrink-0" onclick={handleAdd}
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
    {#if filtered.length === 0 && store.filePath}
      <div class="py-12 px-4 text-center text-base-content/60 text-sm">
        {search
          ? "No results."
          : "No projects yet. Click + Add to get started."}
      </div>
    {/if}
    {#each filtered as p (p.id)}
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
          {p.bookmarks.length} bookmark{p.bookmarks.length !== 1 ? "s" : ""} · {formatDate(
            p.lastUpdated,
          )}
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

<style></style>
