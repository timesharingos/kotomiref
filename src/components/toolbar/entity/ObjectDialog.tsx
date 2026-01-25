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
  Chip,
  IconButton,
  Typography,
  Autocomplete
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { toast } from 'react-toastify'

interface MainDomain {
  id: string
  name: string
}

interface SubDomain {
  id: string
  name: string
  mainDomainId: string
}

interface EntityItem {
  id: string
  name: string
  type: string
  typeName: string
}

interface ObjectData {
  id?: string
  name: string
  description: string
  subjectId: string // Required: Main Domain or Sub Domain ID
  aliasIds: string[] // Optional: Multiple Entity IDs
  parentIds: string[] // Optional: Multiple Entity IDs (treating as multiple for now)
  relationIds: string[] // Optional: Multiple Entity IDs
}

interface ObjectDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  object: ObjectData | null
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  allEntities: EntityItem[]
  onClose: () => void
  onSave: (data: ObjectData) => void
  onQuickAddDomain: () => void
}

function ObjectDialog({
  open,
  mode,
  object,
  mainDomains,
  subDomains,
  allEntities,
  onClose,
  onSave,
  onQuickAddDomain
}: ObjectDialogProps) {
  interface TypedObjectData {
    name: string
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
  }

  const [formData, setFormData] = useState<TypedObjectData>(() => {
    if (mode === 'edit' && object) {
      return {
        name: object.name,
        description: object.description,
        subjectId: object.subjectId,
        aliasIds: object.aliasIds,
        parentIds: object.parentIds,
        relationIds: object.relationIds
      }
    } else {
      return {
        name: '',
        description: '',
        subjectId: '',
        aliasIds: [],
        parentIds: [],
        relationIds: []
      }
    }
  })

  const {
    name,
    description,
    subjectId,
    aliasIds,
    parentIds,
    relationIds
  } = formData

  const nameInputRef = useRef<HTMLInputElement>(null)

  // Combine main domains and sub domains for selection

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
      toast.error('Please enter a name')
      return
    }
    if (!subjectId) {
      toast.error('Please select a domain (subject)')
      return
    }

    onSave({
      id: object?.id,
      name: trimmedName,
      description: description.trim(),
      subjectId,
      aliasIds,
      parentIds,
      relationIds
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Research Object' : 'Edit Research Object'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Name */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
            inputRef={nameInputRef}
          />

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />

          {/* Subject (Domain) - Required, Single Select - Only SubDomains */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Domain (Subject) * - Only Sub Domains
              </Typography>
              <IconButton size="small" onClick={onQuickAddDomain} title="Quick add domain">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Select Sub Domain</InputLabel>
              <Select
                value={subjectId}
                label="Select Sub Domain"
                onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
              >
                {/* Only Sub Domains - Type Constraint */}
                {subDomains.length === 0 && (
                  <MenuItem disabled>
                    No Sub Domains available
                  </MenuItem>
                )}
                {subDomains.map((domain) => {
                  const mainDomain = mainDomains.find(m => m.id === domain.mainDomainId)
                  return (
                    <MenuItem key={domain.id} value={domain.id}>
                      {domain.name} {mainDomain && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({mainDomain.name})</Typography>}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Alias - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Alias (Synonyms)
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => aliasIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setFormData(prev => ({ ...prev, aliasIds: newValue.map(v => v.id) }))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select alias entities" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.name} (${option.typeName})`}
                    size="small"
                  />
                ))
              }
            />
          </Box>

          {/* Parent - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Parent Entities
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => parentIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setFormData(prev => ({ ...prev, parentIds: newValue.map(v => v.id) }))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select parent entities" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.name} (${option.typeName})`}
                    size="small"
                  />
                ))
              }
            />
          </Box>

          {/* Relation - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Related Entities
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => relationIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setFormData(prev => ({ ...prev, relationIds: newValue.map(v => v.id) }))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select related entities" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.name} (${option.typeName})`}
                    size="small"
                  />
                ))
              }
            />
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

export default ObjectDialog


