import { useEffect, useRef, useState } from 'react';
import type { PdfjsDocument } from '@/utils/pdfRenderer';
import { renderPageToCanvas } from '@/utils/pdfRenderer';
import { AnnotationLayer } from '@/components/annotations/AnnotationLayer';
import { usePdfStore } from '@/store/usePdfStore';

interface PageCanvasProps {
  doc: PdfjsDocument;
  pageIndex: number;
}

export function PageCanvas({ doc, pageIndex }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoom = usePdfStore((s) => s.zoom);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);

  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const page = await doc.getPage(pageIndex + 1);
      if (cancelled || !canvasRef.current) return;
      await renderPageToCanvas(page, canvasRef.current, zoom);
      const vp = page.getViewport({ scale: zoom });
      if (!cancelled) setPageSize({ width: vp.width, height: vp.height });
    }

    render();
    return () => { cancelled = true; };
  }, [doc, pageIndex, zoom]);

  // Intersection observer to update current page
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCurrentPage(pageIndex);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageIndex, setCurrentPage]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto my-4 shadow-xl"
      style={{ width: pageSize.width || 'auto', height: pageSize.height || 'auto' }}
    >
      <canvas ref={canvasRef} className="block" />
      {pageSize.width > 0 && (
        <AnnotationLayer
          pageIndex={pageIndex}
          pageWidth={pageSize.width}
          pageHeight={pageSize.height}
        />
      )}
    </div>
  );
}
