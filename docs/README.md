# clippy.ai docs

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Add bookmark |
| `Ctrl+F`/`Ctrl+K` | Focus searchbar |
| `Ctrl+O` | Open workspace file |
| `Ctrl+Q` | Close (asks if there are unsaved changes) |
| `Ctrl+Tab`/`Ctrl+Shift+Tab` | Cycle recent workspaces |


## Quick Prompts Example

`./.clippy.json`:

```json
{
  ...
  "quickPrompts": [
    {
      "label": "Summarize",
      "labelFetching": "Summarizing",
      "title": "AI Summary",
      "promptTemplate": "Summarize the main content of the following webpage in 3-5 sentences.\n\nWebpage content:\n{content}"
    },
    {
      "label": "Analyze credibility",
      "labelFetching": "Analyzing credibility",
      "title": "Credibility analysis",
      "promptTemplate": "Analyze and judge the credibility of this content in 5-7 sentences. Be critical but fair.\n\nWebpage content:\n{content}"
    },
    {
      "label": "Describe author",
      "labelFetching": "Describing author",
      "title": "Author description",
      "promptTemplate": "Describe the author of this article in 3-5 sentences. Focus on who they are, what they have done, and what their bias is, if any\n\nWebpage content:\n{content}"
    }
  ]
}
```
