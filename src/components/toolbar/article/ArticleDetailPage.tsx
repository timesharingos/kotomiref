import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material'
import Layout from '../../Layout'
import { toast } from 'react-toastify'
import ConfirmDialog from '../../common/ConfirmDialog'

interface ReferenceSignature {
  id?: string
  authorId: string
  affiliationId: string
  order: number
}

interface Reference {
  id?: string
  refNo: number
  refIndex: string
  refTitle: string
  refYear: number | null
  refPublication: string
  refVolume: number | null
  refIssue: number | null
  refStartPage: number | null
  refEndPage: number | null
  refDoi: string
  refAbs?: string
  authors: string[]
  signatures: ReferenceSignature[]
}

interface EntityTag {
  id: string
  name: string
  type: 'object' | 'algo' | 'improvement' | 'problem' | 'definition' | 'contrib'
}

interface Contribution {
  entityId: string
  contributionType: 'propose' | 'improve' | 'solve' | 'define' | 'contribute'
  description: string
}

interface Article {
  id: string
  artTitle: string
  artPath: string
  artPrimaryRefEntry: number | null
  references: Reference[]
  entityTags: string[]
  contributions: string[]
}

function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [textContent, setTextContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [entityTags, setEntityTags] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([])
  const [affiliations, setAffiliations] = useState<Array<{ id: string; name: string }>>([])
  const [allEntities, setAllEntities] = useState<Array<{ id: string; name: string; type: string; description?: string }>>([])
  const [mainDomains, setMainDomains] = useState<Array<{ id: string; name: string }>>([])
  const [subDomains, setSubDomains] = useState<Array<{ id: string; name: string; mainDomainId: string | null }>>([])
  const [contributions, setContributions] = useState<Array<{
    id: string
    name: string
    type: string
    description: string
    subjectId?: string
    improvementIds?: string[]
    algoIds?: string[]
    objectIds?: string[]
    solutionToId?: string
  }>>([])

  // Load article data
  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return

      try {
        setLoading(true)
        const articleData = await window.article.getById(id)

        if (!articleData) {
          toast.error('Article not found')
          navigate('/article')
          return
        }

        setArticle(articleData)

        // Load entity tags
        if (articleData.entityTags && articleData.entityTags.length > 0) {
          const entities = await window.entity.getAll()
          const tags = articleData.entityTags
            .map(tagId => entities.find(e => e.id === tagId))
            .filter(e => e !== undefined)
            .map(e => ({
              id: e!.id,
              name: e!.name,
              type: e!.type
            }))
          setEntityTags(tags)
        }

        // Load contributions
        if (articleData.contributions && articleData.contributions.length > 0) {
          const contribPromises = articleData.contributions.map(async (contribId) => {
            try {
              const contribData = await window.entity.getAllByType('contrib')
              const contrib = contribData.find(c => c.id === contribId)
              if (!contrib) return null

              return {
                id: contrib.id,
                name: contrib.name || 'Unnamed Contribution',
                type: 'contrib',
                description: contrib.description || '',
                subjectId: contrib.subjectId,
                improvementIds: contrib.improvementIds || [],
                algoIds: contrib.algoIds || [],
                objectIds: contrib.objectIds || [],
                solutionToId: contrib.solutionToId
              }
            } catch (error) {
              console.error('Failed to load contribution:', contribId, error)
              return null
            }
          })

          const contribResults = await Promise.all(contribPromises)
          const validContribs = contribResults.filter(c => c !== null) as Array<{
            id: string
            name: string
            type: string
            description: string
            subjectId?: string
            improvementIds?: string[]
            algoIds?: string[]
            objectIds?: string[]
            solutionToId?: string
          }>
          setContributions(validContribs)
        }

        // Load authors, affiliations, entities, and domains
        const [authorsData, affiliationsData, entitiesData, mainDomainsData, subDomainsData] = await Promise.all([
          window.author.getAll(),
          window.affiliation.getAll(),
          window.entity.getAll(),
          window.domain.getAllMain(),
          window.domain.getAllSub()
        ])
        setAuthors(authorsData)
        setAffiliations(affiliationsData)
        setAllEntities(entitiesData)
        setMainDomains(mainDomainsData)
        setSubDomains(subDomainsData)

        // Load file preview if path exists
        if (articleData.artPath) {
          loadFilePreview(articleData.artPath)
        }
      } catch (error) {
        console.error('Failed to load article:', error)
        toast.error('Failed to load article')
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [id, navigate])

  // Load file preview
  const loadFilePreview = async (filePath: string) => {
    try {
      if (!filePath) return

      setPreviewLoading(true)

      // Get file extension
      const ext = filePath.toLowerCase().split('.').pop()

      if (ext === 'pdf') {
        // For PDF, just show the path (full preview would require canvas)
        setFilePreview('pdf-file')
      } else if (ext === 'docx' || ext === 'doc') {
        setFilePreview('word-file')
      } else if (ext === 'txt') {
        // Load text file preview
        const fileBuffer = await window.electron.readFile(filePath)
        const text = new TextDecoder().decode(fileBuffer)
        setTextContent(text)
        setFilePreview('text-preview')
      } else if (ext === 'md') {
        // Load Markdown file preview
        const fileBuffer = await window.electron.readFile(filePath)
        const text = new TextDecoder().decode(fileBuffer)
        setTextContent(text)
        setFilePreview('markdown-preview')
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
        // Load image preview
        const fileBuffer = await window.electron.readFile(filePath)
        
        // Determine MIME type
        let mimeType = 'image/jpeg'
        if (ext === 'png') mimeType = 'image/png'
        else if (ext === 'gif') mimeType = 'image/gif'
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
        
        // Create blob with correct MIME type
        const blob = new Blob([fileBuffer], { type: mimeType })
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
          setPreviewLoading(false)
        }
        reader.readAsDataURL(blob)
        return
      } else {
        setFilePreview(filePath)
      }

      setPreviewLoading(false)
    } catch (e) {
      console.error('Failed to load file preview:', e)
      setFilePreview('preview-error')
      setPreviewLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!article) return

    try {
      await window.article.delete(article.id)
      toast.success('Article deleted successfully')
      navigate('/article')
    } catch (error) {
      console.error('Failed to delete article:', error)
      toast.error('Failed to delete article')
    }
  }

  // Handle edit
  const handleEdit = () => {
    navigate(`/article?edit=${id}`)
  }

  // Get domain name by ID
  const getDomainName = (domainId: string) => {
    const mainDomain = mainDomains.find(d => d.id === domainId)
    if (mainDomain) return mainDomain.name

    const subDomain = subDomains.find(d => d.id === domainId)
    if (subDomain) {
      const parentDomain = mainDomains.find(d => d.id === subDomain.mainDomainId)
      return parentDomain ? `${subDomain.name} (${parentDomain.name})` : subDomain.name
    }

    return 'Unknown Domain'
  }

  // Get entity type color
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'object': return 'primary'
      case 'algo': return 'secondary'
      case 'improvement': return 'success'
      case 'problem': return 'warning'
      case 'definition': return 'info'
      case 'contrib': return 'error'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  if (!article) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Article not found
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/article')}
            sx={{ mt: 2 }}
          >
            Back to Articles
          </Button>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/article')}
              sx={{ mb: 2 }}
            >
              Back to Articles
            </Button>
            <Typography variant="h4" gutterBottom>
              {article.artTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Article">
              <IconButton color="primary" onClick={handleEdit}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Article">
              <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* File Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon />
            File Information
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              File Path:
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {article.artPath}
            </Typography>
          </Box>

          {/* File Preview */}
          {previewLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={30} />
            </Box>
          )}

          {filePreview && !previewLoading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Preview:
              </Typography>

              {filePreview.startsWith('data:image') ? (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img
                    src={filePreview}
                    alt="Article preview"
                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                  />
                </Box>
              ) : filePreview === 'text-preview' ? (
                <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #ddd', borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                  <Box sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#000000'
                  }}>
                    {textContent}
                  </Box>
                </Box>
              ) : filePreview === 'markdown-preview' ? (
                <Box sx={{
                  p: 3,
                  bgcolor: '#ffffff',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto'
                }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#000000' }}>
                    {textContent}
                  </Typography>
                </Box>
              ) : filePreview === 'pdf-file' ? (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', border: '1px solid #ddd', borderRadius: 1, textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: '#d32f2f', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    PDF Document
                  </Typography>
                </Box>
              ) : filePreview === 'word-file' ? (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', border: '1px solid #ddd', borderRadius: 1, textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Word Document
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', border: '1px solid #ddd', borderRadius: 1, textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: '#757575', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    File: {article.artPath.split(/[\\/]/).pop()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>

        {/* References */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            References ({article.references.length})
          </Typography>
          <Divider sx={{ my: 2 }} />

          {article.references.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No references added
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {article.references.map((ref, index) => {
                const isPrimary = article.artPrimaryRefEntry !== null &&
                                  article.artPrimaryRefEntry === ref.refNo
                return (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: isPrimary ? 'action.selected' : 'background.paper',
                      border: isPrimary ? '2px solid' : '1px solid',
                      borderColor: isPrimary ? 'primary.main' : 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            label={`#${Math.floor(ref.refNo)}`}
                            size="small"
                            color={isPrimary ? 'primary' : 'default'}
                          />
                          {isPrimary && (
                            <Chip label="Primary" color="primary" size="small" variant="outlined" />
                          )}
                          {ref.refIndex && (
                            <Chip label={ref.refIndex} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {ref.refTitle}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Publication:</strong> {ref.refPublication}
                      {ref.refYear !== null && Math.floor(ref.refYear) !== -1 && ` (${Math.floor(ref.refYear)})`}
                      {ref.refVolume !== null && Math.floor(ref.refVolume) !== -1 && `, Vol. ${Math.floor(ref.refVolume)}`}
                      {ref.refIssue !== null && Math.floor(ref.refIssue) !== -1 && `, Issue ${Math.floor(ref.refIssue)}`}
                      {((ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1) ||
                        (ref.refEndPage !== null && Math.floor(ref.refEndPage) !== -1)) &&
                        `, pp. ${ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1 ? Math.floor(ref.refStartPage) : '?'}-${ref.refEndPage !== null && Math.floor(ref.refEndPage) !== -1 ? Math.floor(ref.refEndPage) : '?'}`}
                    </Typography>

                    {ref.refDoi && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        <strong>DOI:</strong> {ref.refDoi}
                      </Typography>
                    )}

                    {ref.refAbs && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        <strong>Abstract:</strong> {ref.refAbs.substring(0, 200)}
                        {ref.refAbs.length > 200 && '...'}
                      </Typography>
                    )}

                    {/* Authors Display */}
                    {ref.authors && ref.authors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                          Authors ({ref.authors.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {ref.authors.map((author, authorIndex) => (
                            <Chip
                              key={authorIndex}
                              label={author}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Signatures Display */}
                    {ref.signatures && ref.signatures.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                          Signatures ({ref.signatures.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {ref.signatures.map((sig, sigIndex) => {
                            const author = authors.find(a => a.id === sig.authorId)
                            const affiliation = affiliations.find(a => a.id === sig.affiliationId)
                            return (
                              <Box
                                key={sigIndex}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  bgcolor: 'action.hover',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  px: 1,
                                  py: 0.5
                                }}
                              >
                                <Typography variant="caption" color="primary" fontWeight="bold">
                                  #{sig.order}
                                </Typography>
                                <Typography variant="caption">
                                  {author?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  @
                                </Typography>
                                <Typography variant="caption" color="secondary">
                                  {affiliation?.name || 'Unknown'}
                                </Typography>
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                )
              })}
            </Box>
          )}
        </Paper>

        {/* Entity Tags */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Entity Tags ({entityTags.length})
          </Typography>
          <Divider sx={{ my: 2 }} />

          {entityTags.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No entity tags
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {entityTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  color={getEntityTypeColor(tag.type) as any}
                  size="medium"
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Contributions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Contributions ({contributions.length})
          </Typography>
          <Divider sx={{ my: 2 }} />

          {contributions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No contributions defined
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contributions.map((contrib, index) => (
                <Paper
                  key={contrib.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Contribution #{index + 1}
                  </Typography>

                  {/* Contribution Description */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                      Description:
                    </Typography>
                    <Typography variant="body2">
                      {contrib.description || 'No description'}
                    </Typography>
                  </Box>

                  {/* Domain */}
                  {contrib.subjectId && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Domain:
                      </Typography>
                      <Chip
                        label={getDomainName(contrib.subjectId)}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  )}

                  {/* Improvements */}
                  {contrib.improvementIds && contrib.improvementIds.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Improvements ({contrib.improvementIds.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contrib.improvementIds.map((id) => {
                          const entity = allEntities.find(e => e.id === id)
                          if (!entity) return null
                          return (
                            <Box
                              key={id}
                              sx={{
                                p: 1.5,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                {entity.name || 'Unnamed'}
                              </Typography>
                              {entity.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {entity.description}
                                </Typography>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Algorithms */}
                  {contrib.algoIds && contrib.algoIds.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Algorithms ({contrib.algoIds.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contrib.algoIds.map((id) => {
                          const entity = allEntities.find(e => e.id === id)
                          if (!entity) return null
                          return (
                            <Box
                              key={id}
                              sx={{
                                p: 1.5,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                {entity.name || 'Unnamed'}
                              </Typography>
                              {entity.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {entity.description}
                                </Typography>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Research Objects */}
                  {contrib.objectIds && contrib.objectIds.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Research Objects ({contrib.objectIds.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contrib.objectIds.map((id) => {
                          const entity = allEntities.find(e => e.id === id)
                          if (!entity) return null
                          return (
                            <Box
                              key={id}
                              sx={{
                                p: 1.5,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                {entity.name || 'Unnamed'}
                              </Typography>
                              {entity.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {entity.description}
                                </Typography>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Solution To */}
                  {contrib.solutionToId && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Solution To:
                      </Typography>
                      {(() => {
                        const entity = allEntities.find(e => e.id === contrib.solutionToId)
                        if (!entity) return null
                        return (
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: 'action.hover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              {entity.name || 'Unnamed'}
                            </Typography>
                            {entity.description && (
                              <Typography variant="caption" color="text.secondary">
                                {entity.description}
                              </Typography>
                            )}
                          </Box>
                        )
                      })()}
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Paper>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Article"
          message={`Are you sure you want to delete "${article.artTitle}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </Box>
    </Layout>
  )
}

export default ArticleDetailPage

