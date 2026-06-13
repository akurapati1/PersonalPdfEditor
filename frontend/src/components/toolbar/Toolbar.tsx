import { MousePointer2, Type, PenLine, Highlighter, Square, Circle, Minus, Eraser, FileSignature } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import type { ToolType } from '@/types/annotations';
import { SignatureModal } from '@/components/signature/SignatureModal';
import { useState } from 'react';

interface ToolDef {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
}

const tools: ToolDef[] = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text', icon: <Type size={18} />, label: 'Text' },
  { id: 'signature', icon: <FileSignature size={18} />, label: 'Signature' },
  { id: 'pen', icon: <PenLine size={18} />, label: 'Pen' },
  { id: 'highlight', icon: <Highlighter size={18} />, label: 'Highlight' },
  { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle' },
  { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse' },
  { id: 'line', icon: <Minus size={18} />, label: 'Line' },
  { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser' },
];

export function Toolbar() {
  const { activeTool, setActiveTool, fileName, penColor, setPenColor, penWidth, setPenWidth,
    highlightColor, setHighlightColor, shapeStyle, setShapeStyle, textStyle, setTextStyle } =
    usePdfStore();

  const [sigModalOpen, setSigModalOpen] = useState(false);

  if (!fileName) return null;

  function handleToolClick(id: ToolType) {
    if (id === 'signature') {
      setSigModalOpen(true);
      setActiveTool('signature');
    } else {
      setActiveTool(id);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 border-b border-gray-700 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => handleToolClick(t.id)}
            title={t.label}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors
              ${activeTool === t.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'}
            `}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Context-sensitive options */}
        {activeTool === 'pen' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Color</label>
            <input
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
            <label className="text-xs text-gray-400">Width</label>
            <input
              type="range" min={1} max={20} value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              className="w-20"
            />
          </div>
        )}

        {activeTool === 'highlight' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Color</label>
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => setHighlightColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        )}

        {(activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line') && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Stroke</label>
            <input
              type="color"
              value={shapeStyle.strokeColor}
              onChange={(e) => setShapeStyle({ strokeColor: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
            <label className="text-xs text-gray-400">Fill</label>
            <input
              type="color"
              value={shapeStyle.fillColor}
              onChange={(e) => setShapeStyle({ fillColor: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
            <label className="text-xs text-gray-400">Opacity</label>
            <input
              type="range" min={0} max={100}
              value={Math.round(shapeStyle.fillOpacity * 100)}
              onChange={(e) => setShapeStyle({ fillOpacity: Number(e.target.value) / 100 })}
              className="w-20"
            />
            <label className="text-xs text-gray-400">Width</label>
            <input
              type="range" min={1} max={10} value={shapeStyle.strokeWidth}
              onChange={(e) => setShapeStyle({ strokeWidth: Number(e.target.value) })}
              className="w-16"
            />
          </div>
        )}

        {activeTool === 'text' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Color</label>
            <input
              type="color"
              value={textStyle.color}
              onChange={(e) => setTextStyle({ color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
            <label className="text-xs text-gray-400">Size</label>
            <input
              type="number" min={8} max={96} value={textStyle.fontSize}
              onChange={(e) => setTextStyle({ fontSize: Number(e.target.value) })}
              className="w-14 bg-gray-700 text-white rounded px-1 py-0.5 text-xs"
            />
            <button
              onClick={() => setTextStyle({ bold: !textStyle.bold })}
              className={`px-2 py-0.5 rounded text-sm font-bold ${textStyle.bold ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              B
            </button>
            <button
              onClick={() => setTextStyle({ italic: !textStyle.italic })}
              className={`px-2 py-0.5 rounded text-sm italic ${textStyle.italic ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              I
            </button>
          </div>
        )}
      </div>

      <SignatureModal open={sigModalOpen} onClose={() => setSigModalOpen(false)} />
    </>
  );
}
