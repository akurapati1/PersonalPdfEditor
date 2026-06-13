export type ToolType =
  | 'select'
  | 'text'
  | 'signature'
  | 'pen'
  | 'highlight'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'eraser';

interface BaseAnnotation {
  id: string;
  pageIndex: number;
  /** Fraction of page width  (0–1) */
  x: number;
  /** Fraction of page height (0–1) */
  y: number;
  /** Fraction of page width  */
  width: number;
  /** Fraction of page height */
  height: number;
}

export interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature';
  dataUrl: string;
  rotation: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'ellipse' | 'line';
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  /** Normalized points (0–1 relative to page) */
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  color: string;
}

export type Annotation =
  | SignatureAnnotation
  | TextAnnotation
  | ShapeAnnotation
  | FreehandAnnotation
  | HighlightAnnotation;
