'use client'
import { useEffect, useState } from 'react'

let cached: Record<string, string> | null = null

export function useSettings(): Record<string, string> | null {
  const [settings, setSettings] = useState<Record<string, string> | null>(cached)

  useEffect(() => {
    if (cached) { setSettings(cached); return }
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.code === 200) { cached = d.data; setSettings(d.data) }
      })
      .catch(() => { setSettings({}) })
  }, [])

  return settings
}
