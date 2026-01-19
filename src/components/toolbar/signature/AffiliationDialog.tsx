import { useState, useEffect } from 'react'
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

interface Affiliation {
  id: string
  name: string
  parentId: string | null
}

interface AffiliationDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  affiliation: Affiliation | null
  affiliations: Affiliation[]
  onClose: () => void
  onSave: (data: { name: string; parentId: string | null }) => void
}

function AffiliationDialog({
  open,
  mode,
  affiliation,
  affiliations,
  onClose,
  onSave
}: AffiliationDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)

  useEffect(() => {
    if (affiliation && mode === 'edit') {
      setName(affiliation.name)
      setParentId(affiliation.parentId)
    } else {
      setName('')
      setParentId(null)
    }
  }, [affiliation, mode, open])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter affiliation name')
      return
    }

    // Prevent circular reference
    if (mode === 'edit' && affiliation && parentId === affiliation.id) {
      alert('An affiliation cannot be its own parent')
      return
    }

    // Check if setting parent would create a cycle
    if (mode === 'edit' && affiliation && parentId) {
      if (isDescendant(parentId, affiliation.id)) {
        alert('Cannot set a descendant as parent (would create a cycle)')
        return
      }
    }

    onSave({ name: name.trim(), parentId })
  }

  const isDescendant = (potentialDescendantId: string, ancestorId: string): boolean => {
    const descendant = affiliations.find(a => a.id === potentialDescendantId)
    if (!descendant) return false
    if (descendant.parentId === ancestorId) return true
    if (descendant.parentId === null) return false
    return isDescendant(descendant.parentId, ancestorId)
  }

  // Get available parent options (exclude self and descendants in edit mode)
  const getAvailableParents = (): Affiliation[] => {
    if (mode === 'add') {
      return affiliations
    }
    
    // In edit mode, exclude self and all descendants
    return affiliations.filter(a => {
      if (a.id === affiliation?.id) return false
      if (isDescendant(a.id, affiliation?.id || '')) return false
      return true
    })
  }

  const availableParents = getAvailableParents()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Affiliation' : 'Edit Affiliation'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Name Field */}
          <TextField
            label="Affiliation Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
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
              {availableParents.map((parent) => (
                <MenuItem key={parent.id} value={parent.id}>
                  {parent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Help Text */}
          <Typography variant="caption" color="text.secondary">
            {mode === 'add' 
              ? 'Select a parent affiliation to create a sub-affiliation, or leave empty for a top-level affiliation.'
              : 'Change the parent affiliation to reorganize the hierarchy. Circular references are not allowed.'}
          </Typography>
        </Box>
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

export default AffiliationDialog

