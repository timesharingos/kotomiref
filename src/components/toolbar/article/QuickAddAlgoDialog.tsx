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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
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

interface Entity {
  id: string
  name: string
  type: string
  typeName: string
}

interface QuickAddAlgoDialogProps {
  open: boolean
  allEntities: Entity[]
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  onClose: () => void
  onSave: (data: {
    name: string
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    targetIds: string[]
    expectationIds: string[]
    transformationIds: string[]
  }) => void
  onQuickAddDomain: () => void
}

function QuickAddAlgoDialog({
  open,
  allEntities,
  mainDomains,
  subDomains,
  onClose,
  onSave,
  onQuickAddDomain
}: QuickAddAlgoDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [aliasIds, setAliasIds] = useState<string[]>([])
  const [parentIds, setParentIds] = useState<string[]>([])
  const [relationIds, setRelationIds] = useState<string[]>([])
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [expectationIds, setExpectationIds] = useState<string[]>([])
  const [transformationIds, setTransformationIds] = useState<string[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset form state
    const resetForm = () => {
      setName('')
      setDescription('')
      setSubjectId('')
      setAliasIds([])
      setParentIds([])
      setRelationIds([])
      setTargetIds([])
      setExpectationIds([])
      setTransformationIds([])
    }
    resetForm()

    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Please enter algorithm name')
      return
    }
    if (!subjectId) {
      toast.error('Please select a domain (subject)')
      return
    }
    onSave({
      name: trimmedName,
      description: description.trim(),
      subjectId,
      aliasIds,
      parentIds,
      relationIds,
      targetIds,
      expectationIds,
      transformationIds
    })
    setName('')
    setDescription('')
    setSubjectId('')
    setAliasIds([])
    setParentIds([])
    setRelationIds([])
    setTargetIds([])
    setExpectationIds([])
    setTransformationIds([])
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Quick Add Algorithm</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Name - Required */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            inputRef={nameInputRef}
            placeholder="e.g., Transformer, BERT"
          />

          {/* Description - Required */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Describe the algorithm..."
          />

          {/* Subject (Domain) - Required, Single Select */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Domain (Subject) *
              </Typography>
              <IconButton size="small" onClick={onQuickAddDomain} title="Quick add domain">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Select Domain</InputLabel>
              <Select
                value={subjectId}
                label="Select Domain"
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {/* Main Domains */}
                {mainDomains.length > 0 && (
                  <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Main Domains
                  </MenuItem>
                )}
                {mainDomains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id} sx={{ pl: 4 }}>
                    {domain.name}
                  </MenuItem>
                ))}

                {/* Sub Domains */}
                {subDomains.length > 0 && (
                  <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                    Sub Domains
                  </MenuItem>
                )}
                {subDomains.map((domain) => {
                  const mainDomain = mainDomains.find(m => m.id === domain.mainDomainId)
                  return (
                    <MenuItem key={domain.id} value={domain.id} sx={{ pl: 4 }}>
                      {domain.name} {mainDomain && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({mainDomain.name})</Typography>}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">Entity Relations (Optional)</Typography>
          </Divider>

          {/* Alias - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Alias
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select entities that are aliases of this algorithm (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => aliasIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setAliasIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select alias entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "default"
                }
              }}
            />
          </Box>

          {/* Parent - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Parent
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select parent entities of this algorithm (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => parentIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setParentIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select parent entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "info"
                }
              }}
            />
          </Box>

          {/* Relation - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Relation
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select entities that are related to this algorithm (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => relationIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setRelationIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select related entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "secondary"
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">Algorithm Relations (Optional)</Typography>
          </Divider>

          {/* Target - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Target (Input)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the input entities that this algorithm targets (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => targetIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setTargetIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select target entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "primary"
                }
              }}
            />
          </Box>

          {/* Expectation - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Expectation (Output)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the expected output entities of this algorithm (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => expectationIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setExpectationIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select expectation entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "success"
                }
              }}
            />
          </Box>

          {/* Transformation - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Transformation (Process)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the transformation process entities of this algorithm (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => transformationIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setTransformationIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select transformation entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "warning"
                }
              }}
            />
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

export default QuickAddAlgoDialog

