import { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';

export function PDFDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadPdf = usePdfStore((s) => s.loadPdf);

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target!.result as ArrayBuffer);
      loadPdf(bytes, file.name);
    };
    reader.readAsArrayBuffer(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="
          flex flex-col items-center gap-6 p-16 w-full max-w-lg
          border-2 border-dashed border-gray-400 rounded-2xl
          bg-white hover:bg-blue-50 hover:border-blue-400
          cursor-pointer transition-colors
        "
      >
        <div className="p-5 bg-blue-100 rounded-full">
          <FileText size={48} className="text-blue-500" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">Open a PDF</p>
          <p className="mt-1 text-sm text-gray-500">
            Drag & drop a PDF here, or click to browse
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <Upload size={16} />
          Choose File
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
        />
      </div>
    </div>
  );
}
