import { invoke } from "@tauri-apps/api/core";
import {
  readTextFile,
  writeTextFile,
  watch,
  type WatchEvent,
} from "@tauri-apps/plugin-fs";

interface Settings {
  lastOpenedFile?: string;
  recentWorkspaces?: string[];
  geminiApiKey?: string;
  geminiModel?: string;
}

const DEFAULT_MODEL = "models/gemini-2.5-flash-lite";

const MAX_RECENT = 10;

function sortByFilename(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const nameA = a.split("/").at(-1)!.toLowerCase();
    const nameB = b.split("/").at(-1)!.toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

class SettingsStore {
  private configPath = $state<string>("");
  lastOpenedFile = $state<string | undefined>(undefined);
  recentWorkspaces = $state<string[]>([]);
  geminiApiKey = $state<string>("");
  geminiModel = $state<string>(DEFAULT_MODEL);

  async init() {
    const configPath = await invoke<string>("get_settings_path");
    this.configPath = configPath;

    // Load or create settings file
    try {
      const text = await readTextFile(configPath);
      const parsed = JSON.parse(text) as Settings;
      this.lastOpenedFile = parsed.lastOpenedFile;
      if (parsed.recentWorkspaces && parsed.recentWorkspaces.length > 0) {
        this.recentWorkspaces = sortByFilename(
          parsed.recentWorkspaces.slice(0, MAX_RECENT),
        );
      } else if (parsed.lastOpenedFile) {
        // Migrate from old single-file format
        this.recentWorkspaces = [parsed.lastOpenedFile];
      }
      this.geminiApiKey = parsed.geminiApiKey ?? "";
      this.geminiModel = parsed.geminiModel ?? DEFAULT_MODEL;
    } catch {
      // File doesn't exist yet — write defaults
      await this._write();
    }
  }

  private async _write() {
    if (!this.configPath) return;
    try {
      const settings: Settings = {
        lastOpenedFile: this.lastOpenedFile,
        recentWorkspaces: this.recentWorkspaces,
        geminiApiKey: this.geminiApiKey || undefined,
        geminiModel: this.geminiModel,
      };
      await writeTextFile(this.configPath, JSON.stringify(settings, null, 2));
    } catch {
      // ignore
    }
  }

  async setLastFile(path: string) {
    if (!path) return;
    this.lastOpenedFile = path;
    // Add to set, cap at MAX_RECENT, then sort alphabetically by filename
    const updated = [
      path,
      ...this.recentWorkspaces.filter((p) => p !== path),
    ].slice(0, MAX_RECENT);
    this.recentWorkspaces = sortByFilename(updated);
    await this._write();
  }

  async removeRecentWorkspace(path: string) {
    this.recentWorkspaces = this.recentWorkspaces.filter((p) => p !== path);
    if (this.lastOpenedFile === path) {
      this.lastOpenedFile = this.recentWorkspaces[0] ?? undefined;
    }
    await this._write();
  }

  async setGeminiApiKey(key: string) {
    this.geminiApiKey = key;
    await this._write();
  }

  async setGeminiModel(model: string) {
    this.geminiModel = model;
    await this._write();
  }
}

export const settings = new SettingsStore();
