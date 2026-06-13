# Personal PDF Editor — Requirements Document

## 1. Project Overview

A personal, browser-based PDF editing and signing tool. The primary goal is to let the user open any PDF, annotate it (text, highlights, shapes, freehand), place a handwritten or typed signature, and download the modified PDF — all without uploading files to any external server.

---

## 2. Functional Requirements

### 2.1 File Management
- **FR-01** Open a PDF from the local filesystem via file picker.
- **FR-02** Display the PDF filename and page count in the header.
- **FR-03** Export/download the annotated PDF back to the local filesystem with a single click.
- **FR-04** Support multi-page PDFs; allow navigating between pages (prev/next, jump-to-page).
- **FR-05** Zoom in/out and fit-to-width/fit-to-page controls.

### 2.2 PDF Viewing
- **FR-06** Render each PDF page faithfully inside the browser (text, images, vectors).
- **FR-07** Page thumbnails in a collapsible sidebar for quick navigation.
- **FR-08** Keyboard shortcuts: arrow keys for page nav, `+`/`-` for zoom, `Ctrl+S` to download.

### 2.3 Signature
- **FR-09** Draw a freehand signature on a canvas pad.
- **FR-10** Type a signature using a handwriting-style font.
- **FR-11** Upload a signature image (PNG/JPG with transparent background preferred).
- **FR-12** Place the chosen signature onto any position on any page by drag-and-drop.
- **FR-13** Resize and rotate the placed signature.
- **FR-14** Delete a placed signature.

### 2.4 Text Annotation
- **FR-15** Add a text box anywhere on the page.
- **FR-16** Configure font family, size, color, and bold/italic.
- **FR-17** Move, resize, and delete text boxes.

### 2.5 Highlighting & Markup
- **FR-18** Highlight text on the PDF with a configurable color.
- **FR-19** Add underline or strikethrough to selected text.
- **FR-20** Draw freehand lines/strokes (pen tool) with configurable color and stroke width.

### 2.6 Shapes
- **FR-21** Draw rectangles and ellipses with configurable fill, stroke color, and opacity.
- **FR-22** Draw straight lines with configurable color and width.
- **FR-23** Move, resize, and delete shapes.

### 2.7 Form Filling
- **FR-24** Detect and fill existing interactive PDF form fields (text inputs, checkboxes, radio buttons, dropdowns).
- **FR-25** Flatten form fields into the PDF on export so the values are baked in.

### 2.8 Page Management
- **FR-26** Delete a page from the current PDF.
- **FR-27** Reorder pages via drag-and-drop in the thumbnail sidebar.
- **FR-28** Merge a second PDF into the current document (append pages).

---

## 3. Non-Functional Requirements

- **NFR-01 Privacy** — No file data ever leaves the user's browser. All processing is client-side.
- **NFR-02 Performance** — Pages must render within 1 second for standard A4 PDFs up to 50 pages at 1x zoom on a modern laptop.
- **NFR-03 Compatibility** — Must work in Chrome 120+ and Edge 120+. Firefox support is best-effort.
- **NFR-04 Offline** — The app must be fully usable without an internet connection after initial load.
- **NFR-05 Persistence** — Annotation state is held in memory for the session; no server-side persistence required.

---

## 4. Technical Requirements

### 4.1 Frontend Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Strong ecosystem, strict typing |
| Build tool | Vite | Fast HMR, minimal config |
| PDF rendering | pdfjs-dist (Mozilla PDF.js) | Gold-standard browser PDF renderer |
| PDF manipulation | pdf-lib | Pure-JS library; can modify existing PDFs without round-tripping to a server |
| Signature drawing | react-signature-canvas | Simple canvas-based pad; outputs PNG data URL |
| Drag-and-resize | interact.js or react-rnd | Drag-and-drop + resize for placed annotations |
| State management | Zustand | Lightweight, no boilerplate |
| Styling | Tailwind CSS | Utility-first; fast iteration |
| UI components | shadcn/ui (built on Radix) | Accessible, unstyled primitives |
| Icons | Lucide React | Clean SVG icon set |

### 4.2 Backend Stack (Optional — Phase 2)

A Python backend is **not required for the MVP** because pdf-lib handles all PDF operations in the browser. However, a lightweight FastAPI service can be added later for:

- Certificate-based digital signatures (PKI / X.509)
- Server-side OCR via `pytesseract` or `pdfminer`
- Batch processing of many files
- Persistent storage (SQLite + SQLAlchemy)

If added:

| Concern | Choice |
|---|---|
| Framework | FastAPI |
| PDF library | pypdf + reportlab |
| Digital signing | python-pkcs11 / pyhanko |
| API format | REST + JSON |
| Auth | None (personal tool, localhost) |
| Database | SQLite |

### 4.3 Architecture

```
Browser
  └── React App (Vite)
        ├── PDF Viewer (pdfjs-dist → <canvas> per page)
        ├── Annotation Layer (<div> overlay per page, positioned absolutely)
        │     ├── Signature elements (react-rnd)
        │     ├── Text boxes (react-rnd + contentEditable)
        │     ├── Shape elements (SVG)
        │     └── Freehand strokes (<canvas>)
        └── State (Zustand)
              ├── pdfFile: ArrayBuffer
              ├── pages: page metadata
              ├── annotations: Map<pageIndex, Annotation[]>
              └── currentTool: enum
```

On export, `pdf-lib` loads the original ArrayBuffer, replays all annotations as native PDF objects (text, images, vector paths), then triggers a browser download.

### 4.4 Key Data Structures

```typescript
type AnnotationType = 'signature' | 'text' | 'rectangle' | 'ellipse'
  | 'line' | 'freehand' | 'highlight';

interface Annotation {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  x: number;          // fraction of page width (0–1)
  y: number;          // fraction of page height (0–1)
  width: number;      // fraction of page width
  height: number;     // fraction of page height
  // type-specific payload
  payload: SignaturePayload | TextPayload | ShapePayload | FreehandPayload;
}
```

Storing coordinates as fractions of page dimensions makes them resolution-independent.

### 4.5 Project Structure

```
PersonalPdfEditor/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AppShell, Sidebar, Header
│   │   │   ├── viewer/         # PDFViewer, PageCanvas, PageThumbnail
│   │   │   ├── toolbar/        # Toolbar, ToolButton
│   │   │   ├── annotations/    # AnnotationLayer, TextBox, ShapeEl, FreehandCanvas
│   │   │   ├── signature/      # SignatureModal, SignaturePad, SignatureText
│   │   │   └── export/         # ExportButton
│   │   ├── store/
│   │   │   └── usePdfStore.ts  # Zustand store
│   │   ├── utils/
│   │   │   ├── pdfRenderer.ts  # pdfjs helpers
│   │   │   └── pdfExporter.ts  # pdf-lib flatten logic
│   │   ├── types/
│   │   │   └── annotations.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                    # Phase 2 — optional Python service
│   ├── main.py
│   └── requirements.txt
├── REQUIREMENTS.md
├── IMPLEMENTATION_PLAN.md
└── .gitignore
```

### 4.6 Export Pipeline

1. User clicks "Download PDF".
2. Zustand store emits the original `ArrayBuffer` + all `Annotation[]`.
3. `pdfExporter.ts` loads the ArrayBuffer into `pdf-lib`.
4. For each annotation per page:
   - **Signature/image** → embed PNG via `page.drawImage()`
   - **Text box** → `page.drawText()` with font embedded via `pdf-lib/fontkit`
   - **Shape** → `page.drawRectangle()` / `page.drawEllipse()` / `page.drawLine()`
   - **Freehand** → serialize canvas strokes to SVG path, embed via `page.drawSvgPath()`
   - **Highlight** → semi-transparent rectangle over text bounding box
5. `pdfLib.save()` → `Uint8Array` → trigger browser download.

---

## 5. Milestones

| Phase | Scope | Target |
|---|---|---|
| 0 — Setup | Repo scaffold, Vite + React + Tailwind | Day 1 |
| 1 — Viewer | Open PDF, render pages, zoom, page nav | Day 1-2 |
| 2 — Signature | Draw/type/upload, place, resize, delete | Day 2-3 |
| 3 — Annotations | Text boxes, shapes, freehand, highlight | Day 3-5 |
| 4 — Export | Flatten all annotations to PDF, download | Day 5-6 |
| 5 — Page Mgmt | Delete/reorder pages, merge PDFs | Day 6-7 |
| 6 — Forms | Fill PDF form fields, flatten on export | Day 7-8 |
| 7 — Backend | FastAPI service for PKI signing (optional) | Future |
