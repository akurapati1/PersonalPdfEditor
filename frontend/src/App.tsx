import { usePdfStore } from '@/store/usePdfStore';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { PDFDropzone } from '@/components/viewer/PDFDropzone';

export default function App() {
  const pdfBytes = usePdfStore((s) => s.pdfBytes);

  // PDFViewer renders both sidebar thumbnails and page canvases;
  // we split them by rendering PDFViewer into a context and extracting.
  // Simpler approach: render sidebar and main separately.

  return (
    <AppShell
      header={<Header />}
      toolbar={<Toolbar />}
      sidebar={pdfBytes ? <SidebarContent /> : <div />}
    >
      {pdfBytes ? <MainContent /> : <PDFDropzone />}
    </AppShell>
  );
}

function SidebarContent() {
  return <PDFViewerSidebar />;
}

function MainContent() {
  return <PDFViewerMain />;
}

/* ------------------------------------------------------------------ */
/* Split viewer components so sidebar and main can mount separately    */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from 'react';
import { loadPdfjsDocument, type PdfjsDocument } from '@/utils/pdfRenderer';
import { PageCanvas } from '@/components/viewer/PageCanvas';
import { PageThumbnail } from '@/components/viewer/PageThumbnail';

function usePdfjsDoc() {
  const { pdfBytes, setNumPages } = usePdfStore();
  const [doc, setDoc] = useState<PdfjsDocument | null>(null);

  useEffect(() => {
    if (!pdfBytes) { setDoc(null); return; }
    let cancelled = false;
    loadPdfjsDocument(pdfBytes).then((d) => {
      if (cancelled) return;
      setDoc(d);
      setNumPages(d.numPages);
    });
    return () => { cancelled = true; };
  }, [pdfBytes, setNumPages]);

  return doc;
}

function PDFViewerSidebar() {
  const doc = usePdfjsDoc();
  if (!doc) return null;
  return (
    <div className="flex flex-col pt-2">
      {Array.from({ length: doc.numPages }, (_, i) => (
        <PageThumbnail key={i} doc={doc} pageIndex={i} />
      ))}
    </div>
  );
}

function PDFViewerMain() {
  const doc = usePdfjsDoc();
  if (!doc) return null;
  return (
    <div className="flex flex-col items-center py-6 px-4">
      {Array.from({ length: doc.numPages }, (_, i) => (
        <div key={i} id={`page-${i}`} className="w-full flex justify-center">
          <PageCanvas doc={doc} pageIndex={i} />
        </div>
      ))}
    </div>
  );
}
