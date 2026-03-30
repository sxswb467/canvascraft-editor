# CanvasCraft Editor Demo

A GitHub-ready portfolio project built to demonstrate the exact interaction patterns often required in complex React editor work:

- collapsible slide list panel
- drag-and-drop slide sorting
- infinite-scroll canvas workspace
- draggable inline-editable overlays
- resize handles and layering controls
- zoom, fit-to-view, minimap, and snap-to-grid layout support
- keyboard shortcuts and persistent editor state
- image-based redaction with canvas pixel manipulation
- a local layout assistant that reviews slides and applies deterministic edits

This demo is intentionally built as a **production-style React + TypeScript project** with a flat and readable component structure so it is easy to extend inside an existing codebase.

## Preview

### Full editor overview

![CanvasCraft Editor overview](docs/screenshots/overview.png)

### Local layout assistant

![CanvasCraft Editor local assistant](docs/screenshots/local-assistant.png)

### Redaction workflow

![CanvasCraft Editor redaction lab](docs/screenshots/redaction-lab.png)

## Stack

- React
- TypeScript
- Vite
- dnd-kit
- native Canvas API

> Note: I packaged this repo with Vite for frictionless local testing, but the editor shell is client-side React code that ports directly into a Next.js route or app-shell environment.

## Why this is a strong portfolio piece

This repo is designed to show that you can work on:

- interactive editor UI, not just static pages
- direct-manipulation interfaces with drag behavior
- componentized React architecture
- canvas-based tooling for image workflows
- local assistant workflows that coexist with complex layouts
- maintainable TypeScript code in a non-trivial UI

## Features

### 1. Collapsible slide list
The left sidebar supports:
- collapse / expand behavior
- sortable slide cards using `dnd-kit`
- active slide selection
- quick slide creation

### 2. Infinite-scroll canvas
The main workspace is a large scrollable canvas with:
- draggable overlay blocks
- resize handles
- inline editing using `contentEditable`
- multiple overlay types (`text`, `callout`, `sticky`)
- selection and delete actions
- zoom, fit-to-view, a minimap, and snapping support

### 3. Redaction lab
The lower panel demonstrates image editing on a canvas using:
- pixelation brush
- blackout brush
- reset capability
- direct `ImageData` manipulation

### 4. Local assistant panel
The right-hand assistant panel:
- keeps per-slide chat history
- offers quick layout actions
- can review the current slide from live local state
- can rewrite headlines, add support blocks, and reorganize layouts
- changes the editor layout when opened or closed

### 5. Production-style quality pass
The demo also includes:
- local persistence via `localStorage`
- undo / redo history
- keyboard shortcuts for duplicate, delete, deselect, and nudging
- a selected-object properties panel
- automated regression tests plus an accessibility smoke check

## Local setup

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:4177
```

The project now ignores generated output and dependencies via `.gitignore`, so a clean handoff should only include source files plus the lockfile.

For a production build:

```bash
npm run build
npm run preview
```

For validation:

```bash
npm run check
```

## Suggested talking points when applying

- `dnd-kit` was used for sortable slide management.
- Freeform overlay dragging was implemented with direct pointer math because editor-style interactions usually need tighter control than list-oriented drag-and-drop abstractions.
- React was used to build the full editor shell: slide rail, canvas workspace, inline editing, chat sidecar, and redaction tool UI.
