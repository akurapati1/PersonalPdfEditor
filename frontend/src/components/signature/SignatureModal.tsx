import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check, Upload } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';

const CURSIVE_FONTS = [
  { label: 'Dancing Script', value: "'Dancing Script', cursive" },
  { label: 'Pacifico', value: "'Pacifico', cursive" },
  { label: 'Caveat', value: "'Caveat', cursive" },
];

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignatureModal({ open, onClose }: SignatureModalProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPendingSignature } = usePdfStore();

  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState(CURSIVE_FONTS[0].value);
  const [textColor, setTextColor] = useState('#000000');

  if (!open) return null;

  function handleClear() {
    sigCanvasRef.current?.clear();
  }

  function handleConfirmDraw() {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;
    const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    setPendingSignature(dataUrl);
    onClose();
  }

  function handleConfirmType() {
    if (!typedText.trim()) return;
    // Render typed text to an offscreen canvas
    const canvas = document.createElement('canvas');
    const fontSize = 48;
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText, 10, canvas.height / 2);
    setPendingSignature(canvas.toDataURL('image/png'));
    onClose();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPendingSignature(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-full mx-4">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Add Signature</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['draw', 'type', 'upload'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors
                ${tab === t
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'draw' ? 'Draw' : t === 'type' ? 'Type' : 'Upload'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'draw' && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Draw your signature below</p>
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  canvasProps={{ width: 430, height: 160, className: 'block' }}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  <RotateCcw size={14} /> Clear
                </button>
                <button
                  onClick={handleConfirmDraw}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 ml-auto"
                >
                  <Check size={14} /> Use Signature
                </button>
              </div>
            </div>
          )}

          {tab === 'type' && (
            <div>
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  {CURSIVE_FONTS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                />
              </div>
              <input
                type="text"
                placeholder="Type your name…"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              {typedText && (
                <div
                  className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50 text-center overflow-hidden"
                  style={{ fontFamily: selectedFont, fontSize: 36, color: textColor }}
                >
                  {typedText}
                </div>
              )}
              <button
                onClick={handleConfirmType}
                disabled={!typedText.trim()}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Check size={14} /> Use Signature
              </button>
            </div>
          )}

          {tab === 'upload' && (
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Upload size={32} className="text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload PNG or JPG</span>
                <span className="text-xs text-gray-400">PNG with transparent background recommended</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
