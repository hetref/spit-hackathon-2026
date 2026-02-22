'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Something went wrong!</h2>
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
