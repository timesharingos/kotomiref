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

interface QuickAddImprovementDialogProps {
  open: boolean
  allEntities: Entity[]
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
  onClose: () => void
  onSave: (data: {
    name: string
    description: string
    subjectId: string
    metric: string
    metricResultString: string
    metricResultNumber: number | null
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    originIds: string[]
    advanceIds: string[]
  }) => void
  onQuickAddDomain: () => void
}

function QuickAddImprovementDialog({
  open,
  allEntities,
  mainDomains,
  subDomains,
  onClose,
  onSave,
  onQuickAddDomain
}: QuickAddImprovementDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [metric, setMetric] = useState('')
  const [metricResultString, setMetricResultString] = useState('')
  const [metricResultNumber, setMetricResultNumber] = useState<string>('')
  const [aliasIds, setAliasIds] = useState<string[]>([])
  const [parentIds, setParentIds] = useState<string[]>([])
  const [relationIds, setRelationIds] = useState<string[]>([])
  const [originIds, setOriginIds] = useState<string[]>([])
  const [advanceIds, setAdvanceIds] = useState<string[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
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
      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Please enter improvement name')
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
      metric: metric.trim(),
      metricResultString: metricResultString.trim(),
      metricResultNumber: metricResultNumber ? parseFloat(metricResultNumber) : null,
      aliasIds,
      parentIds,
      relationIds,
      originIds,
      advanceIds
    })
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Quick Add Improvement</DialogTitle>
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
            placeholder="e.g., Faster Training"
          />

          {/* Description - Required */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Describe the improvement..."
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
              Select entities that are aliases of this improvement (optional).
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
              Select parent entities of this improvement (optional).
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
              Select entities that are related to this improvement (optional).
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
            <Typography variant="caption" color="text.secondary">Metric Information (Optional)</Typography>
          </Divider>

          {/* Metric */}
          <TextField
            label="Metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            fullWidth
            placeholder="e.g., Accuracy, Speed, Memory Usage"
            helperText="Optional: Specify the metric being improved"
          />

          {/* Metric Result String */}
          <TextField
            label="Result (String)"
            value={metricResultString}
            onChange={(e) => setMetricResultString(e.target.value)}
            fullWidth
            disabled={!metric.trim()}
            placeholder="e.g., 'Improved by 20%', 'Significantly faster'"
            helperText={!metric.trim() ? "Available when metric is specified" : "Optional: Describe the result"}
          />

          {/* Metric Result Number */}
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
            <Typography variant="caption" color="text.secondary">Improvement Relations (Optional)</Typography>
          </Divider>

          {/* Origin - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Origin (Original Technology)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the original technology that this improvement is based on (optional).
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
                <TextField {...params} placeholder="Select origin entities" />
              )}
              slotProps={{
                chip: {
                  size: "small",
                  color: "warning"
                }
              }}
            />
          </Box>

          {/* Advance - Optional, Multiple Select */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Advance (Improved Technology)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              Select the improved technology that results from this improvement (optional).
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
                <TextField {...params} placeholder="Select advance entities" />
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
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddImprovementDialog

