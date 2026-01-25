import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Button,
  Toolbar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArticleDialog from './ArticleDialog'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router'

// Reference interface for type safety
interface ArticleReference {
  refNo: number
  refYear: number | null
  refPublication: string
  signatures?: Array<{ authorId: string }>
}

// Article data interface for display
interface ArticleItem {
  id: string
  title: string
  authors: string[]
  year: number | string
  publicationPlatform: string
  path?: string
  references?: ArticleReference[]
  entityTags?: string[]
  entityTagDetails?: Array<{ id: string; name: string; type: string }>
  contributions?: string[]
  domainId?: string
  domainName?: string
}

// Search criteria interface
interface SearchCriteria {
  domain: string
  title: string
  year: string
  author: string
  publicationPlatform: string
}

interface Signature {
  id?: string
  authorId: string
  affiliationId: string
  name: string
  sigNo: number
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
  refAbs: string
  signatures: Signature[]
}

interface EntityTag {
  id: string
  name: string
  type: string
  typeName: string
}

// ArticleData interface for dialog (matches ArticleDialog props)
interface ArticleData {
  id: string
  artTitle: string
  artPath: string
  artPrimaryRefEntry: number | null
  file: File | null
  references: Reference[]
  entityTags: (string | EntityTag)[]
  contributions: (string | EntityTag)[]
}

interface Domain {
  id: string
  name: string
}

const ArticleTab = () => {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [filteredArticles, setFilteredArticles] = useState<ArticleItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [allEntities, setAllEntities] = useState<Array<{ id: string; name: string; type: string; subjectId?: string }>>([])
  const [allAuthors, setAllAuthors] = useState<Array<{ id: string; name: string }>>([])

  // Search criteria state
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    domain: '',
    title: '',
    year: '',
    author: '',
    publicationPlatform: ''
  })

  const { ConfirmDialogComponent, confirm } = useConfirmDialog()

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load articles from backend
        const articlesResult = await window.article.getAll()

        // Load all authors to create a map
        const authorsData = await window.author.getAll()
        const authorMap = new Map(authorsData.map((author: { id: string; name: string }) => [author.id, author.name]))
        setAllAuthors(authorsData)

        // Load all entities for domain matching using new API
        const types = ['object', 'algo', 'improvement', 'problem', 'definition', 'contrib']
        const allEntitiesPromises = types.map(type => window.entity.getAllNodes(type))
        const allEntitiesArrays = await Promise.all(allEntitiesPromises)
        const entitiesData = allEntitiesArrays.flat()
        setAllEntities(entitiesData)

        // Transform articles to display format
        const transformedArticles = articlesResult.map((article: {
          id: string
          artTitle: string
          artPath: string
          artPrimaryRefEntry: number | null
          references: { refNo: number; refYear: number | null; refPublication: string; signatures: { authorId: string }[] }[]
          entityTags: string[]
          contributions: string[]
        }) => {
          // Find primary reference
          let primaryRef = null
          if (article.artPrimaryRefEntry !== -1 && article.references && article.references.length > 0) {
            // artPrimaryRefEntry is the refNo, need to find the reference with matching refNo
            primaryRef = article.references.find((ref) => ref.refNo === article.artPrimaryRefEntry)
          }

          // Get authors from primary reference signatures
          let authors: string[] = []
          if (primaryRef && primaryRef.signatures && primaryRef.signatures.length > 0) {
            // Map author IDs to author names
            authors = primaryRef.signatures
              .map((sig) => {
                const authorName = authorMap.get(sig.authorId)
                return authorName || 'Unknown'
              })
              .filter((name: string) => name !== 'Unknown')
          }

          // Get entity tag details with names and types
          const entityTagDetails = article.entityTags.map(tagId => {
            const entity = entitiesData.find((e: { id: string; name: string; type: string }) => e.id === tagId)
            return entity ? {
              id: entity.id,
              name: entity.name,
              type: entity.type
            } : null
          }).filter(tag => tag !== null)

          return {
            id: article.id,
            title: article.artTitle,
            authors: authors,
            year: primaryRef && primaryRef.refYear !== null && primaryRef.refYear !== -1 ? primaryRef.refYear : '',
            publicationPlatform: primaryRef && primaryRef.refPublication ? primaryRef.refPublication : '',
            path: article.artPath,
            references: article.references,
            entityTags: article.entityTags,
            entityTagDetails: entityTagDetails,
            contributions: article.contributions
          }
        })

        setArticles(transformedArticles)
        setFilteredArticles(transformedArticles)

        // Load domains for search filter (load both main and sub domains)
        const mainDomainsResult = await window.domain.getAllMain()
        const subDomainsResult = await window.domain.getAllSub()
        setDomains([...mainDomainsResult, ...subDomainsResult])
      } catch (e) {
        console.error('Failed to load articles:', e)
        toast.error('Failed to load articles')
      }
    }

    loadData()
  }, [])

  // Search handler
  const handleSearch = () => {
    console.log('Search criteria:', searchCriteria)

    // If all criteria are empty, show all articles
    if (!searchCriteria.domain && !searchCriteria.title && !searchCriteria.year &&
        !searchCriteria.author && !searchCriteria.publicationPlatform) {
      setFilteredArticles(articles)
      return
    }

    // Filter articles based on search criteria
    const filtered = articles.filter((article) => {
      // 1. Domain filter: check if any entity tag belongs to this domain
      if (searchCriteria.domain) {
        const articleEntityIds = [...(article.entityTags || []), ...(article.contributions || [])]
        const hasMatchingDomain = articleEntityIds.some(entityId => {
          const entity = allEntities.find(e => e.id === entityId)
          return entity && entity.subjectId === searchCriteria.domain
        })
        if (!hasMatchingDomain) return false
      }

      // 2. Title filter: check article title (case-insensitive partial match)
      if (searchCriteria.title) {
        const titleMatch = article.title.toLowerCase().includes(searchCriteria.title.toLowerCase())
        if (!titleMatch) return false
      }

      // 3. Year filter: check any reference year
      if (searchCriteria.year) {
        const yearMatch = article.references?.some((ref) => {
          return ref.refYear && ref.refYear.toString() === searchCriteria.year
        })
        if (!yearMatch) return false
      }

      // 4. Publication Platform filter: check any reference publication (case-insensitive partial match)
      if (searchCriteria.publicationPlatform) {
        const pubMatch = article.references?.some((ref) => {
          return ref.refPublication &&
                 ref.refPublication.toLowerCase().includes(searchCriteria.publicationPlatform.toLowerCase())
        })
        if (!pubMatch) return false
      }

      // 5. Author filter: check any signature in any reference (case-insensitive partial match)
      if (searchCriteria.author) {
        const authorMatch = article.references?.some((ref) => {
          return ref.signatures?.some((sig) => {
            const author = allAuthors.find(a => a.id === sig.authorId)
            return author && author.name.toLowerCase().includes(searchCriteria.author.toLowerCase())
          })
        })
        if (!authorMatch) return false
      }

      return true
    })

    // Sort filtered articles
    const sorted = sortArticles(filtered)
    setFilteredArticles(sorted)
  }

  // Sort articles: first by domain (grouped), then by title within each domain group
  const sortArticles = (articlesToSort: ArticleItem[]) => {
    // Calculate domain hit rate for each article
    const articlesWithDomain = articlesToSort.map(article => {
      const articleEntityIds = [...(article.entityTags || []), ...(article.contributions || [])]

      // Find the most common domain among all entity tags
      const domainCounts = new Map<string, number>()
      articleEntityIds.forEach(entityId => {
        const entity = allEntities.find(e => e.id === entityId)
        if (entity && entity.subjectId) {
          domainCounts.set(entity.subjectId, (domainCounts.get(entity.subjectId) || 0) + 1)
        }
      })

      // Get the domain with highest count (hit rate)
      let primaryDomain = ''
      let maxCount = 0
      domainCounts.forEach((count, domainId) => {
        if (count > maxCount) {
          maxCount = count
          primaryDomain = domainId
        }
      })

      // Get domain name for sorting
      const domain = domains.find(d => d.id === primaryDomain)
      const domainName = domain ? domain.name : 'zzz_no_domain' // Put articles without domain at the end

      return {
        ...article,
        domainId: primaryDomain,
        domainName: domainName,
        domainHitRate: maxCount
      }
    })

    // Sort: first by domain name (alphabetically), then by title (alphabetically) within each domain
    return articlesWithDomain.sort((a, b) => {
      // First compare domain names
      const domainCompare = a.domainName.localeCompare(b.domainName)
      if (domainCompare !== 0) return domainCompare

      // If same domain, compare titles
      return a.title.localeCompare(b.title)
    })
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchCriteria({
      domain: '',
      title: '',
      year: '',
      author: '',
      publicationPlatform: ''
    })
    setFilteredArticles(articles)
  }

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(filteredArticles.map(article => article.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // CRUD handlers
  const handleAdd = () => {
    setDialogMode('add')
    setSelectedArticle(null)
    setDialogOpen(true)
  }

  const handleEdit = async (article: ArticleItem) => {
    setDialogMode('edit')

    // Fetch full article data from backend
    try {
      const fullArticle = await window.article.getById(article.id)
      if (fullArticle) {
        // Convert backend references to frontend format
        const convertedReferences: Reference[] = fullArticle.references.map(ref => ({
          ...ref,
          signatures: ref.signatures.map(sig => ({
            id: sig.id,
            authorId: sig.authorId,
            affiliationId: sig.affiliationId,
            name: '', // Will be populated by the dialog
            sigNo: sig.order
          }))
        }))

        // Load entity details for tags and contributions using new API
        const types = ['object', 'algo', 'improvement', 'problem', 'definition', 'contrib']
        const allEntitiesPromises = types.map(type => window.entity.getAllNodes(type))
        const allEntitiesArrays = await Promise.all(allEntitiesPromises)
        const allEntities = allEntitiesArrays.flat()

        // Convert entity tag IDs to entity objects
        const entityTagObjects: EntityTag[] = fullArticle.entityTags
          .map(tagId => {
            const entity = allEntities.find(e => e.id === tagId)
            if (entity) {
              return {
                id: entity.id,
                name: entity.name,
                type: entity.type,
                typeName: entity.type
              }
            }
            return null
          })
          .filter((tag): tag is EntityTag => tag !== null)

        // Load full contribution data
        const contributionObjects = await Promise.all(
          fullArticle.contributions.map(async (contribId) => {
            try {
              // Get full contribution details using new API
              const contribEntities = await window.entity.getAllNodes('contrib')
              const fullContrib = contribEntities.find(e => e.id === contribId)

              if (fullContrib) {
                return {
                  id: fullContrib.id,
                  name: fullContrib.name || '',
                  type: 'contrib' as const,
                  typeName: 'contrib',
                  description: fullContrib.description,
                  subjectId: fullContrib.subjectId,
                  improvementIds: fullContrib.improvementIds || [],
                  algoIds: fullContrib.algoIds || [],
                  objectIds: fullContrib.objectIds || [],
                  solutionToId: fullContrib.solutionToId,
                  aliasIds: fullContrib.aliasIds || [],
                  parentIds: fullContrib.parentIds || []
                }
              }
              return null
            } catch (error) {
              console.error(`Failed to load contribution ${contribId}:`, error)
              return null
            }
          })
        )

        const validContributions = contributionObjects.filter((c): c is NonNullable<typeof c> => c !== null)

        // Convert to ArticleData format expected by dialog
        const articleData: ArticleData = {
          id: fullArticle.id,
          artTitle: fullArticle.artTitle,
          artPath: fullArticle.artPath,
          artPrimaryRefEntry: fullArticle.artPrimaryRefEntry,
          file: null, // File is not stored, only path
          references: convertedReferences,
          entityTags: entityTagObjects,
          contributions: validContributions
        }
        setSelectedArticle(articleData)
      } else {
        toast.error('Failed to load article details')
      }
    } catch (error) {
      console.error('Failed to fetch article:', error)
      toast.error('Failed to load article details')
    }

    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one article to delete')
      return
    }

    const confirmed = await confirm(
      'Delete Articles',
      `Are you sure you want to delete ${selectedIds.size} article(s)? This will also delete all associated references and signatures.`
    )

    if (confirmed) {
      try {
        let successCount = 0
        let failCount = 0

        for (const id of selectedIds) {
          const result = await window.article.delete(id)
          if (result.success) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to delete article ${id}:`, result.error)
          }
        }

        setSelectedIds(new Set())

        if (successCount > 0) {
          toast.success(`Successfully deleted ${successCount} article(s)`)
        }
        if (failCount > 0) {
          toast.error(`Failed to delete ${failCount} article(s)`)
        }

        // Reload data after delete
        window.location.reload()
      } catch (e) {
        console.error('Failed to delete articles:', e)
        toast.error('Failed to delete articles')
      }
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedArticle(null)
  }

  const handleDialogSave = async (data: ArticleData) => {
    try {
      console.log('Save article:', data)
      handleDialogClose()
      // Reload data after save
      window.location.reload()
    } catch (e) {
      console.error('Failed to save article:', e)
      toast.error('Failed to save article')
    }
  }

  const isAllSelected = filteredArticles.length > 0 && selectedIds.size === filteredArticles.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredArticles.length

  return (
    <Box>
      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Search Articles
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Domain</InputLabel>
              <Select
                value={searchCriteria.domain}
                label="Domain"
                onChange={(e) => setSearchCriteria({ ...searchCriteria, domain: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              size="small"
              label="Title"
              value={searchCriteria.title}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, title: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              size="small"
              label="Year"
              value={searchCriteria.year}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, year: e.target.value })}
              placeholder="e.g., 2023"
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              size="small"
              label="Author"
              value={searchCriteria.author}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, author: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              size="small"
              label="Publication Platform"
              value={searchCriteria.publicationPlatform}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, publicationPlatform: e.target.value })}
            />
          </Box>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearSearch}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Articles ({filteredArticles.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ mr: 1 }}
          >
            Add
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={selectedIds.size === 0}
          >
            Delete ({selectedIds.size})
          </Button>
        </Toolbar>
      </Paper>

      {/* Articles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Publication Platform</TableCell>
              <TableCell>Entity Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No articles found. Click "Add" to create a new article.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((article) => (
                <TableRow
                  key={article.id}
                  hover
                  selected={selectedIds.has(article.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(article.id)}
                      onChange={() => handleSelectOne(article.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => navigate(`/article/${article.id}`)}
                    >
                      {article.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {article.authors.join(', ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {article.year}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {article.publicationPlatform}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 400 }}>
                      {article.entityTagDetails && article.entityTagDetails.length > 0 ? (
                        article.entityTagDetails.map((tag) => (
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
                              'default'
                            }
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tags
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/article/${article.id}`)}
                      color="info"
                      title="View Details"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(article)}
                      color="primary"
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Article Dialog */}
      <ArticleDialog
        open={dialogOpen}
        mode={dialogMode}
        article={selectedArticle}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
      />

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </Box>
  )
}

export default ArticleTab

