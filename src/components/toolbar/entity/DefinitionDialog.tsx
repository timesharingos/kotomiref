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

interface DefinitionData {
  id?: string
  name: string
  description: string
  subjectId: string // Required: Main Domain or Sub Domain ID
  aliasIds: string[] // Optional: Multiple Entity IDs (Base entity relation)
  parentIds: string[] // Optional: Multiple Entity IDs (Base entity relation)
  relationIds: string[] // Optional: Multiple Entity IDs (Base entity relation)
  refineIds: string[] // Optional: Multiple Problem IDs (Definition specific - which problem to refine)
  scenarioIds: string[] // Optional: Multiple Entity IDs (Definition specific - scenario entities)
  evoIds: string[] // Optional: Multiple Definition IDs (Definition specific - definition evolution)
}

interface DefinitionDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  definition: DefinitionData | null
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  allEntities: EntityItem[]
  onClose: () => void
  onSave: (data: DefinitionData) => void
  onQuickAddDomain: () => void
}

function DefinitionDialog({
  open,
  mode,
  definition,
  mainDomains,
  subDomains,
  allEntities,
  onClose,
  onSave,
  onQuickAddDomain
}: DefinitionDialogProps) {
  const [name, setName] = useState(mode === 'edit' && definition ? definition.name : '')
  const [description, setDescription] = useState(mode === 'edit' && definition ? definition.description : '')
  const [subjectId, setSubjectId] = useState(mode === 'edit' && definition ? definition.subjectId : '')
  const [aliasIds, setAliasIds] = useState<string[]>(mode === 'edit' && definition ? definition.aliasIds : [])
  const [parentIds, setParentIds] = useState<string[]>(mode === 'edit' && definition ? definition.parentIds : [])
  const [relationIds, setRelationIds] = useState<string[]>(mode === 'edit' && definition ? definition.relationIds : [])
  const [refineIds, setRefineIds] = useState<string[]>(mode === 'edit' && definition ? definition.refineIds : [])
  const [scenarioIds, setScenarioIds] = useState<string[]>(mode === 'edit' && definition ? definition.scenarioIds : [])
  const [evoIds, setEvoIds] = useState<string[]>(mode === 'edit' && definition ? definition.evoIds : [])

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

    const data: DefinitionData = {
      id: definition?.id,
      name: trimmedName,
      description: description.trim(),
      subjectId,
      aliasIds,
      parentIds,
      relationIds,
      refineIds,
      scenarioIds,
      evoIds
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Scenario' : 'Edit Scenario'}
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
              slotProps={{
                chip: {
                  size: "small"
                }
              }}
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
              slotProps={{
                chip: {
                  size: "small"
                }
              }}
            />
          </Box>

          {/* Relations - Optional, Multiple Select */}
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
              slotProps={{
                chip: {
                  size: "small"
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">Scenario Relations</Typography>
          </Divider>

          {/* Refine - Optional, Multiple Select (Definition specific - which problem to refine) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Refine (Problem)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the problem(s) that this scenario refines/specifies.
            </Typography>
            <Autocomplete
              multiple
              options={allEntities.filter(e => e.type === 'problem')}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => refineIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setRefineIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select problem(s) to refine" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "info"
                }
              }}
            />
          </Box>

          {/* Scenario - Optional, Multiple Select (Definition specific - scenario entities) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Scenario (Context Entities)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select entities that describe the specific scenario/context for this definition.
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => scenarioIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setScenarioIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select scenario entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "success"
                }
              }}
            />
          </Box>

          {/* Evo - Optional, Multiple Select (Definition specific - definition evolution) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Evolution (Scenario Evolution)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Note: This scenario evolved from the selected scenario(s). The current scenario is more recent/advanced.
            </Typography>
            <Autocomplete
              multiple
              options={allEntities.filter(e => e.type === 'definition')}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => evoIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setEvoIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select scenario(s) this evolved from" />
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
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DefinitionDialog

