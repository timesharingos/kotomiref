import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material'
import { toast } from 'react-toastify'

interface Affiliation {
  id: string
  name: string
  parentId?: string | null
}

interface QuickAddAffiliationDialogProps {
  open: boolean
  affiliations: Affiliation[]
  onClose: () => void
  onSave: (name: string, parentId: string | null) => void
}

function QuickAddAffiliationDialog({
  open,
  affiliations,
  onClose,
  onSave
}: QuickAddAffiliationDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset form state
    const resetForm = () => {
      setName('')
      setParentId(null)
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
      toast.error('Please enter affiliation name')
      return
    }
    onSave(trimmedName, parentId)
    setName('')
    setParentId(null)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick Add Affiliation</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Name Field */}
          <TextField
            label="Affiliation Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            inputRef={nameInputRef}
            placeholder="e.g., MIT, Computer Science Department"
          />

          {/* Parent Affiliation */}
          <FormControl fullWidth>
            <InputLabel id="parent-label">Parent Affiliation</InputLabel>
            <Select
              labelId="parent-label"
              value={parentId || ''}
              label="Parent Affiliation"
              onChange={(e) => setParentId(e.target.value || null)}
            >
              <MenuItem value="">
                <em>None (Top Level)</em>
              </MenuItem>
              {affiliations.map((parent) => (
                <MenuItem key={parent.id} value={parent.id}>
                  {parent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Help Text */}
          <Typography variant="caption" color="text.secondary">
            Select a parent affiliation to create a sub-affiliation, or leave empty for a top-level affiliation.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddAffiliationDialog

