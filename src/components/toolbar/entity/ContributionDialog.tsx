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

interface ContributionData {
  id?: string
  description: string
  subjectId: string // Required: Main Domain or Sub Domain ID
  aliasIds: string[] // Optional: Alias entities
  parentIds: string[] // Optional: Parent entities
  relationIds: string[] // Optional: Related entities
  improvementIds: string[] // Required: At least one improvement
  algoIds: string[] // Optional: Algorithm entities
  objectIds: string[] // Optional: Object entities
  solutionToId: string // Required: Definition entity (which problem this solves)
}

interface ContributionDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  contribution: ContributionData | null
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  allEntities: EntityItem[]
  onClose: () => void
  onSave: (data: ContributionData) => void
  onQuickAddDomain: () => void
}

function ContributionDialog({
  open,
  mode,
  contribution,
  mainDomains,
  subDomains,
  allEntities,
  onClose,
  onSave,
  onQuickAddDomain
}: ContributionDialogProps) {
  const [description, setDescription] = useState(mode === 'edit' && contribution ? contribution.description : '')
  const [subjectId, setSubjectId] = useState(mode === 'edit' && contribution ? contribution.subjectId : '')
  const [aliasIds, setAliasIds] = useState<string[]>(mode === 'edit' && contribution ? contribution.aliasIds : [])
  const [parentIds, setParentIds] = useState<string[]>(mode === 'edit' && contribution ? contribution.parentIds : [])
  const [relationIds, setRelationIds] = useState<string[]>(mode === 'edit' && contribution ? contribution.relationIds : [])
  const [improvementIds, setImprovementIds] = useState<string[]>(mode === 'edit' && contribution ? contribution.improvementIds : [])
  const [algoIds, setAlgoIds] = useState<string[]>(mode === 'edit' && contribution ? contribution.algoIds : [])
  const [objectIds, setObjectIds] = useState<string[]>(mode === 'edit' && contribution ? contribution.objectIds : [])
  const [solutionToId, setSolutionToId] = useState(mode === 'edit' && contribution ? contribution.solutionToId : '')

  const descriptionInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        descriptionInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = () => {
    const trimmedDescription = description.trim()
    if (!trimmedDescription) {
      alert('Please enter a description')
      return
    }
    if (!subjectId) {
      alert('Please select a domain (subject)')
      return
    }
    if (improvementIds.length === 0) {
      alert('Please select at least one improvement')
      return
    }
    if (!solutionToId) {
      alert('Please select a scenario (solution to)')
      return
    }

    const data: ContributionData = {
      id: contribution?.id,
      description: trimmedDescription,
      subjectId,
      aliasIds,
      parentIds,
      relationIds,
      improvementIds,
      algoIds,
      objectIds,
      solutionToId
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Contribution' : 'Edit Contribution'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Description - Required (No Name field for Contribution) */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            inputRef={descriptionInputRef}
            helperText="Contribution does not have a name field. Please provide a detailed description."
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
              Select entities that are aliases of this contribution (optional).
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
              Select parent entities of this contribution (optional).
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
              Select entities that are related to this contribution (optional).
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
            <Typography variant="caption" color="text.secondary">Contribution Components (Required)</Typography>
          </Divider>

          {/* Improvement - Required, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Improvement *
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select at least one improvement that this contribution includes.
            </Typography>
            <Autocomplete
              multiple
              options={allEntities.filter(e => e.type === 'improvement')}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => improvementIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setImprovementIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select improvement entities" required={improvementIds.length === 0} />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "primary"
                }
              }}
            />
          </Box>

          {/* Algorithm - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Algorithm
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select algorithms that this contribution includes (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities.filter(e => e.type === 'algo')}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => algoIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setAlgoIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select algorithm entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "secondary"
                }
              }}
            />
          </Box>

          {/* Object - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Research Object
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select research objects that this contribution includes (optional).
            </Typography>
            <Autocomplete
              multiple
              options={allEntities.filter(e => e.type === 'object')}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => objectIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setObjectIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select research object entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "success"
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">Solution Target (Required)</Typography>
          </Divider>

          {/* Solution To - Required, Single Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Solution To (Scenario) *
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the scenario (definition) that this contribution solves.
            </Typography>
            <Autocomplete
              options={allEntities.filter(e => e.type === 'definition')}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.find(e => e.id === solutionToId) || null}
              onChange={(_event, newValue) => {
                setSolutionToId(newValue ? newValue.id : '')
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select scenario" required={!solutionToId} />
              )}
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

export default ContributionDialog

