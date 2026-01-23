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
  Divider
} from '@mui/material'

interface ArticleDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  article: any | null
  onClose: () => void
  onSave: (data: any) => void
}

const ArticleDialog = ({ open, mode, article, onClose, onSave }: ArticleDialogProps) => {
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
    url: ''
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
          url: article.url || ''
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
          url: ''
        })
      }
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

  const handleSave = () => {
    // Validation
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

    onSave(formData)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Article' : 'Edit Article'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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

          {/* Entity Tags */}
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ArticleDialog

