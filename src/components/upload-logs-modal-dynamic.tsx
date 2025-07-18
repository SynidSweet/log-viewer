'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

interface UploadLogsModalProps {
  projectId: string
  onLogsUploaded: () => void
  trigger: ReactNode
}

// Dynamically import UploadLogsModal with code splitting
export const UploadLogsModalDynamic = dynamic<UploadLogsModalProps>(
  () => import('./upload-logs-modal').then(mod => ({ default: mod.UploadLogsModal })),
  {
    ssr: false
  }
)