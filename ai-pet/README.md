# AI Pet App

This is the single runnable app in the repository. It is an Electron desktop-pet product: `desktop/photo-pet` creates the floating pet and opens the app window; the app window renderer, API, agent bridge, local stores, and runtime assets all live in this project.

## Prerequisites

- macOS for the desktop-pet demo flow.
- Node.js 20 or newer.
- npm, using the checked-in `package-lock.json`.

Local model, voice, and gateway credentials belong in `.env.local` or release-time env files. Do not commit local secrets.

## Start Development

```bash
cp .env.example .env.local
npm install
npm run dev
```

`npm run dev` starts:

- API: `127.0.0.1:8788`
- Vite renderer: `127.0.0.1:5180`
- Electron desktop pet: `desktop/photo-pet/main.cjs`

The final product entry is the floating desktop pet. Click the pet to open or focus the app window. The browser URL is only a renderer smoke-test target.

## Required Local Configuration

Create `.env.local` from the template before running the full demo:

```bash
cp .env.example .env.local
```

Fill these values as needed:

| Variable | When to set | Notes |
|---|---|---|
| `LLMMELON_API_KEY` | Required for full AI chat | Used by OpenCode/opencode and fallback model paths. Without it, the app uses local fallback replies. |
| `LLMMELON_BASE_URL` | Usually keep default | OpenAI-compatible gateway URL. |
| `LLMMELON_MODEL` | Optional | Default model for gateway calls. |
| `AI_PET_OPENCODE_MODEL` | Optional | Model used by the primary OpenCode companion agent. |
| `AI_PET_AGENT_RUNTIME` | Optional | Defaults to `opencode`. Set `openai-agents` only when testing fallback runtime. |
| `VITE_AI_PET_API_BASE_URL` | Usually keep default | Renderer API base URL. If `AI_PET_API_PORT` changes, update this too. |
| `AI_PET_API_PORT` | Optional | Defaults to `8788`. |
| `AI_PET_QWEN_API_KEY` | Optional voice | Enables Qwen voice design and TTS. |
| `DASHSCOPE_API_KEY` / `ALIYUN_BAILIAN_API_KEY` | Optional voice aliases | Accepted as alternatives to `AI_PET_QWEN_API_KEY`. |
| `OPENAI_API_KEY` / `AI_PET_OPENAI_API_KEY` | Optional fallback | Used by OpenAI Agents SDK or OpenAI TTS fallback experiments. |

Install the primary Agent CLI when using the full AI path:

```bash
npm install -g opencode-ai
opencode --version
```

The app is intentionally tolerant during demos:

- Missing `LLMMELON_API_KEY`: app still opens, chat uses local fallback rules.
- Missing `opencode`: app falls back to non-OpenCode runtime paths.
- Missing `AI_PET_QWEN_API_KEY`: voice mode falls back to browser/system speech behavior.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Full development chain: API, renderer, and desktop pet. |
| `npm run dev:api` | API watcher only. |
| `npm run dev:renderer` | Vite renderer only. |
| `npm run dev:photo-pet` | Floating desktop pet Electron entry only. |
| `npm run dev:desktop` | Alias for the current photo-level desktop pet entry. |
| `npm run dev:app` | Standalone app-window debug shell; not final validation. |
| `npm run mcp:ai-pet` | Run AI Pet MCP tools locally. |
| `npm run agent:opencode:test` | Smoke-test the OpenCode/opencode agent path. |
| `npm run typecheck` | TypeScript project checks. |
| `npm run build` | Typecheck, Vite build, asset pruning, and bundled API build. |
| `npm run dist:mac` | Build unsigned macOS zip without local `.env.local`. |
| `npm run dist:mac:demo` | Build trusted demo zip with local demo env copied into app resources. |
| `npm run package:source` | Create a clean source handoff zip in `../exports/source/`. |

## Smoke Checks

After `npm run dev`, verify the API:

```bash
curl http://127.0.0.1:8788/api/health
```

Check the response fields:

- `ok` should be `true`.
- `desktopPet` should be `desktop/photo-pet`.
- `llm` is `llmmelon-configured` when `LLMMELON_API_KEY` is set, otherwise `local-fallback`.

For complete validation, interact with the Electron desktop pet and app window. Browser-only checks do not validate desktop-pet click handling or hide/restore behavior.

## Runtime Structure

| Path | Purpose |
|---|---|
| `desktop/photo-pet/` | Main Electron entry for the floating pet, click handling, drag handling, app-window creation, and pet/app visibility linkage. |
| `desktop/app-window/` | Standalone Electron app-window debug shell. |
| `src/app/` | Current React app-window renderer. |
| `src/components/` | Components used by the current renderer. |
| `src/domain/` | Shared domain model, mock data, state rules, tasks, recommendations, and motion helpers. |
| `server/` | Express API, OpenCode/opencode bridge, MCP tools, voice, motion, appearance, knowledge base, and local JSON stores. |
| `public/assets/` | Runtime assets bundled into the renderer build, including Mochi motion frames and app images. |
| `scripts/assets/` | Asset generation and normalization tools. |
| `scripts/motion_pack/` | Desktop-pet motion-pack tooling. |
| `scripts/release/` | Build, release, env, asset pruning, and source-package helpers. |
| `docs/` | Product, architecture, module, plan, and fix-record knowledge base. |

Obsolete MVP components are not kept in this app. If a file is not part of the current desktop pet plus app-window product, it should live in docs/reports as evidence or be deleted.

## Local Runtime Data

Demo stores are intentionally local JSON files under `.ai-pet-data/`:

- `appearance.json` for desktop-pet accessory state.
- `thread-store.json` for the main pet chat thread and memory.
- `knowledge-base.json` for the in-app live knowledge base.

This directory is ignored by Git and should not be treated as backend production storage.

## Build And Package

```bash
npm run typecheck
npm run build
npm run dist:mac
```

For a trusted local demo package that intentionally includes local demo env:

```bash
npm run dist:mac:demo
```

For source handoff:

```bash
npm run package:source
```

The source package excludes dependencies, build outputs, release artifacts, runtime data, reports, exports, and local secret files. Recipients should run `npm install` inside this directory after extracting it.

## Packaging With Environment

`npm run dist:mac` builds an unsigned macOS zip without local `.env.local`.

`npm run dist:mac:demo` first copies local demo env into `release-config/.env`, then bundles that file into app resources. Use it only for trusted demo handoff packages because credentials may be included.

Packaged apps start the bundled API and load `dist/index.html`; they do not require the Vite dev server at `127.0.0.1:5180`.

## Troubleshooting

| Symptom | Check |
|---|---|
| App window opens in a browser but no desktop pet appears | Start with `npm run dev`; `npm run dev:renderer` is only a renderer smoke test. |
| Chat says fallback/local behavior | Set `LLMMELON_API_KEY`, install `opencode-ai`, and verify `opencode --version`. |
| Voice does not return generated audio | Set `AI_PET_QWEN_API_KEY` or one of its aliases. Browser/system speech fallback is expected without it. |
| Renderer cannot reach API | Confirm `curl http://127.0.0.1:8788/api/health`; if using a custom `AI_PET_API_PORT`, update `VITE_AI_PET_API_BASE_URL`. |
| Packaged app misses AI config | Use `dist:mac:demo` for trusted local demos, or provide `AI_PET_ENV_FILE` pointing to an env file before launch. |

## Validation

Use Electron as the acceptance target for any work involving:

- floating desktop pet launch
- click-to-open app window
- desktop-pet hide/restore behavior
- motion playback
- outfit/appearance sync
- agent-triggered desktop-pet actions

`http://127.0.0.1:5180/` can help isolate renderer bugs, but it does not prove the app is usable as a desktop product.
