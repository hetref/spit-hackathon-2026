/**
 * CollaborativeCanvas – the root component for real-time collaborative editing.
 *
 * Wraps children in a Liveblocks RoomProvider, initializes storage from
 * page layout data, manages cursor presence, block locking,
 * and autosave.
 *
 * Usage:
 *   <CollaborativeCanvas
 *     tenantId="..."
 *     siteId="..."
 *     pageId="..."
 *     userName="John"
 *     userColor="#E57373"
 *   >
 *     {children}
 *   </CollaborativeCanvas>
 */

'use client'

import { useCallback, useEffect, useMemo, memo } from 'react'
import {
  RoomProvider,
  useUpdateMyPresence,
  useOthers,
  useSelf,
  useStatus,
} from '@/lib/liveblocks-client'
import CursorLayer from './CursorLayer'
import AvatarStack from './AvatarStack'
import { Loader2, Wifi, WifiOff } from 'lucide-react'

// ─── Inner canvas (must be inside RoomProvider) ──────────────────────────────

function CanvasInner({ children }) {
  const updatePresence = useUpdateMyPresence()
  const status = useStatus()
  const self = useSelf()
  const others = useOthers()

  // ── Cursor tracking ─────────────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (e) => {
      updatePresence({ cursor: { x: e.clientX, y: e.clientY } })
    },
    [updatePresence]
  )

  const handlePointerLeave = useCallback(() => {
    updatePresence({ cursor: null })
  }, [updatePresence])

  // ── Deselect / unlock block on canvas background click ──────────────────
  const handleCanvasClick = useCallback(
    (e) => {
      // Only deselect if clicking on the canvas background itself
      if (e.target === e.currentTarget) {
        updatePresence({
          selectedBlockId: null,
          lockedBlockId: null,
        })
      }
    },
    [updatePresence]
  )

  // ── Clear locks on unmount / disconnect ─────────────────────────────────
  useEffect(() => {
    return () => {
      updatePresence({
        cursor: null,
        selectedBlockId: null,
        lockedBlockId: null,
      })
    }
  }, [updatePresence])

  // ── Collect all locked blocks from others ───────────────────────────────
  const lockedBlocks = useMemo(() => {
    const map = {}
    for (const other of others) {
      const lockedId = other.presence?.lockedBlockId
      if (lockedId) {
        map[lockedId] = {
          userId: other.connectionId,
          username: other.presence?.username || other.info?.name || 'Anonymous',
          color: other.presence?.color || other.info?.color || '#999',
        }
      }
    }
    return map
  }, [others])

  return (
    <div
      className="relative h-full w-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Status bar */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {status === 'connected' ? (
            <>
              <Wifi size={12} className="text-emerald-500" />
              <span className="text-emerald-600">Connected</span>
            </>
          ) : status === 'connecting' ? (
            <>
              <Loader2 size={12} className="animate-spin text-amber-500" />
              <span className="text-amber-600">Connecting…</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-500" />
              <span className="text-red-600">Disconnected</span>
            </>
          )}
        </div>

        {/* Avatar stack */}
        <AvatarStack />
      </div>

      {/* Remote cursors */}
      <CursorLayer />

      {/* Builder content (existing Toolbar, Sidebars, CanvasArea) */}
      {children}
    </div>
  )
}

const MemoizedCanvasInner = memo(CanvasInner)

// ─── Outer wrapper with RoomProvider ─────────────────────────────────────────

export default function CollaborativeCanvas({
  tenantId,
  siteId,
  pageId,
  userName = 'Anonymous',
  userColor = '#6366f1',
  children,
}) {
  // Room ID: both users editing the same page share this room
  const roomId = `tenant:${tenantId}:site:${siteId}:page:${pageId}`

  const initialPresence = useMemo(
    () => ({
      cursor: null,
      lockedBlockId: null,
      selectedBlockId: null,
      username: userName,
      color: userColor,
    }),
    [userName, userColor]
  )

  return (
    <RoomProvider
      id={roomId}
      initialPresence={initialPresence}
    >
      <MemoizedCanvasInner>
        {children}
      </MemoizedCanvasInner>
    </RoomProvider>
  )
}
