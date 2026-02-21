/**
 * useAutosave – debounced persistence of Liveblocks storage → Prisma
 *
 * Watches Liveblocks storage for changes, debounces by 5 s,
 * and PATCHes the SiteVersion.builderData in the database.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useStorage } from '@/lib/liveblocks-client'

/**
 * @param {Object} options
 * @param {string} options.siteVersionId - SiteVersion ID to save to
 * @param {number} [options.debounceMs=5000] - Debounce interval in ms
 */
export function useAutosave({ siteVersionId, debounceMs = 5000 }) {
  const builderState = useStorage((root) => root.builderState)
  const timerRef = useRef(null)
  const lastSavedRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState(null)

  const saveToDatabase = useCallback(
    async (data) => {
      if (!siteVersionId || !data) return

      // Skip if data hasn't changed
      const serialized = JSON.stringify(data)
      if (serialized === lastSavedRef.current) return

      setSaving(true)
      setError(null)

      try {
        const res = await fetch(`/api/site-versions/${siteVersionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ builderData: data }),
        })

        if (!res.ok) {
          throw new Error(`Save failed: ${res.status}`)
        }

        lastSavedRef.current = serialized
        setLastSaved(new Date())
      } catch (err) {
        console.error('[autosave] Failed to save:', err)
        setError(err.message)
      } finally {
        setSaving(false)
      }
    },
    [siteVersionId]
  )

  // Debounced watcher
  useEffect(() => {
    if (!builderState) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      saveToDatabase(builderState)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [builderState, debounceMs, saveToDatabase])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      // Fire one final save
      if (builderState) {
        saveToDatabase(builderState)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { saving, lastSaved, error }
}
