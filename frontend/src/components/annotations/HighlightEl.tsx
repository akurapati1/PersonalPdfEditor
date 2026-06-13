import { Rnd } from 'react-rnd';
import { Trash2 } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import type { HighlightAnnotation } from '@/types/annotations';

interface HighlightElProps {
  ann: HighlightAnnotation;
  pageWidth: number;
  pageHeight: number;
}

export function HighlightEl({ ann, pageWidth, pageHeight }: HighlightElProps) {
  const { updateAnnotation, deleteAnnotation, selectAnnotation, selectedAnnotationId } =
    usePdfStore();
  const isSelected = selectedAnnotationId === ann.id;

  return (
    <Rnd
      position={{ x: ann.x * pageWidth, y: ann.y * pageHeight }}
      size={{ width: ann.width * pageWidth, height: ann.height * pageHeight }}
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
      style={{ zIndex: 5 }}
    >
      <div
        className="relative w-full h-full"
        style={{ backgroundColor: ann.color, opacity: 0.4, mixBlendMode: 'multiply' }}
      >
        {isSelected && (
          <button
            className="absolute -top-6 right-0 p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
            style={{ opacity: 1, mixBlendMode: 'normal' }}
            onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, ann.pageIndex); }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </Rnd>
  );
}
