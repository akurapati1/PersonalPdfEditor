import { useRef, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { usePdfStore } from '@/store/usePdfStore';
import type { FreehandAnnotation } from '@/types/annotations';

interface FreehandCanvasProps {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
}

export function FreehandCanvas({ pageIndex, pageWidth, pageHeight }: FreehandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<Array<{ x: number; y: number }>>([]);
  const { penColor, penWidth, addAnnotation } = usePdfStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function getPos(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / pageWidth,
        y: (e.clientY - rect.top) / pageHeight,
      };
    }

    function onPointerDown(e: PointerEvent) {
      e.stopPropagation();
      isDrawing.current = true;
      currentPoints.current = [getPos(e)];
      ctx!.beginPath();
      ctx!.strokeStyle = penColor;
      ctx!.lineWidth = penWidth;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      const p = currentPoints.current[0];
      ctx!.moveTo(p.x * pageWidth, p.y * pageHeight);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDrawing.current) return;
      e.stopPropagation();
      const p = getPos(e);
      currentPoints.current.push(p);
      ctx!.lineTo(p.x * pageWidth, p.y * pageHeight);
      ctx!.stroke();
    }

    function onPointerUp(_e: PointerEvent) {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const pts = [...currentPoints.current];
      currentPoints.current = [];

      // Clear temp canvas
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      if (pts.length < 2) return;

      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(...xs) - x;
      const h = Math.max(...ys) - y;

      const ann: FreehandAnnotation = {
        id: uuid(),
        type: 'freehand',
        pageIndex,
        x, y,
        width: w || 0.001,
        height: h || 0.001,
        points: pts,
        color: penColor,
        strokeWidth: penWidth,
      };
      addAnnotation(ann);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
    };
  }, [pageIndex, pageWidth, pageHeight, penColor, penWidth, addAnnotation]);

  return (
    <canvas
      ref={canvasRef}
      width={pageWidth}
      height={pageHeight}
      className="absolute inset-0 cursor-crosshair"
      style={{ zIndex: 20 }}
    />
  );
}
