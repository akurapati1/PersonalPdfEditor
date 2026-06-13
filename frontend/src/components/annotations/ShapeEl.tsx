import { Rnd } from 'react-rnd';
import { Trash2 } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import type { ShapeAnnotation } from '@/types/annotations';

interface ShapeElProps {
  ann: ShapeAnnotation;
  pageWidth: number;
  pageHeight: number;
}

export function ShapeEl({ ann, pageWidth, pageHeight }: ShapeElProps) {
  const { updateAnnotation, deleteAnnotation, selectAnnotation, selectedAnnotationId } =
    usePdfStore();
  const isSelected = selectedAnnotationId === ann.id;

  const x = ann.x * pageWidth;
  const y = ann.y * pageHeight;
  const w = ann.width * pageWidth;
  const h = ann.height * pageHeight;

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      onDragStop={(_e, d) =>
        updateAnnotation(ann.id, ann.pageIndex, {
          x: d.x / pageWidth,
          y: d.y / pageHeight,
        })
      }
      onResizeStop={(_e, _dir, _ref, _delta, pos) => {
        const el = _ref as HTMLElement;
        updateAnnotation(ann.id, ann.pageIndex, {
          x: pos.x / pageWidth,
          y: pos.y / pageHeight,
          width: el.offsetWidth / pageWidth,
          height: el.offsetHeight / pageHeight,
        });
      }}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); selectAnnotation(ann.id); }}
      bounds="parent"
      enableResizing={isSelected}
      style={{ zIndex: 10 }}
    >
      <div className="relative w-full h-full">
        <svg className="absolute inset-0" width="100%" height="100%">
          {ann.type === 'rectangle' && (
            <rect
              x={ann.strokeWidth / 2}
              y={ann.strokeWidth / 2}
              width={`calc(100% - ${ann.strokeWidth}px)`}
              height={`calc(100% - ${ann.strokeWidth}px)`}
              stroke={ann.strokeColor}
              strokeWidth={ann.strokeWidth}
              fill={ann.fillColor}
              fillOpacity={ann.fillOpacity}
            />
          )}
          {ann.type === 'ellipse' && (
            <ellipse
              cx="50%" cy="50%"
              rx={`calc(50% - ${ann.strokeWidth / 2}px)`}
              ry={`calc(50% - ${ann.strokeWidth / 2}px)`}
              stroke={ann.strokeColor}
              strokeWidth={ann.strokeWidth}
              fill={ann.fillColor}
              fillOpacity={ann.fillOpacity}
            />
          )}
          {ann.type === 'line' && (
            <line
              x1="0" y1="0" x2="100%" y2="100%"
              stroke={ann.strokeColor}
              strokeWidth={ann.strokeWidth}
            />
          )}
        </svg>
        {isSelected && (
          <button
            className="absolute -top-6 right-0 p-1 bg-red-500 text-white rounded shadow hover:bg-red-600 z-20"
            onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, ann.pageIndex); }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </Rnd>
  );
}
