import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material'

interface QuickAddDialogProps {
  open: boolean
  title: string
  label: string
  placeholder?: string
  onClose: () => void
  onSave: (name: string) => void
}

function QuickAddDialog({
  open,
  title,
  label,
  placeholder,
  onClose,
  onSave
}: QuickAddDialogProps) {
  const [name, setName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset form state
    const resetForm = () => {
      setName('')
    }
    resetForm()

    // Focus on name input after a short delay
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }
    onSave(trimmedName)
    setName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Quickly add a new {label.toLowerCase()} to the database.
          </Typography>
          
          <TextField
            label={label}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyPress}
            fullWidth
            required
            inputRef={nameInputRef}
            placeholder={placeholder}
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!name.trim()}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddDialog

