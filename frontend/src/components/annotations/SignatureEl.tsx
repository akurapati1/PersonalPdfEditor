import { Rnd } from 'react-rnd';
import { Trash2 } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import type { SignatureAnnotation } from '@/types/annotations';

interface SignatureElProps {
  ann: SignatureAnnotation;
  pageWidth: number;
  pageHeight: number;
}

export function SignatureEl({ ann, pageWidth, pageHeight }: SignatureElProps) {
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
      disableDragging={false}
      className={`group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{ zIndex: 10 }}
    >
      <div className="relative w-full h-full">
        <img src={ann.dataUrl} alt="signature" className="w-full h-full object-contain" draggable={false} />
        {isSelected && (
          <button
            className="absolute -top-6 right-0 p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
            onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, ann.pageIndex); }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </Rnd>
  );
}
