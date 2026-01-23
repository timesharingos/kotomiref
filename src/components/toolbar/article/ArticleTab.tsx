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
  Grid,
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
import ArticleDialog from './ArticleDialog'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'

// Article data interface
interface ArticleItem {
  id: string
  title: string
  authors: string[]
  year: number
  publicationPlatform: string
  entityTags: {
    id: string
    name: string
    type: string
  }[]
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

const ArticleTab = () => {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [filteredArticles, setFilteredArticles] = useState<ArticleItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null)
  const [domains, setDomains] = useState<any[]>([])
  
  // Search criteria state
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    domain: '',
    title: '',
    year: '',
    author: '',
    publicationPlatform: ''
  })

  const { showConfirm } = useConfirmDialog()

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // TODO: Load articles from backend
      // const result = await window.article.getAll()
      // setArticles(result)
      // setFilteredArticles(result)
      
      // Load domains for search filter
      const domainsResult = await window.domain.getAll()
      setDomains(domainsResult)
      
      // Mock data for now
      setArticles([])
      setFilteredArticles([])
    } catch (e) {
      console.error('Failed to load articles:', e)
    }
  }

  // Search handler (placeholder)
  const handleSearch = () => {
    // TODO: Implement search logic
    console.log('Search criteria:', searchCriteria)
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

  const handleEdit = (article: ArticleItem) => {
    setDialogMode('edit')
    setSelectedArticle(article)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one article to delete')
      return
    }

    const confirmed = await showConfirm(
      'Delete Articles',
      `Are you sure you want to delete ${selectedIds.size} article(s)?`
    )

    if (confirmed) {
      try {
        // TODO: Implement delete logic
        // for (const id of selectedIds) {
        //   await window.article.delete(id)
        // }
        console.log('Delete articles:', Array.from(selectedIds))
        setSelectedIds(new Set())
        await loadData()
      } catch (e) {
        console.error('Failed to delete articles:', e)
        alert('Failed to delete articles')
      }
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedArticle(null)
  }

  const handleDialogSave = async (data: any) => {
    try {
      // TODO: Implement save logic
      // if (dialogMode === 'add') {
      //   await window.article.add(data)
      // } else {
      //   await window.article.update(data)
      // }
      console.log('Save article:', data)
      handleDialogClose()
      await loadData()
    } catch (e) {
      console.error('Failed to save article:', e)
      alert('Failed to save article')
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
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
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Title"
              value={searchCriteria.title}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Year"
              value={searchCriteria.year}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, year: e.target.value })}
              placeholder="e.g., 2023"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Author"
              value={searchCriteria.author}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, author: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Publication Platform"
              value={searchCriteria.publicationPlatform}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, publicationPlatform: e.target.value })}
            />
          </Grid>
        </Grid>
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
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
                      {article.entityTags.map((tag) => (
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
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(article)}
                      color="primary"
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
    </Box>
  )
}

export default ArticleTab

