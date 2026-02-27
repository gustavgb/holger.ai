<script lang="ts">
  import { store } from "./store.svelte";

  type Tab = "bookmarks" | "projects" | "settings";

  interface Props {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
  }

  let { activeTab, onTabChange }: Props = $props();
</script>

<div
  role="tablist"
  class="tabs tabs-border shrink-0 px-2 pt-1 border-b border-base-300"
>
  <button
    role="tab"
    class="tab {activeTab === 'bookmarks' ? 'tab-active' : ''}"
    onclick={() => onTabChange("bookmarks")}>Bookmarks</button
  >
  <button
    role="tab"
    class="tab {activeTab === 'projects' ? 'tab-active' : ''}"
    onclick={() => onTabChange("projects")}>Projects</button
  >
  <button
    role="tab"
    class="tab {activeTab === 'settings' ? 'tab-active' : ''}"
    onclick={() => onTabChange("settings")}>Settings</button
  >
</div>

{#if !store.filePath && activeTab !== "settings"}
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

<style></style>
