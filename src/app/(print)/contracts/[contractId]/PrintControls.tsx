'use client'
export function PrintControls() {
  return (
    <div className="print-controls">
      <button onClick={() => window.print()} className="btn-print">
        Print / Save PDF
      </button>
      <button onClick={() => window.close()} className="btn-close">
        Close
      </button>
    </div>
  )
}
