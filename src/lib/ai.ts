import { invoke } from "@tauri-apps/api/core";
import { settings } from "./settings.svelte";
import { AIPrompt, Bookmark } from "./types";
import { store } from "./store.svelte";
import { formatDateTime } from "./utils.svelte";
import { message } from "@tauri-apps/plugin-dialog";

const QUESTION_TEMPLATE = `Answer the question regarding this webpage.\n\nWebpage content:\n{content}\n\n{question}`;

export function getQuestionPrompt(question: string): AIPrompt {
  return {
    promptTemplate: QUESTION_TEMPLATE.replace("{question}", question),
    title: question,
  };
}

export async function fetchAnswer(bookmark: Bookmark, prompt: AIPrompt) {
  if (!settings.geminiApiKey) return;
  let result;

  try {
    result = await invoke<string>("fetch_ai_summary", {
      url: bookmark.url,
      apiKey: settings.geminiApiKey,
      model: settings.geminiModel,
      promptTemplate: prompt.promptTemplate,
    });
  } catch (err: any) {
    await message(String(err), { title: "AI error", kind: "error" });
    return;
  }

  // Update or insert the Summary section directly in the store bookmark
  const b = store.bookmarks.get(bookmark.id);
  if (!b) return;
  const updated = {
    ...b,
    sections: [
      {
        heading: `${prompt.title} (${formatDateTime(Date.now())} by ${settings.geminiModel.split("/").at(-1)})`,
        body: result,
      },
      ...b.sections,
    ],
  };
  store.updateBookmark(updated);
  store.saveBookmarks();
}
