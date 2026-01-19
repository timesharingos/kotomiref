import { useState, useCallback } from 'react'
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
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import DomainDialog from './DomainDialog'
import MainDomainDialog from './MainDomainDialog'

interface MainDomain {
  id: string
  name: string
}

interface SubDomain {
  id: string
  name: string
  mainDomainId: string
}

// TODO: Replace with database integration
const MOCK_MAIN_DOMAINS: MainDomain[] = [
  { id: 'main-1', name: 'Computer Science' },
  { id: 'main-2', name: 'Mathematics' },
  { id: 'main-3', name: 'Physics' }
]

const MOCK_SUB_DOMAINS: SubDomain[] = [
  { id: 'sub-1', name: 'Machine Learning', mainDomainId: 'main-1' },
  { id: 'sub-2', name: 'Computer Vision', mainDomainId: 'main-1' },
  { id: 'sub-3', name: 'Natural Language Processing', mainDomainId: 'main-1' },
  { id: 'sub-4', name: 'Algebra', mainDomainId: 'main-2' },
  { id: 'sub-5', name: 'Calculus', mainDomainId: 'main-2' }
]

function DomainTab() {
  const [mainDomains, setMainDomains] = useState<MainDomain[]>(MOCK_MAIN_DOMAINS)
  const [subDomains, setSubDomains] = useState<SubDomain[]>(MOCK_SUB_DOMAINS)
  const [selectedMainDomainId, setSelectedMainDomainId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Sub-domain dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Main domain dialog state
  const [mainDomainDialogOpen, setMainDomainDialogOpen] = useState(false)
  const [mainDomainDialogMode, setMainDomainDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedMainDomain, setSelectedMainDomain] = useState<MainDomain | null>(null)

  // Filter sub-domains by selected main domain and search query
  const filteredSubDomains = subDomains.filter(sub => {
    const matchesMainDomain = !selectedMainDomainId || sub.mainDomainId === selectedMainDomainId
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMainDomain && matchesSearch
  })

  // Sub-domain handlers
  const handleAddSubDomain = useCallback(() => {
    if (!selectedMainDomainId) {
      alert('Please select a main domain first')
      return
    }
    setDialogMode('add')
    setSelectedSubDomain(null)
    setDialogOpen(true)
  }, [selectedMainDomainId])

  const handleEditSubDomain = useCallback((subDomain: SubDomain) => {
    setDialogMode('edit')
    setSelectedSubDomain(subDomain)
    setDialogOpen(true)
  }, [])

  const handleDeleteSubDomain = useCallback((subDomain: SubDomain) => {
    if (window.confirm(`Are you sure you want to delete sub-domain "${subDomain.name}"?`)) {
      setSubDomains(prev => prev.filter(s => s.id !== subDomain.id))
    }
  }, [])

  const handleBatchDeleteSubDomains = useCallback(() => {
    if (selectedIds.size === 0) {
      alert('Please select sub-domains to delete')
      return
    }
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} sub-domain(s)?`)) {
      setSubDomains(prev => prev.filter(s => !selectedIds.has(s.id)))
      setSelectedIds(new Set())
    }
  }, [selectedIds])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    setSelectedSubDomain(null)
  }, [])

  const handleDialogSave = useCallback((data: { name: string }) => {
    if (dialogMode === 'add') {
      const newSubDomain: SubDomain = {
        id: `sub-${Date.now()}`,
        name: data.name,
        mainDomainId: selectedMainDomainId
      }
      setSubDomains(prev => [...prev, newSubDomain])
    } else if (selectedSubDomain) {
      setSubDomains(prev => prev.map(s =>
        s.id === selectedSubDomain.id ? { ...s, name: data.name } : s
      ))
    }
    handleDialogClose()
  }, [dialogMode, selectedMainDomainId, selectedSubDomain, handleDialogClose])

  // Main domain handlers
  const handleAddMainDomain = useCallback(() => {
    setMainDomainDialogMode('add')
    setSelectedMainDomain(null)
    setMainDomainDialogOpen(true)
  }, [])

  const handleEditMainDomain = useCallback(() => {
    if (!selectedMainDomainId) {
      alert('Please select a main domain first')
      return
    }
    const mainDomain = mainDomains.find(m => m.id === selectedMainDomainId)
    if (mainDomain) {
      setMainDomainDialogMode('edit')
      setSelectedMainDomain(mainDomain)
      setMainDomainDialogOpen(true)
    }
  }, [selectedMainDomainId, mainDomains])

  const handleDeleteMainDomain = useCallback(() => {
    if (!selectedMainDomainId) {
      alert('Please select a main domain first')
      return
    }
    const mainDomain = mainDomains.find(m => m.id === selectedMainDomainId)
    const subCount = subDomains.filter(s => s.mainDomainId === selectedMainDomainId).length

    if (window.confirm(
      `Are you sure you want to delete main domain "${mainDomain?.name}"?\n` +
      `This will also delete ${subCount} sub-domain(s).`
    )) {
      setSubDomains(prev => prev.filter(s => s.mainDomainId !== selectedMainDomainId))
      setMainDomains(prev => prev.filter(m => m.id !== selectedMainDomainId))
      setSelectedMainDomainId('')
    }
  }, [selectedMainDomainId, mainDomains, subDomains])

  const handleMainDomainDialogClose = useCallback(() => {
    setMainDomainDialogOpen(false)
    setSelectedMainDomain(null)
  }, [])

  const handleMainDomainDialogSave = useCallback((data: { name: string }) => {
    if (mainDomainDialogMode === 'add') {
      const newMainDomain: MainDomain = {
        id: `main-${Date.now()}`,
        name: data.name
      }
      setMainDomains(prev => [...prev, newMainDomain])
      setSelectedMainDomainId(newMainDomain.id)
    } else if (selectedMainDomain) {
      setMainDomains(prev => prev.map(m =>
        m.id === selectedMainDomain.id ? { ...m, name: data.name } : m
      ))
    }
    handleMainDomainDialogClose()
  }, [mainDomainDialogMode, selectedMainDomain, handleMainDomainDialogClose])

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(filteredSubDomains.map(s => s.id)))
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

  const isAllSelected = filteredSubDomains.length > 0 && selectedIds.size === filteredSubDomains.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredSubDomains.length

  return (
    <Box>
      {/* Main Domain Selection Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="main-domain-label">Main Domain</InputLabel>
            <Select
              labelId="main-domain-label"
              value={selectedMainDomainId}
              label="Main Domain"
              onChange={(e) => {
                setSelectedMainDomainId(e.target.value)
                setSelectedIds(new Set())
              }}
            >
              <MenuItem value="">
                <em>All Main Domains</em>
              </MenuItem>
              {mainDomains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem />

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddMainDomain}
          >
            Add Main Domain
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={handleEditMainDomain}
            disabled={!selectedMainDomainId}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteMainDomain}
            disabled={!selectedMainDomainId}
          >
            Delete
          </Button>
        </Box>
      </Paper>

      {/* Sub-domain Toolbar */}
      <Toolbar sx={{ pl: 0, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSubDomain}
          disabled={!selectedMainDomainId}
        >
          Add Sub-domain
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleBatchDeleteSubDomains}
          disabled={selectedIds.size === 0}
        >
          Delete Selected ({selectedIds.size})
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          placeholder="Search sub-domains..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }
          }}
          sx={{ width: 300 }}
        />
      </Toolbar>

      {/* Sub-domains Table */}
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
              <TableCell>Sub-domain Name</TableCell>
              <TableCell>Main Domain</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {selectedMainDomainId
                    ? 'No sub-domains found in this main domain'
                    : 'Please select a main domain or view all'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubDomains.map((subDomain) => {
                const mainDomain = mainDomains.find(m => m.id === subDomain.mainDomainId)
                return (
                  <TableRow
                    key={subDomain.id}
                    hover
                    selected={selectedIds.has(subDomain.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(subDomain.id)}
                        onChange={() => handleSelectOne(subDomain.id)}
                      />
                    </TableCell>
                    <TableCell>{subDomain.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {mainDomain?.name ?? 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditSubDomain(subDomain)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSubDomain(subDomain)}
                        aria-label="delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sub-domain Dialog */}
      <DomainDialog
        key={dialogOpen ? `${dialogMode}-${selectedSubDomain?.id ?? 'domainnew'}` : 'domainclosed'}
        open={dialogOpen}
        mode={dialogMode}
        domain={selectedSubDomain}
        title={dialogMode === 'add' ? 'Add Sub-domain' : 'Edit Sub-domain'}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
      />

      {/* Main Domain Dialog */}
      <MainDomainDialog
        key={mainDomainDialogOpen ? `${mainDomainDialogMode}-${selectedMainDomain?.id ?? 'maindomainnew'}` : 'maindomainclosed'}
        open={mainDomainDialogOpen}
        mode={mainDomainDialogMode}
        domain={selectedMainDomain}
        onClose={handleMainDomainDialogClose}
        onSave={handleMainDomainDialogSave}
      />
    </Box>
  )
}

export default DomainTab

