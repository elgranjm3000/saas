'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtime(tables: string[], onEvent: () => void) {
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  const key = tables.join('|')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('db-changes')

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => cbRef.current()
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
