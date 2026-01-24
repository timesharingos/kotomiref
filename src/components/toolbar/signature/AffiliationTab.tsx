import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  TextField,
  IconButton,
  Toolbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Checkbox,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import AffiliationDialog from './AffiliationDialog'
import { toast } from 'react-toastify'

interface Affiliation {
  id: string
  name: string
  parentId: string | null // null means top-level
}

function AffiliationTab() {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedAffiliation, setSelectedAffiliation] = useState<Affiliation | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const loadAffiliations = async () => {
    try {
      await Promise.all([
        window.affiliation.getAll(),
        window.affiliation.getHierarchy()
      ]).then(([affs, hierarchy]) => {

      // Merge hierarchy data into affiliations
      const affiliationsWithParents = affs.map(aff => {
        const parentRel = hierarchy.find(h => h.childId === aff.id)
        return {
          ...aff,
          parentId: parentRel ? parentRel.parentId : null
        }
      })

      setAffiliations(affiliationsWithParents)
    })
    } catch (e) {
      console.error('Failed to load affiliations:', e)
    }
  }

  useEffect(() => {
    loadAffiliations()
  }, [])

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedAffiliation(null)
    setDialogOpen(true)
  }

  const handleEdit = (affiliation: Affiliation) => {
    setDialogMode('edit')
    setSelectedAffiliation(affiliation)
    setDialogOpen(true)
  }

  const handleDelete = async (affiliation: Affiliation) => {
    const children = getChildren(affiliation.id)
    const totalCount = 1 + countAllDescendants(affiliation.id)

    if (window.confirm(
      `Are you sure you want to delete "${affiliation.name}"?\n` +
      `This will also delete ${children.length} direct child(ren) and ${totalCount - 1} total descendant(s).`
    )) {
      try {
        const result = await window.affiliation.delete(affiliation.id)
        if (result.success) {
          await loadAffiliations()
        } else {
          toast.error(`Failed to delete: ${result.error}`)
        }
      } catch (e) {
        console.error('Delete failed:', e)
        toast.error('An error occurred while deleting')
      }
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select affiliations to delete')
      return
    }

    const totalCount = Array.from(selectedIds).reduce((sum, id) => {
      return sum + 1 + countAllDescendants(id)
    }, 0)

    if (window.confirm(
      `Are you sure you want to delete ${selectedIds.size} affiliation(s)?\n` +
      `This will also delete all their descendants (${totalCount} total).`
    )) {
      try {
        for (const id of Array.from(selectedIds)) {
          await window.affiliation.delete(id)
        }
        setSelectedIds(new Set())
        await loadAffiliations()
      } catch (e) {
        console.error('Batch delete failed:', e)
        toast.error('An error occurred during batch delete')
      }
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedAffiliation(null)
  }

  const handleDialogSave = async (data: { name: string; parentId: string | null }) => {
    try {
      let result
      if (dialogMode === 'add') {
        result = await window.affiliation.add(data)
      } else if (selectedAffiliation) {
        result = await window.affiliation.update({
          id: selectedAffiliation.id,
          ...data
        })
      }

      if (result?.success) {
        await loadAffiliations()
        handleDialogClose()
      } else {
        toast.error(`Failed to save: ${result?.error}`)
      }
    } catch (e) {
      console.error('Save failed:', e)
      toast.error('An error occurred while saving')
    }
  }

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
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

  const getChildren = (parentId: string | null): Affiliation[] => {
    return affiliations.filter(a => a.parentId === parentId)
  }

  const countAllDescendants = (id: string): number => {
    const children = getChildren(id)
    return children.reduce((sum, child) => {
      return sum + 1 + countAllDescendants(child.id)
    }, 0)
  }

  const filterAffiliations = (affs: Affiliation[]): Affiliation[] => {
    if (!searchQuery) return affs
    return affs.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  const renderAffiliationTree = (parentId: string | null, level: number = 0): React.ReactElement[] => {
    const children = getChildren(parentId)
    const filtered = filterAffiliations(children)

    return filtered.map((affiliation) => {
      const hasChildren = getChildren(affiliation.id).length > 0
      const isExpanded = expandedIds.has(affiliation.id)
      const isSelected = selectedIds.has(affiliation.id)

      return (
        <Box key={affiliation.id}>
          <ListItem
            sx={{
              pl: 2 + level * 4,
              bgcolor: isSelected ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => handleSelectOne(affiliation.id)}
              sx={{ mr: 1 }}
            />

            {hasChildren && (
              <IconButton
                size="small"
                onClick={() => handleToggleExpand(affiliation.id)}
                sx={{ mr: 1 }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}

            <ListItemText
              primary={affiliation.name}
              sx={{ ml: hasChildren ? 0 : 5 }}
            />

            <IconButton
              size="small"
              onClick={() => handleEdit(affiliation)}
              aria-label="edit"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(affiliation)}
              aria-label="delete"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>

          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {renderAffiliationTree(affiliation.id, level + 1)}
            </Collapse>
          )}
        </Box>
      )
    })
  }

  const topLevelAffiliations = getChildren(null)

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
          placeholder="Search affiliations..."
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

      {/* Affiliations Tree */}
      <Paper>
        <List>
          {topLevelAffiliations.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={
                  <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                    No affiliations found
                  </Typography>
                }
              />
            </ListItem>
          ) : (
            renderAffiliationTree(null)
          )}
        </List>
      </Paper>

      {/* Affiliation Dialog */}
      <AffiliationDialog
        key={dialogOpen ? `${dialogMode}-${selectedAffiliation?.id ?? 'new'}` : 'closed'}
        open={dialogOpen}
        mode={dialogMode}
        affiliation={selectedAffiliation}
        affiliations={affiliations}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
      />
    </Box>
  )
}

export default AffiliationTab

