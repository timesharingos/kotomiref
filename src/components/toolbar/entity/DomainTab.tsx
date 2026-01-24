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
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'
import { toast } from 'react-toastify'

interface MainDomain {
  id: string
  name: string
  description?: string
}

interface SubDomain {
  id: string
  name: string
  description?: string
  mainDomainId: string
}

interface DomainData {
  mainDomains: MainDomain[]
  subDomains: SubDomain[]
}

async function fetchDomainData(): Promise<DomainData> {
  const [mainDomains, subDomainsRaw, relations] = await Promise.all([
    window.domain.getAllMain(),
    window.domain.getAllSub(),
    window.domain.getSubRelations()
  ])

  // Merge relation data into sub domains
  const subDomains = subDomainsRaw.map(sub => {
    const rel = relations.find(r => r.subDomainId === sub.id)
    return {
      ...sub,
      mainDomainId: rel ? rel.mainDomainId : ''
    }
  })

  return { mainDomains, subDomains }
}

function DomainTab() {
  const { data, reload } = useAsyncData(fetchDomainData, { mainDomains: [], subDomains: [] })
  const { mainDomains, subDomains } = data
  const { ConfirmDialogComponent, confirm } = useConfirmDialog()

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
  const filteredSubDomains = subDomains.filter((sub: SubDomain) => {
    const matchesMainDomain = !selectedMainDomainId || sub.mainDomainId === selectedMainDomainId
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMainDomain && matchesSearch
  })

  // Sub-domain handlers
  const handleAddSubDomain = useCallback(() => {
    if (!selectedMainDomainId) {
      toast.error('Please select a main domain first')
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

  const handleDeleteSubDomain = useCallback(async (subDomain: SubDomain) => {
    const confirmed = await confirm(
      'Delete Sub-domain',
      `Are you sure you want to delete sub-domain "${subDomain.name}"?`
    )
    if (confirmed) {
      try {
        const result = await window.domain.deleteSub(subDomain.id)
        if (result.success) {
          reload()
        } else {
          toast.error(`Failed to delete: ${result.error}`)
        }
      } catch (e) {
        console.error('Delete failed:', e)
        toast.error('An error occurred while deleting')
      }
    }
  }, [reload, confirm])

  const handleBatchDeleteSubDomains = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select sub-domains to delete')
      return
    }
    const confirmed = await confirm(
      'Delete Sub-domains',
      `Are you sure you want to delete ${selectedIds.size} sub-domain(s)?`
    )
    if (confirmed) {
      try {
        for (const id of Array.from(selectedIds)) {
          await window.domain.deleteSub(id)
        }
        setSelectedIds(new Set())
        reload()
      } catch (e) {
        console.error('Batch delete failed:', e)
        toast.error('An error occurred during batch delete')
      }
    }
  }, [selectedIds, reload, confirm])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    setSelectedSubDomain(null)
  }, [])

  const handleDialogSave = useCallback(async (data: { name: string; description?: string }) => {
    try {
      let result
      if (dialogMode === 'add') {
        result = await window.domain.addSub({
          name: data.name,
          desc: data.description || '',
          mainDomainId: selectedMainDomainId
        })
      } else if (selectedSubDomain) {
        result = await window.domain.updateSub({
          id: selectedSubDomain.id,
          name: data.name,
          desc: data.description || '',
          mainDomainId: selectedSubDomain.mainDomainId
        })
      }

      if (result?.success) {
        reload()
        handleDialogClose()
      } else {
        toast.error(`Failed to save: ${result?.error}`)
      }
    } catch (e) {
      console.error('Save failed:', e)
      toast.error('An error occurred while saving')
    }
  }, [dialogMode, selectedMainDomainId, selectedSubDomain, reload, handleDialogClose])

  // Main domain handlers
  const handleAddMainDomain = useCallback(() => {
    setMainDomainDialogMode('add')
    setSelectedMainDomain(null)
    setMainDomainDialogOpen(true)
  }, [])

  const handleEditMainDomain = useCallback(() => {
    if (!selectedMainDomainId) {
      toast.error('Please select a main domain first')
      return
    }
    const mainDomain = mainDomains.find((m: MainDomain) => m.id === selectedMainDomainId)
    if (mainDomain) {
      setMainDomainDialogMode('edit')
      setSelectedMainDomain(mainDomain)
      setMainDomainDialogOpen(true)
    }
  }, [selectedMainDomainId, mainDomains])

  const handleDeleteMainDomain = useCallback(async () => {
    if (!selectedMainDomainId) {
      toast.error('Please select a main domain first')
      return
    }
    const mainDomain = mainDomains.find((m: MainDomain) => m.id === selectedMainDomainId)
    const subCount = subDomains.filter((s: SubDomain) => s.mainDomainId === selectedMainDomainId).length

    const confirmed = await confirm(
      'Delete Main Domain',
      `Are you sure you want to delete main domain "${mainDomain?.name}"?\nThis will also delete ${subCount} sub-domain(s).`
    )
    if (confirmed) {
      try {
        const result = await window.domain.deleteMain(selectedMainDomainId)
        if (result.success) {
          setSelectedMainDomainId('')
          reload()
        } else {
          toast.error(`Failed to delete: ${result.error}`)
        }
      } catch (e) {
        console.error('Delete failed:', e)
        toast.error('An error occurred while deleting')
      }
    }
  }, [selectedMainDomainId, mainDomains, subDomains, reload, confirm])

  const handleMainDomainDialogClose = useCallback(() => {
    setMainDomainDialogOpen(false)
    setSelectedMainDomain(null)
  }, [])

  const handleMainDomainDialogSave = useCallback(async (data: { name: string; description?: string }) => {
    try {
      let result
      if (mainDomainDialogMode === 'add') {
        result = await window.domain.addMain({
          name: data.name,
          desc: data.description || ''
        })
        if (result.success && result.id) {
          setSelectedMainDomainId(result.id)
        }
      } else if (selectedMainDomain) {
        result = await window.domain.updateMain({
          id: selectedMainDomain.id,
          name: data.name,
          desc: data.description || ''
        })
      }

      if (result?.success) {
        reload()
        handleMainDomainDialogClose()
      } else {
        toast.error(`Failed to save: ${result?.error}`)
      }
    } catch (e) {
      console.error('Save failed:', e)
      toast.error('An error occurred while saving')
    }
  }, [mainDomainDialogMode, selectedMainDomain, reload, handleMainDomainDialogClose])

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(filteredSubDomains.map((s: SubDomain) => s.id)))
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
              MenuProps={{
                disablePortal: true,
                disableAutoFocusItem: true
              }}
            >
              <MenuItem value="">
                <em>All Main Domains</em>
              </MenuItem>
              {mainDomains.map((domain: MainDomain) => (
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
              <TableCell>Description</TableCell>
              <TableCell>Main Domain</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {selectedMainDomainId
                    ? 'No sub-domains found in this main domain'
                    : 'Please select a main domain or view all'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubDomains.map((subDomain: SubDomain) => {
                const mainDomain = mainDomains.find((m: MainDomain) => m.id === subDomain.mainDomainId)
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
                        {subDomain.description || '-'}
                      </Typography>
                    </TableCell>
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

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </Box>
  )
}

export default DomainTab

