import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material'
import { toast } from 'react-toastify'

interface MainDomain {
  id: string
  name: string
}

interface QuickAddDomainDialogProps {
  open: boolean
  mainDomains: MainDomain[]
  onClose: () => void
  onSave: (data: { name: string; description: string; type: 'main' | 'sub'; mainDomainId?: string }) => Promise<void>
}

const QuickAddDomainDialog: React.FC<QuickAddDomainDialogProps> = ({
  open,
  mainDomains,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'main' | 'sub'>('main')
  const [mainDomainId, setMainDomainId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    if (!saving) {
      setName('')
      setDescription('')
      setType('main')
      setMainDomainId('')
      onClose()
    }
  }

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    if (type === 'sub' && !mainDomainId) {
      toast.error('Please select a main domain for the sub-domain')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        type,
        mainDomainId: type === 'sub' ? mainDomainId : undefined
      })
      setName('')
      setDescription('')
      setType('main')
      setMainDomainId('')
      onClose()
    } catch (error) {
      console.error('Failed to save domain:', error)
      toast.error('Failed to save domain')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick Add Domain</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Domain Type */}
          <FormControl fullWidth required>
            <InputLabel>Domain Type</InputLabel>
            <Select
              value={type}
              label="Domain Type"
              onChange={(e) => {
                setType(e.target.value as 'main' | 'sub')
                if (e.target.value === 'main') {
                  setMainDomainId('')
                }
              }}
            >
              <MenuItem value="main">Main Domain</MenuItem>
              <MenuItem value="sub">Sub Domain</MenuItem>
            </Select>
          </FormControl>

          {/* Main Domain Selection (only for sub-domains) */}
          {type === 'sub' && (
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
          )}

          {/* Domain Name */}
          <TextField
            label="Domain Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
            helperText={
              type === 'main'
                ? 'Enter the name of the main domain'
                : 'Enter the name of the sub-domain'
            }
          />

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Describe the domain..."
            helperText="Optional: Provide a description for this domain"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddDomainDialog

