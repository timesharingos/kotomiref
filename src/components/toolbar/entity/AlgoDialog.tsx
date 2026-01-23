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
  Autocomplete,
  Divider
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

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

interface AlgoData {
  id?: string
  name: string
  description: string
  subjectId: string // Required: Main Domain or Sub Domain ID
  aliasIds: string[] // Optional: Multiple Entity IDs
  parentIds: string[] // Optional: Multiple Entity IDs
  relationIds: string[] // Optional: Multiple Entity IDs
  targetIds: string[] // Optional: Multiple Entity IDs (Algo specific)
  expectationIds: string[] // Optional: Multiple Entity IDs (Algo specific)
  transformationIds: string[] // Optional: Multiple Entity IDs (Algo specific)
}

interface AlgoDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  algo: AlgoData | null
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  allEntities: EntityItem[]
  onClose: () => void
  onSave: (data: AlgoData) => void
  onQuickAddDomain: () => void
}

function AlgoDialog({
  open,
  mode,
  algo,
  mainDomains,
  subDomains,
  allEntities,
  onClose,
  onSave,
  onQuickAddDomain
}: AlgoDialogProps) {
  const [name, setName] = useState(mode === 'edit' && algo ? algo.name : '')
  const [description, setDescription] = useState(mode === 'edit' && algo ? algo.description : '')
  const [subjectId, setSubjectId] = useState(mode === 'edit' && algo ? algo.subjectId : '')
  const [aliasIds, setAliasIds] = useState<string[]>(mode === 'edit' && algo ? algo.aliasIds : [])
  const [parentIds, setParentIds] = useState<string[]>(mode === 'edit' && algo ? algo.parentIds : [])
  const [relationIds, setRelationIds] = useState<string[]>(mode === 'edit' && algo ? algo.relationIds : [])
  const [targetIds, setTargetIds] = useState<string[]>(mode === 'edit' && algo ? algo.targetIds : [])
  const [expectationIds, setExpectationIds] = useState<string[]>(mode === 'edit' && algo ? algo.expectationIds : [])
  const [transformationIds, setTransformationIds] = useState<string[]>(mode === 'edit' && algo ? algo.transformationIds : [])

  const nameInputRef = useRef<HTMLInputElement>(null)

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
      alert('Please enter a name')
      return
    }
    if (!subjectId) {
      alert('Please select a domain (subject)')
      return
    }

    onSave({
      id: algo?.id,
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
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Algorithm' : 'Edit Algorithm'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Name */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            inputRef={nameInputRef}
          />

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
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
            <Typography variant="caption" color="text.secondary">Entity Relations</Typography>
          </Divider>

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
                setAliasIds(newValue.map(v => v.id))
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
                setParentIds(newValue.map(v => v.id))
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
                setRelationIds(newValue.map(v => v.id))
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

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">Algorithm Specific Relations</Typography>
          </Divider>

          {/* Target (Input) - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Target (Input)
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
                <TextField {...params} placeholder="Select target entities (input)" />
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

          {/* Expectation (Output) - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Expectation (Output)
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
                <TextField {...params} placeholder="Select expectation entities (output)" />
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

          {/* Transformation - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Transformation (Related Objects)
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

export default AlgoDialog


