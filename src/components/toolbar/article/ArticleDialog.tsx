import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
  Chip,
  Typography,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'

interface ArticleDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  article: any | null
  onClose: () => void
  onSave: (data: any) => void
}

const steps = ['Basic Info & Upload', 'References', 'Entity Tags', 'Preview & Confirm']

const ArticleDialog = ({ open, mode, article, onClose, onSave }: ArticleDialogProps) => {
  const [activeStep, setActiveStep] = useState(0)

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    authors: [] as string[],
    year: new Date().getFullYear(),
    publicationPlatform: '',
    entityTags: [] as any[],
    domainId: '',
    abstract: '',
    doi: '',
    url: '',
    file: null as File | null,
    references: [] as any[]
  })

  const [allEntities, setAllEntities] = useState<any[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [authorInput, setAuthorInput] = useState('')

  useEffect(() => {
    if (open) {
      loadData()
      if (mode === 'edit' && article) {
        setFormData({
          id: article.id,
          title: article.title || '',
          authors: article.authors || [],
          year: article.year || new Date().getFullYear(),
          publicationPlatform: article.publicationPlatform || '',
          entityTags: article.entityTags || [],
          domainId: article.domainId || '',
          abstract: article.abstract || '',
          doi: article.doi || '',
          url: article.url || '',
          file: null,
          references: article.references || []
        })
      } else {
        setFormData({
          id: '',
          title: '',
          authors: [],
          year: new Date().getFullYear(),
          publicationPlatform: '',
          entityTags: [],
          domainId: '',
          abstract: '',
          doi: '',
          url: '',
          file: null,
          references: []
        })
      }
      setActiveStep(0) // Reset to first step when dialog opens
    }
  }, [open, mode, article])

  const loadData = async () => {
    try {
      // Load all entities for tagging
      const entitiesResult = await window.entity.getAll()
      setAllEntities(entitiesResult)

      // Load domains
      const domainsResult = await window.domain.getAll()
      setDomains(domainsResult)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }

  const handleAddAuthor = () => {
    if (authorInput.trim() && !formData.authors.includes(authorInput.trim())) {
      setFormData({
        ...formData,
        authors: [...formData.authors, authorInput.trim()]
      })
      setAuthorInput('')
    }
  }

  const handleRemoveAuthor = (author: string) => {
    setFormData({
      ...formData,
      authors: formData.authors.filter(a => a !== author)
    })
  }

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Validate file type (PDF, etc.)
      setFormData({ ...formData, file })
      console.log('File selected:', file.name)
    }
  }

  // Step navigation
  const handleNext = () => {
    // TODO: Validate current step before proceeding
    if (activeStep === 0) {
      // Validate basic info
      if (!formData.title.trim()) {
        alert('Title is required')
        return
      }
      if (formData.authors.length === 0) {
        alert('At least one author is required')
        return
      }
      if (!formData.year || formData.year < 1900 || formData.year > 2100) {
        alert('Please enter a valid year')
        return
      }
      if (!formData.publicationPlatform.trim()) {
        alert('Publication platform is required')
        return
      }
    }

    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleSave = () => {
    // Final validation and save
    console.log('Saving article:', formData)
    onSave(formData)
  }

  // Step 1: Basic Info & File Upload
  const renderBasicInfoStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Title */}
        <TextField
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          fullWidth
          required
          multiline
          rows={2}
        />

        {/* Authors */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Authors *
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter author name"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddAuthor()
                }
              }}
              fullWidth
            />
            <Button variant="outlined" onClick={handleAddAuthor}>
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {formData.authors.map((author) => (
              <Chip
                key={author}
                label={author}
                onDelete={() => handleRemoveAuthor(author)}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Year and Publication Platform */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
            required
            sx={{ width: 150 }}
          />
          <TextField
            label="Publication Platform"
            value={formData.publicationPlatform}
            onChange={(e) => setFormData({ ...formData, publicationPlatform: e.target.value })}
            fullWidth
            required
            placeholder="e.g., NeurIPS, CVPR, arXiv"
          />
        </Box>

        {/* Domain */}
        <Autocomplete
          options={domains}
          getOptionLabel={(option) => option.name}
          value={domains.find(d => d.id === formData.domainId) || null}
          onChange={(_, newValue) => {
            setFormData({ ...formData, domainId: newValue?.id || '' })
          }}
          renderInput={(params) => (
            <TextField {...params} label="Domain" placeholder="Select domain" />
          )}
        />

        <Divider />

        {/* Abstract */}
        <TextField
          label="Abstract"
          value={formData.abstract}
          onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
          fullWidth
          multiline
          rows={4}
          placeholder="Enter article abstract (optional)"
        />

        {/* DOI */}
        <TextField
          label="DOI"
          value={formData.doi}
          onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
          fullWidth
          placeholder="e.g., 10.1234/example.doi"
        />

        {/* URL */}
        <TextField
          label="URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          fullWidth
          placeholder="e.g., https://arxiv.org/abs/1234.5678"
        />

        <Divider />

        {/* File Upload */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Upload PDF File (Optional)
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
          >
            {formData.file ? formData.file.name : 'Choose File'}
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={handleFileUpload}
            />
          </Button>
          {formData.file && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  // Step 2: References
  const renderReferencesStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          References
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Add references cited in this article. You can add them manually or import from a file.
        </Typography>

        {/* TODO: Add reference management UI */}
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            Reference management UI will be implemented here.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Features: Add reference, Import from BibTeX, Edit, Delete
          </Typography>
        </Paper>

        {/* Placeholder for references list */}
        {formData.references.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Added References ({formData.references.length})
            </Typography>
            {/* TODO: Display references list */}
          </Box>
        )}
      </Box>
    )
  }

  // Step 3: Entity Tags
  const renderEntityTagsStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Entity Tags
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Tag this article with relevant entities (Objects, Algorithms, Improvements, etc.)
        </Typography>

        <Autocomplete
          multiple
          options={allEntities}
          getOptionLabel={(option) => `${option.name} (${option.typeName})`}
          value={formData.entityTags}
          onChange={(_, newValue) => {
            setFormData({ ...formData, entityTags: newValue })
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Entity Tags"
              placeholder="Select entities to tag"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                {...getTagProps({ index })}
                size="small"
                color={
                  option.type === 'object' ? 'primary' :
                  option.type === 'algo' ? 'secondary' :
                  option.type === 'improvement' ? 'success' :
                  option.type === 'problem' ? 'warning' :
                  option.type === 'definition' ? 'info' :
                  option.type === 'contrib' ? 'error' :
                  'default'
                }
              />
            ))
          }
        />

        {formData.entityTags.length > 0 && (
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Entity Tags ({formData.entityTags.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {formData.entityTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={`${tag.name} (${tag.typeName})`}
                  size="medium"
                  color={
                    tag.type === 'object' ? 'primary' :
                    tag.type === 'algo' ? 'secondary' :
                    tag.type === 'improvement' ? 'success' :
                    tag.type === 'problem' ? 'warning' :
                    tag.type === 'definition' ? 'info' :
                    tag.type === 'contrib' ? 'error' :
                    'default'
                  }
                />
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    )
  }

  // Step 4: Preview & Confirm
  const renderPreviewStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Preview & Confirm
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Please review all information before saving.
        </Typography>

        {/* Basic Information */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Basic Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Title:</Typography>
              <Typography variant="body2">{formData.title || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Authors:</Typography>
              <Typography variant="body2">{formData.authors.join(', ') || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Year:</Typography>
                <Typography variant="body2">{formData.year}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Publication Platform:</Typography>
                <Typography variant="body2">{formData.publicationPlatform || '-'}</Typography>
              </Box>
            </Box>
            {formData.domainId && (
              <Box>
                <Typography variant="caption" color="text.secondary">Domain:</Typography>
                <Typography variant="body2">
                  {domains.find(d => d.id === formData.domainId)?.name || '-'}
                </Typography>
              </Box>
            )}
            {formData.abstract && (
              <Box>
                <Typography variant="caption" color="text.secondary">Abstract:</Typography>
                <Typography variant="body2" sx={{ maxHeight: 100, overflow: 'auto' }}>
                  {formData.abstract}
                </Typography>
              </Box>
            )}
            {formData.doi && (
              <Box>
                <Typography variant="caption" color="text.secondary">DOI:</Typography>
                <Typography variant="body2">{formData.doi}</Typography>
              </Box>
            )}
            {formData.url && (
              <Box>
                <Typography variant="caption" color="text.secondary">URL:</Typography>
                <Typography variant="body2">{formData.url}</Typography>
              </Box>
            )}
            {formData.file && (
              <Box>
                <Typography variant="caption" color="text.secondary">File:</Typography>
                <Typography variant="body2">
                  {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* References */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            References
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formData.references.length > 0
              ? `${formData.references.length} reference(s) added`
              : 'No references added'}
          </Typography>
        </Paper>

        {/* Entity Tags */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Entity Tags
          </Typography>
          {formData.entityTags.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {formData.entityTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  color={
                    tag.type === 'object' ? 'primary' :
                    tag.type === 'algo' ? 'secondary' :
                    tag.type === 'improvement' ? 'success' :
                    tag.type === 'problem' ? 'warning' :
                    tag.type === 'definition' ? 'info' :
                    tag.type === 'contrib' ? 'error' :
                    'default'
                  }
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No entity tags added
            </Typography>
          )}
        </Paper>
      </Box>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Article' : 'Edit Article'}
      </DialogTitle>
      <DialogContent>
        {/* Stepper */}
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        <Box sx={{ mt: 2 }}>
          {activeStep === 0 && renderBasicInfoStep()}
          {activeStep === 1 && renderReferencesStep()}
          {activeStep === 2 && renderEntityTagsStep()}
          {activeStep === 3 && renderPreviewStep()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} startIcon={<NavigateBeforeIcon />}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" endIcon={<NavigateNextIcon />}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSave} variant="contained" color="success">
            Confirm & Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ArticleDialog

