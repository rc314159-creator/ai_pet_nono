# AI Pet App

This is the single runnable AI Pet app.

## Runtime Structure

| Path | Purpose |
|---|---|
| `desktop/photo-pet/` | Main Electron entry for the floating desktop pet and app-window linkage. |
| `desktop/app-window/` | Standalone app-window debug shell. |
| `src/app/` | Current React app-window renderer. |
| `src/components/` | Components used by the current renderer. |
| `src/domain/` | Shared domain model, mock data, state rules, and motion helpers. |
| `server/` | API, agent bridge, MCP tools, voice, motion, appearance, and local JSON stores. |
| `public/assets/` | Runtime assets bundled into the renderer build. |
| `scripts/assets/` | Asset generation and normalization tools. |
| `scripts/motion_pack/` | Desktop pet motion-pack tooling. |
| `scripts/release/` | Build/release/source-package helpers. |

Obsolete MVP components are not kept in this app. If a file is not part of the current desktop pet plus app-window product, it should live in docs/reports as evidence or be deleted.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Create a clean source zip for handoff:

```bash
npm run package:source
```
