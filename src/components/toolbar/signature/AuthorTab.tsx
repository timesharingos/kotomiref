import { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  IconButton,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import AuthorDialog from './AuthorDialog'

interface Author {
  id: string
  name: string
  affiliations: string[] // affiliation IDs
}

function AuthorTab() {
  const [authors] = useState<Author[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedAuthor(null)
    setDialogOpen(true)
  }

  const handleEdit = (author: Author) => {
    setDialogMode('edit')
    setSelectedAuthor(author)
    setDialogOpen(true)
  }

  const handleDelete = (author: Author) => {
    if (window.confirm(`Are you sure you want to delete author "${author.name}"?`)) {
      // TODO: Implement delete logic
      console.log('Delete author:', author)
    }
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      alert('Please select authors to delete')
      return
    }
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} author(s)?`)) {
      // TODO: Implement batch delete logic
      console.log('Batch delete authors:', Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedAuthor(null)
  }

  const handleDialogSave = (authorData: { name: string; affiliations: string[] }) => {
    if (dialogMode === 'add') {
      // TODO: Implement add logic
      console.log('Add author:', authorData)
    } else {
      // TODO: Implement edit logic
      console.log('Edit author:', authorData)
    }
    handleDialogClose()
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(filteredAuthors.map(a => a.id)))
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

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isAllSelected = filteredAuthors.length > 0 && selectedIds.size === filteredAuthors.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredAuthors.length

  return (
    <Box>
      {/* Toolbar */}
      <Toolbar sx={{ pl: 0, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleBatchDelete}
          disabled={selectedIds.size === 0}
        >
          Delete Selected ({selectedIds.size})
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          placeholder="Search authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ width: 300 }}
        />
      </Toolbar>

      {/* Authors Table */}
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
              <TableCell>Name</TableCell>
              <TableCell>Affiliations</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAuthors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No authors found
                </TableCell>
              </TableRow>
            ) : (
              filteredAuthors.map((author) => (
                <TableRow
                  key={author.id}
                  hover
                  selected={selectedIds.has(author.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(author.id)}
                      onChange={() => handleSelectOne(author.id)}
                    />
                  </TableCell>
                  <TableCell>{author.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {author.affiliations.map((affId) => (
                        <Chip key={affId} label={affId} size="small" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(author)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(author)}
                      aria-label="delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Author Dialog */}
      <AuthorDialog
        open={dialogOpen}
        mode={dialogMode}
        author={selectedAuthor}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
      />
    </Box>
  )
}

export default AuthorTab

