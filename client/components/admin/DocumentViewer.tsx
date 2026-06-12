import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface DocumentViewerProps {
  url: string;
  fileName?: string;
  mimeHint?: string;
}

function isPdf(url: string, mimeHint?: string): boolean {
  const lower = url.toLowerCase();
  return (
    mimeHint === "application/pdf" ||
    lower.includes(".pdf") ||
    lower.includes("application%2Fpdf")
  );
}

function isImage(url: string, mimeHint?: string): boolean {
  if (mimeHint?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

function PdfCanvasViewer({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError(null);
      try {
        const task = pdfjs.getDocument({ url, withCredentials: false });
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unable to render PDF");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-red-400 text-center px-4">{error}</p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full max-h-full object-contain"
    />
  );
}

export function DocumentViewer({ url, fileName, mimeHint }: DocumentViewerProps) {
  if (!url) {
    return (
      <p className="text-xs text-[#A8A8A8] text-center">
        Document URL unavailable.
      </p>
    );
  }

  const pdf = isPdf(url, mimeHint);
  const image = !pdf && isImage(url, mimeHint);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 min-h-[280px] flex items-center justify-center overflow-auto rounded-2xl border border-white/5 bg-[#111111] p-2">
        {pdf ? (
          <PdfCanvasViewer url={url} />
        ) : image ? (
          <img
            src={url}
            alt={fileName ?? "Document"}
            className="max-w-full max-h-[420px] object-contain rounded-lg"
          />
        ) : (
          <div className="text-center space-y-2 px-4">
            <FileText className="mx-auto text-[#A8A8A8]" size={32} />
            <p className="text-xs text-[#A8A8A8]">
              Preview not available for this file type.
            </p>
          </div>
        )}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        className="inline-flex items-center justify-center gap-2 self-center px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
      >
        <Download size={14} />
        Download Document
      </a>
    </div>
  );
}
