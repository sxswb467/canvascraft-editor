# Contra application answer draft

## Relevant example

A relevant example is the **CanvasCraft Editor Demo** I built as a React + TypeScript editor showcase. It includes:

- a collapsible, sortable slide list panel
- a large scrollable canvas workspace
- draggable, inline-editable overlay elements
- an image redaction tool using direct canvas pixel manipulation
- an AI chat side panel that reshapes the editor layout when opened

It was built to demonstrate the exact kind of interaction-heavy editor work your role describes: production-style React components inside a structured app shell rather than a greenfield landing page or a Figma export.

## What I used React for

I used React to build the full editor surface and interaction model, including:

- the slide rail and sortable slide cards
- the active editor layout and responsive panel behavior
- canvas overlay rendering and selection state
- inline editing for text overlays
- the AI sidecar panel and quick actions
- redaction tool controls and editor state transitions

## Drag-and-drop library answer

I have used **dnd-kit** in React for sortable and interaction-heavy interfaces. In this demo, I used it for the slide list so slides can be reordered cleanly without fighting the rest of the layout.

For the freeform canvas overlays, I used custom pointer-based dragging instead of forcing everything through a list-oriented drag-and-drop abstraction. In editor-style products, that usually gives better control over movement, scroll offsets, selection behavior, and future features like snapping or constraints.

## Short version to paste into Contra

I recently built a React + TypeScript editor demo specifically to showcase complex interaction work: sortable slide rail, infinite-scroll canvas, draggable inline-editable overlays, canvas-based image redaction, and an AI chat panel that dynamically reshapes the editor layout. I used **dnd-kit** for sortable slide management, and for freeform canvas movement I used custom pointer-driven drag logic because editor surfaces usually need tighter control than standard list DnD abstractions.
