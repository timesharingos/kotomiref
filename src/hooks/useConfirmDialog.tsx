import { useState, useCallback } from 'react'
import ConfirmDialog from '../components/common/ConfirmDialog'

interface UseConfirmDialogResult {
  ConfirmDialogComponent: React.ReactNode
  confirm: (title: string, message: string) => Promise<boolean>
}

export function useConfirmDialog(): UseConfirmDialogResult {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    setTitle(title)
    setMessage(message)
    setOpen(true)
    
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveRef?.(true)
    setResolveRef(null)
  }, [resolveRef])

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolveRef?.(false)
    setResolveRef(null)
  }, [resolveRef])

  const ConfirmDialogComponent = (
    <ConfirmDialog
      open={open}
      title={title}
      message={message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { ConfirmDialogComponent, confirm }
}

