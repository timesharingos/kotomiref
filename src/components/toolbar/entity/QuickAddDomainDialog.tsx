import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material'

interface MainDomain {
  id: string
  name: string
}

interface QuickAddDomainDialogProps {
  open: boolean
  mainDomains: MainDomain[]
  onClose: () => void
  onSave: (data: { name: string; description?: string; mainDomainId: string }) => Promise<{ success: boolean; id?: string; error?: string }>
}

function QuickAddDomainDialog({
  open,
  mainDomains,
  onClose,
  onSave
}: QuickAddDomainDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mainDomainId, setMainDomainId] = useState('')
  const [saving, setSaving] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Reset form
      setName('')
      setDescription('')
      setMainDomainId('')
      setSaving(false)

      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      alert('Please enter a domain name')
      return
    }
    if (!mainDomainId) {
      alert('Please select a main domain')
      return
    }

    setSaving(true)
    try {
      const result = await onSave({
        name: trimmedName,
        description: description.trim(),
        mainDomainId
      })

      if (result.success) {
        onClose()
      } else {
        alert(`Failed to add domain: ${result.error}`)
      }
    } catch (e) {
      console.error('Failed to add domain:', e)
      alert('An error occurred while adding domain')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick Add Domain</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Domain Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            inputRef={nameInputRef}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <FormControl fullWidth required>
            <InputLabel>Main Domain</InputLabel>
            <Select
              value={mainDomainId}
              label="Main Domain"
              onChange={(e) => setMainDomainId(e.target.value)}
            >
              {mainDomains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="caption" color="text.secondary">
            This will create a new sub-domain under the selected main domain.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddDomainDialog

