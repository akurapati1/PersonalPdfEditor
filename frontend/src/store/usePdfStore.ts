import { create } from 'zustand';
import type { Annotation, ToolType } from '@/types/annotations';

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

interface ShapeStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
}

interface PdfState {
  // File
  fileName: string | null;
  pdfBytes: Uint8Array | null;
  numPages: number;

  // Navigation
  currentPage: number;
  zoom: number;

  // Tools
  activeTool: ToolType;
  pendingSignatureDataUrl: string | null;
  textStyle: TextStyle;
  shapeStyle: ShapeStyle;
  penColor: string;
  penWidth: number;
  highlightColor: string;

  // Annotations keyed by page index
  annotations: Record<number, Annotation[]>;
  selectedAnnotationId: string | null;

  // Actions
  loadPdf: (bytes: Uint8Array, name: string) => void;
  setNumPages: (n: number) => void;
  setCurrentPage: (p: number) => void;
  setZoom: (z: number) => void;
  setActiveTool: (t: ToolType) => void;
  setPendingSignature: (dataUrl: string | null) => void;
  setTextStyle: (style: Partial<TextStyle>) => void;
  setShapeStyle: (style: Partial<ShapeStyle>) => void;
  setPenColor: (c: string) => void;
  setPenWidth: (w: number) => void;
  setHighlightColor: (c: string) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, pageIndex: number, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string, pageIndex: number) => void;
  selectAnnotation: (id: string | null) => void;
  getPageAnnotations: (pageIndex: number) => Annotation[];
  updatePdfBytes: (bytes: Uint8Array) => void;
  clearAll: () => void;
}

export const usePdfStore = create<PdfState>((set, get) => ({
  fileName: null,
  pdfBytes: null,
  numPages: 0,
  currentPage: 0,
  zoom: 1.0,
  activeTool: 'select',
  pendingSignatureDataUrl: null,
  textStyle: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#000000',
    bold: false,
    italic: false,
  },
  shapeStyle: {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: '#000000',
    fillOpacity: 0,
  },
  penColor: '#000000',
  penWidth: 3,
  highlightColor: '#FFFF00',
  annotations: {},
  selectedAnnotationId: null,

  loadPdf: (bytes, name) =>
    set({ pdfBytes: bytes, fileName: name, annotations: {}, currentPage: 0 }),

  setNumPages: (n) => set({ numPages: n }),
  setCurrentPage: (p) => set({ currentPage: p }),
  setZoom: (z) => set({ zoom: Math.min(Math.max(z, 0.25), 4) }),
  setActiveTool: (t) => set({ activeTool: t, selectedAnnotationId: null }),
  setPendingSignature: (dataUrl) => set({ pendingSignatureDataUrl: dataUrl }),
  setTextStyle: (style) =>
    set((s) => ({ textStyle: { ...s.textStyle, ...style } })),
  setShapeStyle: (style) =>
    set((s) => ({ shapeStyle: { ...s.shapeStyle, ...style } })),
  setPenColor: (c) => set({ penColor: c }),
  setPenWidth: (w) => set({ penWidth: w }),
  setHighlightColor: (c) => set({ highlightColor: c }),

  addAnnotation: (annotation) =>
    set((s) => {
      const page = s.annotations[annotation.pageIndex] ?? [];
      return {
        annotations: {
          ...s.annotations,
          [annotation.pageIndex]: [...page, annotation],
        },
      };
    }),

  updateAnnotation: (id, pageIndex, updates) =>
    set((s) => {
      const page = s.annotations[pageIndex] ?? [];
      return {
        annotations: {
          ...s.annotations,
          [pageIndex]: page.map((a) =>
            a.id === id ? ({ ...a, ...updates } as Annotation) : a
          ),
        },
      };
    }),

  deleteAnnotation: (id, pageIndex) =>
    set((s) => {
      const page = s.annotations[pageIndex] ?? [];
      return {
        annotations: {
          ...s.annotations,
          [pageIndex]: page.filter((a) => a.id !== id),
        },
        selectedAnnotationId:
          s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
      };
    }),

  selectAnnotation: (id) => set({ selectedAnnotationId: id }),

  getPageAnnotations: (pageIndex) => get().annotations[pageIndex] ?? [],

  updatePdfBytes: (bytes) => set({ pdfBytes: bytes }),

  clearAll: () =>
    set({
      fileName: null,
      pdfBytes: null,
      numPages: 0,
      currentPage: 0,
      annotations: {},
      selectedAnnotationId: null,
      pendingSignatureDataUrl: null,
    }),
}));
