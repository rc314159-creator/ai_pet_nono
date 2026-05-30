# AI Pet System

This repository contains one runnable app: `ai-pet/`.

The app is an Electron desktop experience: a desktop pet entry opens the app window, while the app window renderer, API, agent runtime, domain logic, and pet assets live in the same `ai-pet/` project. There is no separate old web app or wide-screen MVP app to maintain.

## Directory Layout

| Path | Purpose |
|---|---|
| `ai-pet/` | The only app project. Use this as the working directory for install, dev, build, and packaging commands. |
| `ai-pet/desktop/photo-pet/` | Main Electron desktop entry: creates the floating pet, opens the app window, and handles pet/app window linkage. |
| `ai-pet/desktop/app-window/` | Standalone Electron app-window debug shell. It is for UI debugging only, not final app validation. |
| `ai-pet/src/app/` | Current app-window React renderer. |
| `ai-pet/src/components/` | Components used by the current app. Obsolete MVP components are intentionally deleted. |
| `ai-pet/src/domain/` | Shared pet profile, state, motion, mock data, and app domain rules. |
| `ai-pet/server/` | Express API, agent runtime bridge, MCP tools, desktop-pet motion/appearance state, voice, and local stores. |
| `ai-pet/public/assets/` | Runtime assets used by the app, including Mochi pet motion frames and app images. |
| `ai-pet/scripts/` | Project scripts grouped by `assets/`, `motion_pack/`, and `release/`. |
| `ai-pet/docs/` | Product, architecture, module, plan, and fix-record knowledge base. |
| `docs/` | Root-level meeting notes and cross-session index. |
| `reports/` | Verification screenshots and generated research/report artifacts. Not part of the runnable app. |
| `exports/` | Generated zip/source exports. Not part of the runnable app. |

## Development

```bash
cd ai-pet
npm install
npm run dev
```

`npm run dev` starts the full app chain: API, Vite renderer, and the Electron desktop pet entry.

## Build

```bash
cd ai-pet
npm run build
npm run dist:mac
```

For a trusted local demo package that intentionally bundles the local `.env.local` into the app resources:

```bash
cd ai-pet
npm run dist:mac:demo
```

## Source Package

To create a clean source zip for another developer:

```bash
cd ai-pet
npm run package:source
```

The source package excludes local dependencies, build outputs, release artifacts, runtime data, reports, exports, and local secret files. The recipient should run `npm install` inside `ai-pet/` after extracting it.
