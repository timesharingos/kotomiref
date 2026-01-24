import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Autocomplete,
  Chip,
  IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ClearIcon from '@mui/icons-material/Clear'
import { toast } from 'react-toastify'

interface Affiliation {
  id: string
  name: string
  parentId?: string | null
}

interface QuickAddAuthorDialogProps {
  open: boolean
  affiliations: Affiliation[]
  onClose: () => void
  onSave: (name: string, affiliationIds: string[]) => void
}

function QuickAddAuthorDialog({
  open,
  affiliations,
  onClose,
  onSave
}: QuickAddAuthorDialogProps) {
  const [name, setName] = useState('')
  const [selectedAffiliations, setSelectedAffiliations] = useState<string[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset form state
    const resetForm = () => {
      setName('')
      setSelectedAffiliations([])
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
      toast.error('Please enter author name')
      return
    }
    onSave(trimmedName, selectedAffiliations)
    setName('')
    setSelectedAffiliations([])
  }

  const handleAddAffiliation = (affiliationId: string | null) => {
    if (affiliationId && !selectedAffiliations.includes(affiliationId)) {
      setSelectedAffiliations([...selectedAffiliations, affiliationId])
    }
  }

  const handleRemoveAffiliation = (affiliationId: string) => {
    setSelectedAffiliations(selectedAffiliations.filter(a => a !== affiliationId))
  }

  const handleClearAffiliations = () => {
    if (window.confirm('Are you sure you want to clear all affiliations?')) {
      setSelectedAffiliations([])
    }
  }

  // Get affiliation name by ID
  const getAffiliationName = (id: string) => {
    return affiliations.find(a => a.id === id)?.name ?? id
  }

  // Get unselected affiliations for autocomplete
  const unselectedAffiliations = affiliations.filter(
    a => !selectedAffiliations.includes(a.id)
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick Add Author</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Name Field */}
          <TextField
            label="Author Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            inputRef={nameInputRef}
            placeholder="e.g., John Doe"
          />

          {/* Affiliations Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Affiliations
              </Typography>
              {selectedAffiliations.length > 0 && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearAffiliations}
                  color="error"
                >
                  Clear All
                </Button>
              )}
            </Box>

            {/* Add Affiliation */}
            <Autocomplete
              options={unselectedAffiliations}
              getOptionLabel={(option) => option.name}
              onChange={(_event, value) => handleAddAffiliation(value?.id ?? null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Add affiliation..."
                  size="small"
                />
              )}
              value={null}
            />

            {/* Selected Affiliations */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {selectedAffiliations.map((affiliationId) => (
                <Chip
                  key={affiliationId}
                  label={getAffiliationName(affiliationId)}
                  onDelete={() => handleRemoveAffiliation(affiliationId)}
                  deleteIcon={
                    <IconButton size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                />
              ))}
              {selectedAffiliations.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No affiliations selected
                </Typography>
              )}
            </Box>
          </Box>
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

export default QuickAddAuthorDialog

