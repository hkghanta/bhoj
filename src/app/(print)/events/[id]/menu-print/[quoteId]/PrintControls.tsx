'use client'
export function PrintControls() {
  return (
    <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', fontFamily: 'sans-serif' }}>
      <button
        onClick={() => window.print()}
        style={{ padding: '8px 18px', background: '#c2410c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
      >
        Print / Save PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
      >
        Close
      </button>
    </div>
  )
}
