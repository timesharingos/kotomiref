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

interface ImprovementData {
  id?: string
  name: string
  description: string
  subjectId: string // Required: Main Domain or Sub Domain ID
  metric?: string // Optional: Metric name
  metricResultString?: string // Optional (conditionChild): depends on metric
  metricResultNumber?: number // Optional (conditionSib): depends on metric
  aliasIds: string[] // Optional: Multiple Entity IDs (Base entity relation)
  parentIds: string[] // Optional: Multiple Entity IDs (Base entity relation)
  relationIds: string[] // Optional: Multiple Entity IDs (Base entity relation)
  originIds: string[] // Optional: Multiple Entity IDs (Improvement specific - original tech)
  advanceIds: string[] // Optional: Multiple Entity IDs (Improvement specific - improved tech)
}

interface ImprovementDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  improvement: ImprovementData | null
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  allEntities: EntityItem[]
  onClose: () => void
  onSave: (data: ImprovementData) => void
  onQuickAddDomain: () => void
}

function ImprovementDialog({
  open,
  mode,
  improvement,
  mainDomains,
  subDomains,
  allEntities,
  onClose,
  onSave,
  onQuickAddDomain
}: ImprovementDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [metric, setMetric] = useState('')
  const [metricResultString, setMetricResultString] = useState('')
  const [metricResultNumber, setMetricResultNumber] = useState('')
  const [aliasIds, setAliasIds] = useState<string[]>([])
  const [parentIds, setParentIds] = useState<string[]>([])
  const [relationIds, setRelationIds] = useState<string[]>([])
  const [originIds, setOriginIds] = useState<string[]>([])
  const [advanceIds, setAdvanceIds] = useState<string[]>([])

  const nameInputRef = useRef<HTMLInputElement>(null)

  // Update form when improvement changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && improvement) {
      setName(improvement.name)
      setDescription(improvement.description)
      setSubjectId(improvement.subjectId)
      setMetric(improvement.metric || '')
      setMetricResultString(improvement.metricResultString || '')
      // Handle -1 as empty value
      setMetricResultNumber(improvement.metricResultNumber !== undefined && improvement.metricResultNumber !== -1 ? improvement.metricResultNumber.toString() : '')
      setAliasIds(improvement.aliasIds)
      setParentIds(improvement.parentIds)
      setRelationIds(improvement.relationIds)
      setOriginIds(improvement.originIds)
      setAdvanceIds(improvement.advanceIds)
    } else if (mode === 'add') {
      // Reset form for add mode
      setName('')
      setDescription('')
      setSubjectId('')
      setMetric('')
      setMetricResultString('')
      setMetricResultNumber('')
      setAliasIds([])
      setParentIds([])
      setRelationIds([])
      setOriginIds([])
      setAdvanceIds([])
    }
  }, [mode, improvement])

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

    const data: ImprovementData = {
      id: improvement?.id,
      name: trimmedName,
      description: description.trim(),
      subjectId,
      aliasIds,
      parentIds,
      relationIds,
      originIds,
      advanceIds
    }

    // Add optional metric fields if metric is provided
    if (metric.trim()) {
      data.metric = metric.trim()
      if (metricResultString.trim()) {
        data.metricResultString = metricResultString.trim()
      }
      if (metricResultNumber.trim()) {
        const numValue = parseFloat(metricResultNumber)
        if (!isNaN(numValue)) {
          data.metricResultNumber = numValue
        }
      }
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Improvement' : 'Edit Improvement'}
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
            required
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
                onChange={(e) => setSubjectId(e.target.value)}
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
            <Typography variant="caption" color="text.secondary">Metric Information (Optional)</Typography>
          </Divider>

          {/* Metric - Optional */}
          <TextField
            label="Metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            fullWidth
            placeholder="e.g., Accuracy, Speed, Memory Usage"
            helperText="Optional: Specify the metric being improved"
          />

          {/* Metric Result String - Optional (conditionChild: depends on metric) */}
          <TextField
            label="Result (String)"
            value={metricResultString}
            onChange={(e) => setMetricResultString(e.target.value)}
            fullWidth
            disabled={!metric.trim()}
            placeholder="e.g., 'Improved by 20%', 'Significantly faster'"
            helperText={!metric.trim() ? "Available when metric is specified" : "Optional: Describe the result"}
          />

          {/* Metric Result Number - Optional (conditionSib: sibling of Result String, same dependency) */}
          <TextField
            label="Result (Number)"
            value={metricResultNumber}
            onChange={(e) => setMetricResultNumber(e.target.value)}
            fullWidth
            type="number"
            disabled={!metric.trim()}
            placeholder="e.g., 95.5, 1000"
            helperText={!metric.trim() ? "Available when metric is specified" : "Optional: Numeric result value"}
          />

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">Improvement Relations</Typography>
          </Divider>

          {/* Origin - Optional, Multiple Select (Original Technology) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Origin (Original Technology)
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => originIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setOriginIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select original technology entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "default"
                }
              }}
            />
          </Box>

          {/* Advance - Optional, Multiple Select (Improved Technology) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Advance (Improved Technology)
            </Typography>
            <Autocomplete
              multiple
              options={allEntities}
              getOptionLabel={(option) => `${option.name} (${option.typeName})`}
              value={allEntities.filter(e => advanceIds.includes(e.id))}
              onChange={(_event, newValue) => {
                setAdvanceIds(newValue.map(v => v.id))
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select improved technology entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "success"
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

export default ImprovementDialog

