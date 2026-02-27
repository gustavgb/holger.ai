<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { store } from "./lib/store.svelte";
  import { settings } from "./lib/settings.svelte";
  import NavBar from "./lib/NavBar.svelte";
  import BookmarksPage from "./lib/BookmarksPage.svelte";
  import ProjectsPage from "./lib/ProjectsPage.svelte";
  import SettingsPage from "./lib/SettingsPage.svelte";

  type Tab = "bookmarks" | "projects" | "settings";
  let activeTab = $state<Tab>("bookmarks");

  onMount(async () => {
    await settings.init();
    const initialPath = await invoke<string | null>("get_initial_file");
    if (initialPath) {
      await store.openPath(initialPath);
    } else if (settings.lastOpenedFile) {
      await store.openPath(settings.lastOpenedFile);
    }
  });

  $effect(() => {
    const unlisten = listen<string>("menu-action", async ({ payload: id }) => {
      if (id === "open") await store.open();
      else if (id === "save") await store.save();
      else if (id === "save_as") await store.saveAs();
      else if (id === "quit") invoke("close_app");
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

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
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex flex-col h-full bg-base-100 overflow-hidden">
  <NavBar {activeTab} onTabChange={(t) => (activeTab = t)} />

  {#if activeTab === "bookmarks"}
    <BookmarksPage />
  {:else if activeTab === "projects"}
    <ProjectsPage />
  {:else}
    <SettingsPage />
  {/if}
</div>

<style></style>
