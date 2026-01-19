import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Autocomplete,
  IconButton,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ClearIcon from '@mui/icons-material/Clear'

interface Author {
  id: string
  name: string
  affiliations: string[]
}

interface AuthorDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  author: Author | null
  onClose: () => void
  onSave: (data: { name: string; affiliations: string[] }) => void
}

function AuthorDialog({ open, mode, author, onClose, onSave }: AuthorDialogProps) {
  // Initialize state directly from props (works with key-based reset)
  const [name, setName] = useState(mode === 'edit' && author ? author.name : '')
  const [selectedAffiliations, setSelectedAffiliations] = useState<string[]>(
    mode === 'edit' && author ? author.affiliations : []
  )
  const [availableAffiliations] = useState<string[]>([
    // TODO: Load from database
    'MIT',
    'Stanford University',
    'Harvard University',
    'UC Berkeley'
  ])
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
    if (!name.trim()) {
      alert('Please enter author name')
      return
    }
    onSave({ name: name.trim(), affiliations: selectedAffiliations })
  }

  const handleAddAffiliation = (affiliation: string | null) => {
    if (affiliation && !selectedAffiliations.includes(affiliation)) {
      setSelectedAffiliations([...selectedAffiliations, affiliation])
    }
  }

  const handleRemoveAffiliation = (affiliation: string) => {
    setSelectedAffiliations(selectedAffiliations.filter(a => a !== affiliation))
  }

  const handleClearAffiliations = () => {
    if (window.confirm('Are you sure you want to clear all affiliations?')) {
      setSelectedAffiliations([])
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Author' : 'Edit Author'}
      </DialogTitle>
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
              options={availableAffiliations.filter(a => !selectedAffiliations.includes(a))}
              onChange={(_event, value) => handleAddAffiliation(value)}
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
              {selectedAffiliations.map((affiliation) => (
                <Chip
                  key={affiliation}
                  label={affiliation}
                  onDelete={() => handleRemoveAffiliation(affiliation)}
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
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AuthorDialog

