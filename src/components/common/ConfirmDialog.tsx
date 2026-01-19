import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description" sx={{ whiteSpace: 'pre-line' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

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

export default ConfirmDialog

