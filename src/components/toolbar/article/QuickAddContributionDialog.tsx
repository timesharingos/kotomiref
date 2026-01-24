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
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { toast } from 'react-toastify'

interface Entity {
  id: string
  name: string
  type: string
  typeName: string
}

interface MainDomain {
  id: string
  name: string
}

interface SubDomain {
  id: string
  name: string
  mainDomainId: string
}

interface QuickAddContributionDialogProps {
  open: boolean
  allEntities: Entity[]
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  onClose: () => void
  onSave: (data: {
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    improvementIds: string[]
    algoIds: string[]
    objectIds: string[]
    solutionToId: string
  }) => void
  onQuickAddDomain: () => void
  onQuickAddImprovement: () => void
  onQuickAddAlgo: () => void
  onQuickAddObject: () => void
  onQuickAddDefinition: () => void
}

function QuickAddContributionDialog({
  open,
  allEntities,
  mainDomains,
  subDomains,
  onClose,
  onSave,
  onQuickAddDomain,
  onQuickAddImprovement,
  onQuickAddAlgo,
  onQuickAddObject,
  onQuickAddDefinition
}: QuickAddContributionDialogProps) {
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [aliasIds, setAliasIds] = useState<string[]>([])
  const [parentIds, setParentIds] = useState<string[]>([])
  const [relationIds, setRelationIds] = useState<string[]>([])
  const [improvementIds, setImprovementIds] = useState<string[]>([])
  const [algoIds, setAlgoIds] = useState<string[]>([])
  const [objectIds, setObjectIds] = useState<string[]>([])
  const [solutionToId, setSolutionToId] = useState('')
  const descInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDescription('')
      setSubjectId('')
      setAliasIds([])
      setParentIds([])
      setRelationIds([])
      setImprovementIds([])
      setAlgoIds([])
      setObjectIds([])
      setSolutionToId('')
      const timer = setTimeout(() => {
        descInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = () => {
    const trimmedDesc = description.trim()
    if (!trimmedDesc) {
      toast.error('Please enter contribution description')
      return
    }
    if (!subjectId) {
      toast.error('Please select a domain (subject)')
      return
    }
    if (improvementIds.length === 0) {
      toast.error('Please select at least one improvement')
      return
    }
    if (!solutionToId) {
      toast.error('Please select a scenario (solution to)')
      return
    }
    onSave({
      description: trimmedDesc,
      subjectId,
      aliasIds,
      parentIds,
      relationIds,
      improvementIds,
      algoIds,
      objectIds,
      solutionToId
    })
    setDescription('')
    setSubjectId('')
    setAliasIds([])
    setParentIds([])
    setRelationIds([])
    setImprovementIds([])
    setAlgoIds([])
    setObjectIds([])
    setSolutionToId('')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Quick Add Contribution</DialogTitle>
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
            inputRef={descInputRef}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Improvement *
              </Typography>
              <IconButton size="small" onClick={onQuickAddImprovement} title="Quick add improvement">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Algorithm
              </Typography>
              <IconButton size="small" onClick={onQuickAddAlgo} title="Quick add algorithm">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Research Object
              </Typography>
              <IconButton size="small" onClick={onQuickAddObject} title="Quick add research object">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Solution To (Scenario) *
              </Typography>
              <IconButton size="small" onClick={onQuickAddDefinition} title="Quick add definition">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
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
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddContributionDialog

