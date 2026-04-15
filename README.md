# CanvasCraft Editor

CanvasCraft Editor is a production-style browser editor built to showcase complex interaction design in a client-facing format. It simulates a content-composition workspace where users can manage slides, manipulate layout blocks, edit directly on canvas, and use a local assistant to refine the active design.

## What this project demonstrates

- Direct-manipulation UI patterns for browser-based editors
- Rich state handling for drag, resize, selection, and layout workflows
- Productized editing experiences beyond simple form-driven CRUD interfaces
- Frontend architecture for complex, interaction-heavy React applications

## Use case

This type of system is commonly used for:

- Presentation and document editors
- Internal content-composition tools
- Creative operations platforms
- White-label publishing or slide-building products

## Preview

These preview assets reflect the current routed editor shell and can be regenerated with `scripts/capture-readme-screenshots.mjs`.

### Full editor overview

![CanvasCraft Editor overview](docs/screenshots/overview.png)

### Local layout assistant

![CanvasCraft Editor local assistant](docs/screenshots/local-assistant.png)

### Redaction workflow

![CanvasCraft Editor redaction lab](docs/screenshots/redaction-lab.png)

## Key capabilities

- Sortable slide rail with quick creation and active-state management
- Large canvas workspace with draggable and resizable overlay blocks
- Inline editing with selection, layering, and keyboard interactions
- Properties panel for selected object controls
- Canvas-based redaction tooling for image workflows
- Local assistant panel for deterministic layout suggestions

## Technology snapshot

- React
- TypeScript
- Vite
- dnd-kit
- Native Canvas API

> Note: The project is packaged with Vite for frictionless local testing, but the editor shell is client-side React code that ports cleanly into a Next.js route or application shell.

## Features

### 1. Collapsible slide list

The left sidebar supports:

- Collapse and expand behavior
- Sortable slide cards using `dnd-kit`
- Active slide selection
- Quick slide creation

### 2. Infinite-scroll canvas

The main workspace is a large scrollable canvas with:

- Draggable overlay blocks
- Resize handles
- Inline editing using `contentEditable`
- Multiple overlay types (`text`, `callout`, `sticky`)
- Selection and delete actions
- Zoom, fit-to-view, a minimap, and snapping support

### 3. Redaction lab

The lower panel handles image editing on a canvas using:

- Pixelation brush
- Blackout brush
- Reset capability
- Direct `ImageData` manipulation

### 4. Local assistant panel

The right-hand assistant panel:

- Keeps per-slide chat history
- Offers quick layout actions
- Can review the current slide from live local state
- Can rewrite headlines, add support blocks, and reorganize layouts
- Changes the editor layout when opened or closed

### 5. Production-style quality pass

The project also includes:

- Local persistence via `localStorage`
- Undo and redo history
- Keyboard shortcuts for duplicate, delete, deselect, and nudging
- A selected-object properties panel
- Automated regression tests plus an accessibility smoke check

## Local setup

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:4177
```

For a production build:

```bash
npm run build
npm run preview
```

For validation:

```bash
npm run check
```

To refresh the README screenshots against a running local editor:

```bash
CANVASCRAFT_EDITOR_URL=http://127.0.0.1:4177/#/edit/slide-1 node ./scripts/capture-readme-screenshots.mjs
```

## Notes on implementation

- `dnd-kit` is used for sortable slide management.
- Freeform overlay dragging uses direct pointer math because editor-style interactions usually need tighter control than list-oriented drag-and-drop abstractions.
- React powers the full editor shell: slide rail, canvas workspace, inline editing, assistant panel, and redaction tool UI.
