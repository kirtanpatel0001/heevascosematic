'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 1. Log the error for your own tracking
    console.error(error)

    // 2. Check for the specific "ChunkLoadError" or "404"
    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk') || 
      error.message.includes('404')
    ) {
      // 3. FORCE A RELOAD
      // This gets the new index.html, which points to the new valid JS files.
      window.location.reload()
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-4 text-gray-600">
            A new version of the app is available.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update App
          </button>
        </div>
      </body>
    </html>
  )
}