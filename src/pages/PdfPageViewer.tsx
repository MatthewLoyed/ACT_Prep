import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
GlobalWorkerOptions.workerSrc = pdfWorker

export default function PdfPageViewer() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const urlParam = new URLSearchParams(location.search).get('url')
    if (!urlParam) return
    getDocument(urlParam).promise.then(setPdf)
  }, [])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    ;(async () => {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
    })()
  }, [pdf, pageNum])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <button className="btn btn-ghost" onClick={() => setPageNum(p => Math.max(1, p - 1))}>Prev</button>
        <div>Page {pageNum} / {pdf?.numPages ?? '?'}</div>
        <button className="btn btn-ghost" onClick={() => setPageNum(p => Math.min((pdf?.numPages ?? p), p + 1))}>Next</button>
      </div>
      <div className="card p-2 overflow-auto">
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">Tip: use this visual mode for debugging extraction or as a long-term viewing option.</div>
    </div>
  )
}


