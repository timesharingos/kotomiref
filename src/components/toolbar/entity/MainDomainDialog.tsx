import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material'

interface MainDomain {
  id: string
  name: string
}

interface MainDomainDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  domain: MainDomain | null
  onClose: () => void
  onSave: (data: { name: string }) => void
}

function MainDomainDialog({
  open,
  mode,
  domain,
  onClose,
  onSave
}: MainDomainDialogProps) {
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
      alert('Please enter a main domain name')
      return
    }
    onSave({ name: trimmedName })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Main Domain' : 'Edit Main Domain'}
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Main Domain Name"
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

export default MainDomainDialog

