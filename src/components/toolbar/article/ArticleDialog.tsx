import { useState, useEffect, useRef } from 'react'
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
  Paper,
  CircularProgress
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import * as pdfjsLib from 'pdfjs-dist'
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

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
    artTitle: '',
    artPath: '', 
    artPrimaryRefEntry: null as number | null,
    file: null as File | null,
    references: [] as any[],
    entityTags: [] as any[]
  })

  const [allEntities, setAllEntities] = useState<any[]>([])
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false)
  const [textContent, setTextContent] = useState<string>('')  // 文本文件内容
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      loadData()
      if (mode === 'edit' && article) {
        setFormData({
          id: article.id,
          artTitle: article.artTitle || '',
          artPath: article.artPath || '',
          artPrimaryRefEntry: article.artPrimaryRefEntry || null,
          file: null,
          references: article.references || [],
          entityTags: article.entityTags || []
        })
        // Load file preview if artPath exists
        if (article.artPath) {
          loadFilePreview(article.artPath)
        }
      } else {
        setFormData({
          id: '',
          artTitle: '',
          artPath: '',
          artPrimaryRefEntry: null,
          file: null,
          references: [],
          entityTags: []
        })
      }
      setActiveStep(0) // Reset to first step when dialog opens
      setFilePreview(null) // Reset file preview
    }
  }, [open, mode, article])

  const loadData = async () => {
    try {
      // Load all entities for tagging
      const entitiesResult = await window.entity.getAll()
      setAllEntities(entitiesResult)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }

  // Load file preview from path
  const loadFilePreview = async (filePath: string) => {
    try {
      // TODO: Implement file preview loading from electron
      // For now, just set the path
      setFilePreview(filePath)
    } catch (e) {
      console.error('Failed to load file preview:', e)
    }
  }

  // Render PDF first page to canvas
  const renderPdfPreview = async (file: File) => {
    try {
      setPdfPreviewLoading(true)

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      // Get first page
      const page = await pdf.getPage(1)

      // Set canvas size
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current

      if (canvas) {
        canvas.width = viewport.width
        canvas.height = viewport.height

        const context = canvas.getContext('2d')
        if (context) {
          // Render PDF page
          const renderContext: any = {
            canvasContext: context,
            viewport: viewport
          }
          await page.render(renderContext).promise

          // Convert canvas to data URL for preview
          const dataUrl = canvas.toDataURL()
          setFilePreview(dataUrl)
        }
      }

      setPdfPreviewLoading(false)
    } catch (e) {
      console.error('Failed to render PDF preview:', e)
      setPdfPreviewLoading(false)
      setFilePreview('pdf-preview-error')
    }
  }

  // Render text file preview (txt only)
  const renderTextPreview = async (file: File) => {
    try {
      setPdfPreviewLoading(true)

      // Read file as text
      const text = await file.text()

      console.log('Text file loaded:', {
        fileName: file.name,
        fileSize: file.size,
        textLength: text.length,
        preview: text.substring(0, 100)
      })

      // Store text content and set preview type
      setTextContent(text)
      setFilePreview('text-preview')

      setPdfPreviewLoading(false)
    } catch (e) {
      console.error('Failed to render text preview:', e)
      setPdfPreviewLoading(false)
      setFilePreview('text-preview-error')
    }
  }

  // Render Markdown file preview (md)
  const renderMarkdownPreview = async (file: File) => {
    try {
      setPdfPreviewLoading(true)

      // Read file as text
      const text = await file.text()

      console.log('Markdown file loaded:', {
        fileName: file.name,
        fileSize: file.size,
        textLength: text.length,
        preview: text.substring(0, 100)
      })

      // Store markdown content and set preview type
      setTextContent(text)
      setFilePreview('markdown-preview')

      setPdfPreviewLoading(false)
    } catch (e) {
      console.error('Failed to render Markdown preview:', e)
      setPdfPreviewLoading(false)
      setFilePreview('markdown-preview-error')
    }
  }

  // Render Word document preview (doc, docx)
  const renderWordPreview = async (file: File) => {
    try {
      setPdfPreviewLoading(true)

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Convert Word document to HTML with better styling options
      const result = await mammoth.convertToHtml({
        arrayBuffer: arrayBuffer
      } as any)

      // Store HTML content and set preview type
      setTextContent(result.value)
      setFilePreview('word-preview')

      setPdfPreviewLoading(false)
    } catch (e) {
      console.error('Failed to render Word preview:', e)
      setPdfPreviewLoading(false)
      setFilePreview('word-preview-error')
    }
  }

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validExtensions = ['.md', '.txt', '.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.gif']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

      if (!validExtensions.includes(fileExtension)) {
        alert('Invalid file type. Supported formats: md, txt, doc(x), pdf, and images (jpg, png, gif)')
        return
      }

      // Store file and generate preview
      setFormData({ ...formData, file, artPath: file.name })

      // Generate preview based on file type
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        // Image preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else if (fileExtension === '.pdf') {
        // Render PDF first page
        await renderPdfPreview(file)
      } else if (fileExtension === '.txt') {
        // Render text file
        await renderTextPreview(file)
      } else if (fileExtension === '.md') {
        // Render Markdown file
        await renderMarkdownPreview(file)
      } else if (['.doc', '.docx'].includes(fileExtension)) {
        // Render Word document
        await renderWordPreview(file)
      }

      console.log('File selected:', file.name)
    }
  }

  // Step navigation
  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      // Validate basic info: only title and file are required
      if (!formData.artTitle.trim()) {
        alert('Article title is required')
        return
      }
      if (!formData.file && !formData.artPath) {
        alert('Please upload an article file')
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
        {/* Article Title */}
        <TextField
          label="Article Title"
          value={formData.artTitle}
          onChange={(e) => setFormData({ ...formData, artTitle: e.target.value })}
          fullWidth
          required
          multiline
          rows={2}
          placeholder="Enter the article title"
        />

        <Divider />

        {/* File Upload */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Upload Article File *
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Supported formats: Markdown (.md), Text (.txt), Word (.doc, .docx), PDF (.pdf), Images (.jpg, .png, .gif)
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mb: 2 }}
          >
            {formData.file ? formData.file.name : formData.artPath || 'Choose File'}
            <input
              type="file"
              hidden
              accept=".md,.txt,.doc,.docx,.pdf,.jpg,.jpeg,.png,.gif"
              onChange={handleFileUpload}
            />
          </Button>

          {formData.file && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}

          {/* Loading Indicator */}
          {pdfPreviewLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Loading preview...
              </Typography>
            </Box>
          )}

          {/* File Preview */}
          {filePreview && !pdfPreviewLoading && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                File Preview
              </Typography>
              {filePreview.startsWith('data:image') ? (
                // Image preview (including PDF rendered as image)
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img
                    src={filePreview}
                    alt="Article preview"
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                </Box>
              ) : filePreview === 'pdf-preview-error' ? (
                // PDF preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load PDF preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : filePreview === 'text-preview' ? (
                // Text file preview (txt, md)
                <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    📝 Text Content:
                  </Typography>
                  <Box sx={{
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#000000',
                    backgroundColor: '#ffffff'
                  }}>
                    {textContent.length > 0 ? (
                      <>
                        {textContent.substring(0, 2000)}
                        {textContent.length > 2000 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                            ... (showing first 2000 characters of {textContent.length} total)
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        (Empty file)
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : filePreview === 'text-preview-error' ? (
                // Text preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load text preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : filePreview === 'markdown-preview' ? (
                // Markdown file preview
                <Box sx={{
                  p: 3,
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  '& h1': {
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginTop: '1.5rem',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                    color: '#1a1a1a',
                    borderBottom: '2px solid #e0e0e0',
                    paddingBottom: '0.5rem'
                  },
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginTop: '1.25rem',
                    marginBottom: '0.75rem',
                    lineHeight: 1.3,
                    color: '#2a2a2a',
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.3rem'
                  },
                  '& h3': {
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginTop: '1rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#3a3a3a'
                  },
                  '& h4, & h5, & h6': {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginTop: '0.75rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#4a4a4a'
                  },
                  '& p': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.75rem',
                    color: '#333'
                  },
                  '& ul, & ol': {
                    marginLeft: '1.5rem',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.5rem'
                  },
                  '& li': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.25rem',
                    color: '#333'
                  },
                  '& strong': {
                    fontWeight: 'bold',
                    color: '#1a1a1a'
                  },
                  '& em': {
                    fontStyle: 'italic'
                  },
                  '& a': {
                    color: '#1976d2',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#1565c0'
                    }
                  },
                  '& code': {
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    color: '#d63384'
                  },
                  '& pre': {
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    marginBottom: '1rem',
                    border: '1px solid #e0e0e0'
                  },
                  '& pre code': {
                    backgroundColor: 'transparent',
                    padding: 0,
                    color: '#333'
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #1976d2',
                    paddingLeft: '1rem',
                    marginLeft: '0',
                    marginBottom: '1rem',
                    color: '#666',
                    fontStyle: 'italic',
                    backgroundColor: '#f8f9fa'
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '1rem',
                    border: '1px solid #ddd'
                  },
                  '& th, & td': {
                    border: '1px solid #ddd',
                    padding: '8px 12px',
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '1rem 0',
                    borderRadius: '4px'
                  },
                  '& hr': {
                    border: 'none',
                    borderTop: '2px solid #e0e0e0',
                    margin: '1.5rem 0'
                  }
                }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                    📝 Markdown Content:
                  </Typography>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {textContent}
                  </ReactMarkdown>
                </Box>
              ) : filePreview === 'markdown-preview-error' ? (
                // Markdown preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load Markdown preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : filePreview === 'word-preview' ? (
                // Word document preview
                <Box sx={{
                  p: 3,
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  '& h1': {
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginTop: '1.5rem',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                    color: '#1a1a1a'
                  },
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginTop: '1.25rem',
                    marginBottom: '0.75rem',
                    lineHeight: 1.3,
                    color: '#2a2a2a'
                  },
                  '& h3': {
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginTop: '1rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#3a3a3a'
                  },
                  '& h4, & h5, & h6': {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginTop: '0.75rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#4a4a4a'
                  },
                  '& p': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.75rem',
                    color: '#333',
                    textAlign: 'justify'
                  },
                  '& ul, & ol': {
                    marginLeft: '1.5rem',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.5rem'
                  },
                  '& li': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.25rem',
                    color: '#333'
                  },
                  '& strong': {
                    fontWeight: 'bold',
                    color: '#1a1a1a'
                  },
                  '& em': {
                    fontStyle: 'italic'
                  },
                  '& a': {
                    color: '#1976d2',
                    textDecoration: 'underline'
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '1rem',
                    border: '1px solid #ddd'
                  },
                  '& th, & td': {
                    border: '1px solid #ddd',
                    padding: '8px 12px',
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #ddd',
                    paddingLeft: '1rem',
                    marginLeft: '0',
                    marginBottom: '1rem',
                    color: '#666',
                    fontStyle: 'italic'
                  },
                  '& code': {
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  },
                  '& pre': {
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    marginBottom: '1rem'
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '1rem 0'
                  }
                }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                    📄 Word Document Content:
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{ __html: textContent }}
                  />
                </Box>
              ) : filePreview === 'word-preview-error' ? (
                // Word preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'white', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load Word document preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : (
                // File path display
                <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    File Path:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {filePreview}
                  </Typography>
                </Box>
              )}
            </Paper>
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
              <Typography variant="caption" color="text.secondary">Article Title:</Typography>
              <Typography variant="body2">{formData.artTitle || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">File Path:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {formData.artPath || '-'}
              </Typography>
            </Box>
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

        {/* File Preview */}
        {filePreview && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              File Preview
            </Typography>
            {filePreview.startsWith('data:image') ? (
              // Image preview (including PDF rendered as image)
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <img
                  src={filePreview}
                  alt="Article preview"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              </Box>
            ) : filePreview === 'pdf-preview-error' ? (
              // PDF preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'white', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load PDF preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : filePreview === 'text-preview' ? (
              // Text file preview (txt, md)
              <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  📝 Text Content:
                </Typography>
                <Box sx={{
                  mt: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#000000',
                  backgroundColor: '#ffffff'
                }}>
                  {textContent.length > 0 ? (
                    <>
                      {textContent.substring(0, 1500)}
                      {textContent.length > 1500 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                          ... (showing first 1500 characters of {textContent.length} total)
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      (Empty file)
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : filePreview === 'text-preview-error' ? (
              // Text preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'white', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load text preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : filePreview === 'markdown-preview' ? (
              // Markdown file preview
              <Box sx={{
                p: 3,
                bgcolor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                maxHeight: 300,
                overflow: 'auto',
                '& h1': {
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  marginTop: '1.25rem',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                  borderBottom: '2px solid #e0e0e0',
                  paddingBottom: '0.4rem'
                },
                '& h2': {
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  marginBottom: '0.6rem',
                  lineHeight: 1.3,
                  color: '#2a2a2a',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '0.25rem'
                },
                '& h3': {
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  marginTop: '0.75rem',
                  marginBottom: '0.5rem',
                  lineHeight: 1.3,
                  color: '#3a3a3a'
                },
                '& h4, & h5, & h6': {
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginTop: '0.6rem',
                  marginBottom: '0.4rem',
                  lineHeight: 1.3,
                  color: '#4a4a4a'
                },
                '& p': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.6rem',
                  color: '#333'
                },
                '& ul, & ol': {
                  marginLeft: '1.5rem',
                  marginBottom: '0.6rem',
                  paddingLeft: '0.5rem'
                },
                '& li': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.2rem',
                  color: '#333'
                },
                '& strong': {
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                },
                '& em': {
                  fontStyle: 'italic'
                },
                '& a': {
                  color: '#1976d2',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#1565c0'
                  }
                },
                '& code': {
                  backgroundColor: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.85em',
                  color: '#d63384'
                },
                '& pre': {
                  backgroundColor: '#f5f5f5',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginBottom: '0.75rem',
                  border: '1px solid #e0e0e0'
                },
                '& pre code': {
                  backgroundColor: 'transparent',
                  padding: 0,
                  color: '#333'
                },
                '& blockquote': {
                  borderLeft: '4px solid #1976d2',
                  paddingLeft: '1rem',
                  marginLeft: '0',
                  marginBottom: '0.75rem',
                  color: '#666',
                  fontStyle: 'italic',
                  backgroundColor: '#f8f9fa'
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '0.75rem',
                  border: '1px solid #ddd'
                },
                '& th, & td': {
                  border: '1px solid #ddd',
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold'
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  margin: '0.75rem 0',
                  borderRadius: '4px'
                },
                '& hr': {
                  border: 'none',
                  borderTop: '2px solid #e0e0e0',
                  margin: '1rem 0'
                }
              }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                  📝 Markdown Content:
                </Typography>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {textContent}
                </ReactMarkdown>
              </Box>
            ) : filePreview === 'markdown-preview-error' ? (
              // Markdown preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'white', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load Markdown preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : filePreview === 'word-preview' ? (
              // Word document preview
              <Box sx={{
                p: 3,
                bgcolor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                maxHeight: 300,
                overflow: 'auto',
                '& h1': {
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  marginTop: '1.25rem',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                  color: '#1a1a1a'
                },
                '& h2': {
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  marginBottom: '0.6rem',
                  lineHeight: 1.3,
                  color: '#2a2a2a'
                },
                '& h3': {
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  marginTop: '0.75rem',
                  marginBottom: '0.5rem',
                  lineHeight: 1.3,
                  color: '#3a3a3a'
                },
                '& h4, & h5, & h6': {
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginTop: '0.6rem',
                  marginBottom: '0.4rem',
                  lineHeight: 1.3,
                  color: '#4a4a4a'
                },
                '& p': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.6rem',
                  color: '#333',
                  textAlign: 'justify'
                },
                '& ul, & ol': {
                  marginLeft: '1.5rem',
                  marginBottom: '0.6rem',
                  paddingLeft: '0.5rem'
                },
                '& li': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.2rem',
                  color: '#333'
                },
                '& strong': {
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                },
                '& em': {
                  fontStyle: 'italic'
                },
                '& a': {
                  color: '#1976d2',
                  textDecoration: 'underline'
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '0.75rem',
                  border: '1px solid #ddd'
                },
                '& th, & td': {
                  border: '1px solid #ddd',
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold'
                },
                '& blockquote': {
                  borderLeft: '4px solid #ddd',
                  paddingLeft: '1rem',
                  marginLeft: '0',
                  marginBottom: '0.75rem',
                  color: '#666',
                  fontStyle: 'italic'
                },
                '& code': {
                  backgroundColor: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.85em'
                },
                '& pre': {
                  backgroundColor: '#f5f5f5',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginBottom: '0.75rem'
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  margin: '0.75rem 0'
                }
              }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                  📄 Word Document Content:
                </Typography>
                <Box
                  dangerouslySetInnerHTML={{ __html: textContent }}
                />
              </Box>
            ) : filePreview === 'word-preview-error' ? (
              // Word preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'white', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load Word document preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : (
              // File path display
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {filePreview}
              </Typography>
            )}
          </Paper>
        )}

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
        {/* Hidden canvas for PDF rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

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

