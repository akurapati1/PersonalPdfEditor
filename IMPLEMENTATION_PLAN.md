# Implementation Plan — Personal PDF Editor

## Overview

Pure-frontend React application. No backend for MVP. All PDF operations run in the browser using `pdfjs-dist` (rendering) and `pdf-lib` (modification + export).

---

## Phase 0 — Project Scaffold

**Goal:** Working dev environment with hot-reload.

### Steps
1. `npm create vite@latest frontend -- --template react-ts`
2. Install all dependencies (see below).
3. Configure Tailwind CSS.
4. Set up path aliases in `vite.config.ts` (`@/` → `src/`).
5. Update `.gitignore` for `node_modules`, `dist`.

### Dependencies

```bash
# Core
pdfjs-dist                  # PDF rendering
pdf-lib                     # PDF manipulation & export
@pdf-lib/fontkit            # Custom font embedding

# UI
react-rnd                   # Draggable + resizable annotation elements
react-signature-canvas      # Freehand signature drawing
lucide-react                # Icons
@radix-ui/react-dialog      # Modal (signature pad)
@radix-ui/react-select      # Dropdowns in toolbar
@radix-ui/react-slider      # Zoom slider
@radix-ui/react-tooltip     # Toolbar tooltips

# State
zustand                     # Global store

# Styling
tailwindcss
@tailwindcss/vite
autoprefixer

# Utils
uuid                        # Unique annotation IDs
```

---

## Phase 1 — PDF Viewer

**Goal:** Open a PDF and view all pages at configurable zoom.

### Components
- `<AppShell>` — outer layout: header bar + sidebar + main canvas area
- `<PDFDropzone>` — shown when no file is loaded; accepts drag-drop or file picker
- `<PDFViewer>` — manages pdfjs Document, renders `<PageCanvas>` per page
- `<PageCanvas>` — single page: renders pdfjs into `<canvas>`, stacks annotation overlay above it
- `<PageThumbnail>` — mini render in sidebar, clickable to jump to page

### State (Zustand)
```ts
pdfBytes: Uint8Array | null
pdfDoc: PDFDocumentProxy | null  // pdfjs handle
numPages: number
currentPage: number
zoom: number   // 1.0 = 100%
```

### Key Implementation Notes
- Use `pdfjs-dist` with its bundled worker (`pdfjs-dist/build/pdf.worker.mjs`) via Vite's `?url` import.
- Each `<PageCanvas>` renders into an offscreen canvas then copies to DOM to prevent flicker on zoom.
- Wrap the entire scrollable area in a `<div>` with `overflow-y: auto`; pages stack vertically.
- Intersection Observer on each `<PageCanvas>` for lazy rendering (skip pages out of viewport).

---

## Phase 2 — Signature Tool

**Goal:** Let user create a signature and place it on the PDF.

### Components
- `<SignatureModal>` (Radix Dialog) — tabs: Draw / Type / Upload
  - `<SignaturePad>` — `react-signature-canvas` canvas; Clear + Confirm buttons
  - `<SignatureTyped>` — text input rendered in a cursive Google Font; color picker
  - `<SignatureUpload>` — file input for PNG/JPG
- `<SignatureElement>` — placed on page; uses `react-rnd` for drag + resize; Delete button on hover

### Flow
1. User clicks "Signature" in toolbar → `<SignatureModal>` opens.
2. User draws / types / uploads → confirms → modal closes.
3. A `dataURL` (PNG) is stored in Zustand as a pending signature.
4. Clicking on the PDF canvas places a `SignatureAnnotation` at that position.
5. User can drag/resize/delete the placed element.

### State additions
```ts
annotations: Record<number, Annotation[]>   // keyed by pageIndex
activeTool: ToolType
pendingSignatureDataUrl: string | null
```

---

## Phase 3 — Annotations

**Goal:** Text boxes, shapes, freehand pen, and text highlighting.

### 3a — Text Box
- Click on page while "Text" tool active → creates a `<TextBox>` annotation (react-rnd).
- Double-click → enters edit mode (contentEditable div).
- Toolbar shows font family, size, color, bold, italic while text box is selected.

### 3b — Shapes
- Toolbar tools: Rectangle, Ellipse, Line.
- Drag on page to define shape bounds.
- Options: stroke color, fill color, fill opacity, stroke width.
- Shapes rendered as positioned `<svg>` elements inside the overlay.

### 3c — Freehand / Pen
- Pointer events on a transparent `<canvas>` stretched over the whole page.
- While pen tool is active, this canvas captures all pointer events.
- Strokes stored as arrays of `{x, y}` points (normalized 0–1).
- Rendered live on the freehand canvas; also mirrored to an SVG path for export.

### 3d — Highlight
- User selects text using the PDF.js text layer.
- On mouseup, capture the selection's bounding rects relative to the page.
- Store as a `HighlightAnnotation` with color + rects array.
- Rendered as semi-transparent colored divs positioned over the text.

### Annotation data model
```ts
interface BaseAnnotation {
  id: string;
  pageIndex: number;
  x: number; y: number; width: number; height: number; // 0-1 fractions
}

interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature';
  dataUrl: string;
  rotation: number;
}

interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'ellipse' | 'line';
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
}

interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
}

interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  color: string;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

type Annotation = SignatureAnnotation | TextAnnotation | ShapeAnnotation
  | FreehandAnnotation | HighlightAnnotation;
```

---

## Phase 4 — Export

**Goal:** Flatten all annotations into the PDF and trigger a download.

### `pdfExporter.ts`
```
loadedPdfLib = await PDFDocument.load(pdfBytes)
for each page:
  pdfPage = loadedPdfLib.getPages()[i]
  { width, height } = pdfPage.getSize()
  for each annotation on page:
    switch type:
      'signature'  → embed PNG image, drawImage at (x*w, h - (y+height)*h, width*w, height*h)
      'text'       → embed font, drawText
      'rectangle'  → drawRectangle
      'ellipse'    → drawEllipse
      'line'       → drawLine
      'freehand'   → convert points to SVG path string, drawSvgPath
      'highlight'  → drawRectangle with low opacity + BlendMode.Multiply
bytes = await loadedPdfLib.save()
triggerDownload(bytes, filename)
```

Note: pdf-lib's coordinate system is bottom-left origin; conversion needed from top-left (browser) coords.

---

## Phase 5 — Page Management

**Goal:** Delete/reorder pages; merge a second PDF.

### Delete Page
- Button in sidebar thumbnail → removes page from both pdfjs proxy and a cloned pdf-lib document.
- The in-memory `pdfBytes` is replaced with the re-saved pdf-lib document.
- All annotation indices above the deleted page shift down by 1.

### Reorder Pages
- Drag-and-drop thumbnails in sidebar (using `@dnd-kit/sortable`).
- On drop, re-create the pdf-lib document with pages in new order, update `pdfBytes`.

### Merge PDF
- File picker for a second PDF.
- Use `pdf-lib` `copyPages()` + `addPage()` to append pages.
- Update `pdfBytes` and reload pdfjs.

---

## Phase 6 — Form Filling

**Goal:** Fill interactive PDF form fields.

- `pdf-lib`'s `getForm()` returns `PDFForm`.
- Enumerate fields: `form.getFields()`.
- For each field, overlay a native HTML `<input>` or `<select>` inside the annotation layer.
- On export: `form.getTextField('name').setText(value)` + `form.flatten()`.

---

## Phase 7 (Future) — Python Backend for PKI Signing

- FastAPI service at `localhost:8000`.
- Endpoint: `POST /sign` — accepts PDF bytes + certificate info, returns signed PDF bytes.
- Uses `pyhanko` library for PAdES-compliant signatures.
- Frontend sends the exported (annotated) PDF to the backend for the final PKI signature step.

---

## File Creation Order

```
1. frontend/vite.config.ts + tailwind.config.ts + tsconfig.json
2. frontend/src/types/annotations.ts
3. frontend/src/store/usePdfStore.ts
4. frontend/src/utils/pdfRenderer.ts
5. frontend/src/utils/pdfExporter.ts
6. frontend/src/components/layout/AppShell.tsx
7. frontend/src/components/viewer/PDFDropzone.tsx
8. frontend/src/components/viewer/PDFViewer.tsx
9. frontend/src/components/viewer/PageCanvas.tsx
10. frontend/src/components/viewer/PageThumbnail.tsx
11. frontend/src/components/toolbar/Toolbar.tsx
12. frontend/src/components/signature/SignatureModal.tsx
13. frontend/src/components/annotations/AnnotationLayer.tsx
14. frontend/src/components/annotations/TextBox.tsx
15. frontend/src/components/annotations/ShapeEl.tsx
16. frontend/src/components/annotations/FreehandCanvas.tsx
17. frontend/src/components/export/ExportButton.tsx
18. frontend/src/App.tsx
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: [Logo] [File: doc.pdf  10 pages]  [Page 3/10] [⬇️ Download] │
├────────────┬────────────────────────────────────────────────┤
│  SIDEBAR   │  TOOLBAR (horizontal, below header)            │
│            ├────────────────────────────────────────────────┤
│ [thumb 1]  │                                                │
│ [thumb 2]  │          PDF CANVAS AREA (scrollable)          │
│ [thumb 3]  │       ┌─────────────────────────┐              │
│   ...      │       │  Page 1  (canvas +      │              │
│            │       │  annotation overlay)    │              │
│            │       └─────────────────────────┘              │
│            │       ┌─────────────────────────┐              │
│            │       │  Page 2                 │              │
│            │       └─────────────────────────┘              │
└────────────┴────────────────────────────────────────────────┘
```

Toolbar tools:
`[Select] [Text] [Signature] [Pen] [Highlight] [Rectangle] [Ellipse] [Line] [Eraser]`
