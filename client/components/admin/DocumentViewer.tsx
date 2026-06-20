import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, RefreshCw } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface DocumentViewerProps {
  url: string;
  fileName?: string;
  mimeHint?: string;
}

const PDF_RENDER_TIMEOUT_MS = 12_000;

function isPdf(url: string, mimeHint?: string, fileName?: string): boolean {
  if (mimeHint === "application/pdf") return true;
  const probe = `${fileName ?? ""} ${url}`.toLowerCase();
  return probe.includes(".pdf") || probe.includes("application%2fpdf");
}

function isImage(url: string, mimeHint?: string, fileName?: string): boolean {
  if (mimeHint?.startsWith("image/")) return true;
  const probe = `${fileName ?? ""} ${url}`.toLowerCase();
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(probe);
}

function inferMimeHint(url: string, fileName?: string): string | undefined {
  const probe = `${fileName ?? ""} ${url}`.toLowerCase();
  if (probe.includes(".pdf")) return "application/pdf";
  if (/\.(jpe?g)/.test(probe)) return "image/jpeg";
  if (probe.includes(".png")) return "image/png";
  if (probe.includes(".webp")) return "image/webp";
  return undefined;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

function PdfIframeViewer({
  url,
  retryKey,
  onFallback,
}: {
  url: string;
  retryKey: number;
  onFallback: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const fallbackTimer = useRef<number | null>(null);

  useEffect(() => {
    fallbackTimer.current = window.setTimeout(() => {
      onFallback();
    }, PDF_RENDER_TIMEOUT_MS);

    return () => {
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    };
  }, [url, retryKey, onFallback]);

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1A1A1A] z-10">
          <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
          <p className="text-[10px] text-[#A8A8A8]">Loading PDF preview…</p>
        </div>
      )}
      <iframe
        key={retryKey}
        src={url}
        title="PDF document preview"
        className="w-full h-full min-h-[360px] rounded-lg border-0 bg-white"
        onLoad={() => {
          if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
          setLoading(false);
        }}
      />
    </>
  );
}

function PdfCanvasViewer({
  url,
  retryKey,
}: {
  url: string;
  retryKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError(null);
      try {
        const task = pdfjs.getDocument({
          url,
          withCredentials: false,
          disableRange: true,
          disableStream: true,
        });
        const pdf = await withTimeout(
          task.promise,
          PDF_RENDER_TIMEOUT_MS,
          "PDF preview timed out",
        );
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  }, [url, retryKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
        <p className="text-[10px] text-[#A8A8A8]">Rendering PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-2 px-4">
        <FileText className="mx-auto text-[#A8A8A8]" size={28} />
        <p className="text-xs text-red-400">{error}</p>
        <p className="text-[10px] text-[#A8A8A8]">
          Use download below or open in a new tab.
        </p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full max-h-full object-contain bg-white rounded-lg"
    />
  );
}

function ImageViewer({
  url,
  fileName,
  retryKey,
  onError,
}: {
  url: string;
  fileName?: string;
  retryKey: number;
  onError: () => void;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
        </div>
      )}
      <img
        key={retryKey}
        src={url}
        alt={fileName ?? "Document"}
        className="max-w-full max-h-[420px] object-contain rounded-lg"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          onError();
        }}
      />
    </>
  );
}

export function DocumentViewer({ url, fileName, mimeHint }: DocumentViewerProps) {
  const [retryKey, setRetryKey] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [pdfMode, setPdfMode] = useState<"iframe" | "canvas">("iframe");

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
        <FileText className="text-[#A8A8A8]" size={32} />
        <p className="text-xs text-[#A8A8A8]">Document URL unavailable.</p>
      </div>
    );
  }

  const resolvedMime = mimeHint ?? inferMimeHint(url, fileName);
  const pdf = isPdf(url, resolvedMime, fileName);
  const image = !pdf && isImage(url, resolvedMime, fileName);
  const showPreviewError = image && imageError;

  const handleRetry = () => {
    setImageError(false);
    setPdfMode("iframe");
    setRetryKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="relative flex-1 min-h-[280px] flex items-center justify-center overflow-auto rounded-2xl border border-white/5 bg-[#1A1A1A] p-2 servd-scrollbar">
        {pdf ? (
          pdfMode === "iframe" ? (
            <PdfIframeViewer
              url={url}
              retryKey={retryKey}
              onFallback={() => setPdfMode("canvas")}
            />
          ) : (
            <PdfCanvasViewer url={url} retryKey={retryKey} />
          )
        ) : image && !showPreviewError ? (
          <ImageViewer
            url={url}
            fileName={fileName}
            retryKey={retryKey}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-center space-y-2 px-4">
            <FileText className="mx-auto text-[#A8A8A8]" size={32} />
            <p className="text-xs text-[#A8A8A8]">
              {showPreviewError
                ? "Image preview failed to load."
                : "Preview not available for this file type."}
            </p>
            <p className="text-[10px] text-white/40">
              Download the file to review offline.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
        >
          <RefreshCw size={14} />
          Retry Preview
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
        >
          <Download size={14} />
          Download Document
        </a>
      </div>
    </div>
  );
}
