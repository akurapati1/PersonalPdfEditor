import { PDFDocument, rgb, StandardFonts, BlendMode } from 'pdf-lib';
import type {
  Annotation,
  SignatureAnnotation,
  TextAnnotation,
  ShapeAnnotation,
  FreehandAnnotation,
  HighlightAnnotation,
} from '@/types/annotations';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

function pointsToSvgPath(
  points: Array<{ x: number; y: number }>,
  pw: number,
  ph: number
): string {
  if (points.length < 2) return '';
  const toCoord = (p: { x: number; y: number }) =>
    `${p.x * pw},${ph - p.y * ph}`;
  return `M ${toCoord(points[0])} ` + points.slice(1).map((p) => `L ${toCoord(p)}`).join(' ');
}

export async function exportPdf(
  originalBytes: Uint8Array,
  allAnnotations: Record<number, Annotation[]>,
  fileName: string
): Promise<void> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    const { width: pw, height: ph } = page.getSize();
    const annotations = allAnnotations[pageIdx] ?? [];

    for (const ann of annotations) {
      // pdf-lib origin is bottom-left; browser is top-left — flip Y
      const x = ann.x * pw;
      const y = ph - ann.y * ph - ann.height * ph;
      const w = ann.width * pw;
      const h = ann.height * ph;

      switch (ann.type) {
        case 'signature': {
          const sig = ann as SignatureAnnotation;
          const imgBytes = await fetch(sig.dataUrl).then((r) => r.arrayBuffer());
          const img = sig.dataUrl.startsWith('data:image/png')
            ? await pdfDoc.embedPng(imgBytes)
            : await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { x, y, width: w, height: h });
          break;
        }

        case 'text': {
          const txt = ann as TextAnnotation;
          const font = txt.bold ? helveticaBold : helvetica;
          const size = (txt.fontSize / 96) * 72; // px → pt
          page.drawText(txt.content, {
            x,
            y: y + h - size,
            size,
            font,
            color: hexToRgb(txt.color),
            maxWidth: w,
            lineHeight: size * 1.2,
          });
          break;
        }

        case 'rectangle': {
          const shape = ann as ShapeAnnotation;
          page.drawRectangle({
            x, y, width: w, height: h,
            borderColor: hexToRgb(shape.strokeColor),
            borderWidth: shape.strokeWidth,
            color: shape.fillOpacity > 0
              ? hexToRgb(shape.fillColor)
              : undefined,
            opacity: shape.fillOpacity,
          });
          break;
        }

        case 'ellipse': {
          const shape = ann as ShapeAnnotation;
          page.drawEllipse({
            x: x + w / 2,
            y: y + h / 2,
            xScale: w / 2,
            yScale: h / 2,
            borderColor: hexToRgb(shape.strokeColor),
            borderWidth: shape.strokeWidth,
            color: shape.fillOpacity > 0
              ? hexToRgb(shape.fillColor)
              : undefined,
            opacity: shape.fillOpacity,
          });
          break;
        }

        case 'line': {
          const shape = ann as ShapeAnnotation;
          page.drawLine({
            start: { x, y },
            end: { x: x + w, y: y + h },
            color: hexToRgb(shape.strokeColor),
            thickness: shape.strokeWidth,
          });
          break;
        }

        case 'freehand': {
          const fh = ann as FreehandAnnotation;
          const svgPath = pointsToSvgPath(fh.points, pw, ph);
          if (svgPath) {
            page.drawSvgPath(svgPath, {
              borderColor: hexToRgb(fh.color),
              borderWidth: fh.strokeWidth,
              x: 0,
              y: ph,
            });
          }
          break;
        }

        case 'highlight': {
          const hl = ann as HighlightAnnotation;
          page.drawRectangle({
            x, y, width: w, height: h,
            color: hexToRgb(hl.color),
            opacity: 0.35,
            blendMode: BlendMode.Multiply,
          });
          break;
        }
      }
    }
  }

  const savedBytes = (await pdfDoc.save()) as Uint8Array<ArrayBuffer>;
  const blob = new Blob([savedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.pdf$/i, '') + '_edited.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
