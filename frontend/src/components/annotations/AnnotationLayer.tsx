import { useCallback, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { usePdfStore } from '@/store/usePdfStore';
import type { Annotation } from '@/types/annotations';
import { SignatureEl } from './SignatureEl';
import { TextBox } from './TextBox';
import { ShapeEl } from './ShapeEl';
import { FreehandCanvas } from './FreehandCanvas';
import { HighlightEl } from './HighlightEl';

interface AnnotationLayerProps {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
}

export function AnnotationLayer({ pageIndex, pageWidth, pageHeight }: AnnotationLayerProps) {
  const {
    activeTool,
    pendingSignatureDataUrl,
    setPendingSignature,
    addAnnotation,
    getPageAnnotations,
    textStyle,
    shapeStyle,
    highlightColor,
    selectAnnotation,
  } = usePdfStore();

  const annotations = getPageAnnotations(pageIndex);
  const layerRef = useRef<HTMLDivElement>(null);

  // Shape drawing state
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const isDrawingShape = useRef(false);

  function getRelativePos(e: React.MouseEvent) {
    const rect = layerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / pageWidth,
      y: (e.clientY - rect.top) / pageHeight,
    };
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawingShape.current) return;
      const pos = getRelativePos(e);

      if (activeTool === 'signature' && pendingSignatureDataUrl) {
        const ann: Annotation = {
          id: uuid(),
          type: 'signature',
          pageIndex,
          x: pos.x - 0.1,
          y: pos.y - 0.05,
          width: 0.2,
          height: 0.08,
          dataUrl: pendingSignatureDataUrl,
          rotation: 0,
        };
        addAnnotation(ann);
        setPendingSignature(null);
        return;
      }

      if (activeTool === 'text') {
        const ann: Annotation = {
          id: uuid(),
          type: 'text',
          pageIndex,
          x: pos.x,
          y: pos.y,
          width: 0.3,
          height: 0.08,
          content: 'Text',
          fontSize: textStyle.fontSize,
          fontFamily: textStyle.fontFamily,
          color: textStyle.color,
          bold: textStyle.bold,
          italic: textStyle.italic,
        };
        addAnnotation(ann);
        return;
      }

      if (activeTool === 'highlight') {
        const ann: Annotation = {
          id: uuid(),
          type: 'highlight',
          pageIndex,
          x: pos.x,
          y: pos.y,
          width: 0.2,
          height: 0.03,
          color: highlightColor,
        };
        addAnnotation(ann);
        return;
      }

      selectAnnotation(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTool, pendingSignatureDataUrl, pageIndex, textStyle, highlightColor]
  );

  function handleMouseDown(e: React.MouseEvent) {
    if (!['rectangle', 'ellipse', 'line'].includes(activeTool)) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    setDrawStart(pos);
    setDrawCurrent(pos);
    isDrawingShape.current = true;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDrawingShape.current || !drawStart) return;
    setDrawCurrent(getRelativePos(e));
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!isDrawingShape.current || !drawStart) return;
    isDrawingShape.current = false;
    const end = getRelativePos(e);
    const x = Math.min(drawStart.x, end.x);
    const y = Math.min(drawStart.y, end.y);
    const w = Math.abs(end.x - drawStart.x);
    const h = Math.abs(end.y - drawStart.y);
    if (w < 0.005 || h < 0.005) { setDrawStart(null); setDrawCurrent(null); return; }

    const ann: Annotation = {
      id: uuid(),
      type: activeTool as 'rectangle' | 'ellipse' | 'line',
      pageIndex,
      x, y, width: w, height: h,
      strokeColor: shapeStyle.strokeColor,
      strokeWidth: shapeStyle.strokeWidth,
      fillColor: shapeStyle.fillColor,
      fillOpacity: shapeStyle.fillOpacity,
    };
    addAnnotation(ann);
    setDrawStart(null);
    setDrawCurrent(null);
  }

  const showCrosshair = ['rectangle', 'ellipse', 'line', 'text', 'signature', 'highlight'].includes(activeTool);
  const showPen = activeTool === 'pen';

  return (
    <div
      ref={layerRef}
      className="absolute inset-0"
      style={{ cursor: showCrosshair ? 'crosshair' : showPen ? 'none' : 'default' }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Rendered annotations */}
      {annotations.map((ann) => {
        switch (ann.type) {
          case 'signature':
            return <SignatureEl key={ann.id} ann={ann} pageWidth={pageWidth} pageHeight={pageHeight} />;
          case 'text':
            return <TextBox key={ann.id} ann={ann} pageWidth={pageWidth} pageHeight={pageHeight} />;
          case 'rectangle':
          case 'ellipse':
          case 'line':
            return <ShapeEl key={ann.id} ann={ann} pageWidth={pageWidth} pageHeight={pageHeight} />;
          case 'freehand':
            return null; // Rendered by FreehandCanvas
          case 'highlight':
            return <HighlightEl key={ann.id} ann={ann} pageWidth={pageWidth} pageHeight={pageHeight} />;
          default:
            return null;
        }
      })}

      {/* Live shape preview while drawing */}
      {isDrawingShape.current && drawStart && drawCurrent && (
        <ShapePreview
          tool={activeTool as 'rectangle' | 'ellipse' | 'line'}
          start={drawStart}
          current={drawCurrent}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          strokeColor={shapeStyle.strokeColor}
          strokeWidth={shapeStyle.strokeWidth}
          fillColor={shapeStyle.fillColor}
          fillOpacity={shapeStyle.fillOpacity}
        />
      )}

      {/* Freehand pen layer (handles its own events when pen tool active) */}
      {showPen && (
        <FreehandCanvas
          pageIndex={pageIndex}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
        />
      )}

      {/* Freehand strokes rendered as SVG overlay */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={pageWidth}
        height={pageHeight}
      >
        {annotations
          .filter((a) => a.type === 'freehand')
          .map((a) => {
            if (a.type !== 'freehand') return null;
            const d = a.points
              .map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${p.x * pageWidth} ${p.y * pageHeight}`
              )
              .join(' ');
            return (
              <path
                key={a.id}
                d={d}
                stroke={a.color}
                strokeWidth={a.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live shape preview component                                         */
/* ------------------------------------------------------------------ */
interface ShapePreviewProps {
  tool: 'rectangle' | 'ellipse' | 'line';
  start: { x: number; y: number };
  current: { x: number; y: number };
  pageWidth: number;
  pageHeight: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
}

function ShapePreview({
  tool, start, current, pageWidth, pageHeight, strokeColor, strokeWidth, fillColor, fillOpacity,
}: ShapePreviewProps) {
  const x = Math.min(start.x, current.x) * pageWidth;
  const y = Math.min(start.y, current.y) * pageHeight;
  const w = Math.abs(current.x - start.x) * pageWidth;
  const h = Math.abs(current.y - start.y) * pageHeight;
  const fill = fillOpacity > 0 ? fillColor : 'none';

  return (
    <svg className="absolute inset-0 pointer-events-none" width={pageWidth} height={pageHeight}>
      {tool === 'rectangle' && (
        <rect x={x} y={y} width={w} height={h}
          stroke={strokeColor} strokeWidth={strokeWidth}
          fill={fill} fillOpacity={fillOpacity} strokeDasharray="6 3" />
      )}
      {tool === 'ellipse' && (
        <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2}
          stroke={strokeColor} strokeWidth={strokeWidth}
          fill={fill} fillOpacity={fillOpacity} strokeDasharray="6 3" />
      )}
      {tool === 'line' && (
        <line
          x1={start.x * pageWidth} y1={start.y * pageHeight}
          x2={current.x * pageWidth} y2={current.y * pageHeight}
          stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray="6 3" />
      )}
    </svg>
  );
}
