'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserInfo {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  provider: string
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setUser(data.code === 200 ? data.data : null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) { setUser(null); setLoading(false) }
      })
    return () => { mounted = false }
  }, [pathname])

  return { user, loading }
}
