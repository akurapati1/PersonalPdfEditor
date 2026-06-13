import { FileText, Download, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';
import { exportPdf } from '@/utils/pdfExporter';

export function Header() {
  const { fileName, numPages, currentPage, zoom, setZoom, pdfBytes, annotations, clearAll } =
    usePdfStore();

  async function handleDownload() {
    if (!pdfBytes || !fileName) return;
    await exportPdf(pdfBytes, annotations, fileName);
  }

  return (
    <header className="flex items-center gap-4 px-4 py-2 bg-gray-900 text-white shadow-lg">
      <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
        <FileText size={22} />
        <span>PDF Editor</span>
      </div>

      <div className="flex-1 flex items-center gap-2 ml-4 text-sm text-gray-300 truncate">
        {fileName ? (
          <>
            <span className="truncate max-w-xs">{fileName}</span>
            {numPages > 0 && (
              <span className="text-gray-500 flex-none">
                — Page {currentPage + 1} / {numPages}
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-500 italic">No file open</span>
        )}
      </div>

      {fileName && (
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(zoom - 0.25)}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(zoom + 0.25)}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
          >
            <Download size={16} />
            Download PDF
          </button>

          {/* Close */}
          <button
            onClick={clearAll}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
            title="Close file"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </header>
  );
}
