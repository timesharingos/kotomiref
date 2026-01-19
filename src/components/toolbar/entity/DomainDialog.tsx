import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material'

interface Domain {
  id: string
  name: string
}

interface DomainDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  domain: Domain | null
  title: string
  onClose: () => void
  onSave: (data: { name: string }) => void
}

function DomainDialog({
  open,
  mode,
  domain,
  title,
  onClose,
  onSave
}: DomainDialogProps) {
  // Initialize state directly from props (works with key-based reset)
  const [name, setName] = useState(mode === 'edit' && domain ? domain.name : '')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus management only
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      alert('Please enter a name')
      return
    }
    onSave({ name: trimmedName })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          inputRef={nameInputRef}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DomainDialog

