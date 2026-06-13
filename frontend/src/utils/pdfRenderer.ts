import * as pdfjs from 'pdfjs-dist';

// Point the worker at the bundled worker file
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export type PdfjsDocument = pdfjs.PDFDocumentProxy;
export type PdfjsPage = pdfjs.PDFPageProxy;

export async function loadPdfjsDocument(bytes: Uint8Array): Promise<PdfjsDocument> {
  const loadingTask = pdfjs.getDocument({ data: bytes });
  return loadingTask.promise;
}

export async function renderPageToCanvas(
  page: PdfjsPage,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void> {
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  await page.render({ canvasContext: ctx, viewport }).promise;
}

export function getPageViewport(page: PdfjsPage, scale: number) {
  return page.getViewport({ scale });
}
