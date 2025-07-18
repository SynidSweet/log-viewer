'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, ReactNode } from 'react'

import { Session } from 'next-auth'

interface SessionWrapperProps {
  children: (session: Session | null, status: string) => ReactNode
}

export function SessionWrapper({ children }: SessionWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const sessionData = useSession({ required: false })
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return children(null, 'loading')
  }
  
  return <>{children(sessionData.data, sessionData.status)}</>
}