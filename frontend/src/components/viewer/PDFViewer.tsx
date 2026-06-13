import { useEffect, useState } from 'react';
import { loadPdfjsDocument, type PdfjsDocument } from '@/utils/pdfRenderer';
import { usePdfStore } from '@/store/usePdfStore';
import { PageCanvas } from './PageCanvas';
import { PageThumbnail } from './PageThumbnail';

export function PDFViewer() {
  const { pdfBytes, setNumPages } = usePdfStore();
  const [doc, setDoc] = useState<PdfjsDocument | null>(null);
  const [pages, setPages] = useState<number[]>([]);

  useEffect(() => {
    if (!pdfBytes) { setDoc(null); setPages([]); return; }

    let cancelled = false;
    loadPdfjsDocument(pdfBytes).then((loaded) => {
      if (cancelled) return;
      setDoc(loaded);
      const count = loaded.numPages;
      setNumPages(count);
      setPages(Array.from({ length: count }, (_, i) => i));
    });

    return () => { cancelled = true; };
  }, [pdfBytes, setNumPages]);

  if (!doc) return null;

  return (
    <>
      {/* Sidebar thumbnails */}
      <div className="flex flex-col pt-2">
        {pages.map((i) => (
          <PageThumbnail key={i} doc={doc} pageIndex={i} />
        ))}
      </div>

      {/* Main pages */}
      <div className="flex flex-col items-center py-6 px-4 min-h-full">
        {pages.map((i) => (
          <div key={i} id={`page-${i}`} className="w-full flex justify-center">
            <PageCanvas doc={doc} pageIndex={i} />
          </div>
        ))}
      </div>
    </>
  );
}
