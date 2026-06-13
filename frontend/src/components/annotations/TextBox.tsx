import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Trash2 } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import type { TextAnnotation } from '@/types/annotations';

interface TextBoxProps {
  ann: TextAnnotation;
  pageWidth: number;
  pageHeight: number;
}

export function TextBox({ ann, pageWidth, pageHeight }: TextBoxProps) {
  const { updateAnnotation, deleteAnnotation, selectAnnotation, selectedAnnotationId } =
    usePdfStore();
  const [editing, setEditing] = useState(false);
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
      onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditing(true); }}
      bounds="parent"
      enableResizing={isSelected && !editing}
      disableDragging={editing}
      className={`group ${isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent hover:ring-blue-300'}`}
      style={{ zIndex: 10 }}
    >
      <div className="relative w-full h-full">
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={(e) => {
            setEditing(false);
            updateAnnotation(ann.id, ann.pageIndex, { content: e.currentTarget.textContent ?? '' });
          }}
          className="w-full h-full outline-none overflow-hidden break-words"
          style={{
            fontSize: ann.fontSize,
            fontFamily: ann.fontFamily,
            color: ann.color,
            fontWeight: ann.bold ? 'bold' : 'normal',
            fontStyle: ann.italic ? 'italic' : 'normal',
            cursor: editing ? 'text' : 'default',
          }}
        >
          {ann.content}
        </div>
        {isSelected && !editing && (
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
