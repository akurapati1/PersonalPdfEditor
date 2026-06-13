import { useEffect, useRef } from 'react';
import type { PdfjsDocument } from '@/utils/pdfRenderer';
import { renderPageToCanvas } from '@/utils/pdfRenderer';
import { usePdfStore } from '@/store/usePdfStore';

interface PageThumbnailProps {
  doc: PdfjsDocument;
  pageIndex: number;
}

export function PageThumbnail({ doc, pageIndex }: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPage = usePdfStore((s) => s.currentPage);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const page = await doc.getPage(pageIndex + 1);
      if (cancelled || !canvasRef.current) return;
      await renderPageToCanvas(page, canvasRef.current, 0.15);
    }
    render();
    return () => { cancelled = true; };
  }, [doc, pageIndex]);

  function scrollToPage() {
    setCurrentPage(pageIndex);
    document.getElementById(`page-${pageIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const isActive = currentPage === pageIndex;

  return (
    <button
      onClick={scrollToPage}
      className={`flex flex-col items-center gap-1 p-2 w-full hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-700 border-l-2 border-blue-400' : ''
      }`}
    >
      <div className="border border-gray-600 bg-white overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
      <span className="text-xs text-gray-400">{pageIndex + 1}</span>
    </button>
  );
}
