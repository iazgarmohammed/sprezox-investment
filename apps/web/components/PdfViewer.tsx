'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
}

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventKeyShortcuts = (e: KeyboardEvent) => {
      // Block Ctrl+S / Ctrl+P (save/print attempts)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyShortcuts);
    };
  }, []);

  return (
    <div className="select-none" onContextMenu={(e) => e.preventDefault()}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="flex justify-center bg-gray-900 rounded-xl p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={() => setError('Could not load the pitch deck. The link may have expired — refresh the page.')}
          loading={<p className="text-white text-sm py-10">Loading deck...</p>}
        >
          <Page pageNumber={pageNumber} width={700} renderAnnotationLayer={false} renderTextLayer={false} />
        </Document>
      </div>

      {numPages > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}