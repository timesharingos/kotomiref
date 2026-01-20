import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ObjectDialog from './ObjectDialog'
import QuickAddDomainDialog from './QuickAddDomainDialog'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'

// Entity type definitions
type EntityType = 'object' | 'algo' | 'improvement' | 'contrib' | 'problem' | 'definition'

interface EntityTypeInfo {
  value: EntityType
  label: string
  columns: string[]
}

const ENTITY_TYPES: EntityTypeInfo[] = [
  {
    value: 'object',
    label: 'Research Object',
    columns: ['Name', 'Description', 'Domain', 'Alias', 'Parent', 'Relations']
  },
  {
    value: 'algo',
    label: 'Algorithm',
    columns: ['Name', 'Description', 'Domain', 'Alias', 'Parent', 'Relations']
  },
  {
    value: 'improvement',
    label: 'Improvement',
    columns: ['Name', 'Description', 'Metric', 'Result (String)', 'Result (Number)', 'Domain']
  },
  {
    value: 'contrib',
    label: 'Contribution',
    columns: ['Description', 'Domain']
  },
  {
    value: 'problem',
    label: 'Problem',
    columns: ['Name', 'Description', 'Domain', 'Alias', 'Parent', 'Relations']
  },
  {
    value: 'definition',
    label: 'Scenario',
    columns: ['Name', 'Description', 'Domain', 'Alias', 'Parent', 'Relations']
  }
]

// Entity data interface
interface EntityItem {
  id: string
  name?: string
  description?: string
  metric?: string
  metricResultString?: string
  metricResultNumber?: number
  subjectId?: string
  subjectName?: string
  aliasIds?: string[]
  aliasNames?: string[]
  parentIds?: string[]
  parentNames?: string[]
  relationIds?: string[]
  relationNames?: string[]
}

interface SubDomain {
  id: string
  name: string
  mainDomainId: string
}

interface MainDomain {
  id: string
  name: string
}

interface AllEntityItem {
  id: string
  name: string
  type: string
  typeName: string
}

function TechEntityTab() {
  const [selectedType, setSelectedType] = useState<EntityType>('object')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedDomainId, setSelectedDomainId] = useState<string>('') // '' means all domains

  // Data states
  const [entities, setEntities] = useState<EntityItem[]>([])
  const [subDomains, setSubDomains] = useState<SubDomain[]>([])
  const [mainDomains, setMainDomains] = useState<MainDomain[]>([])
  const [allEntities, setAllEntities] = useState<AllEntityItem[]>([])

  // Dialog states
  const [objectDialogOpen, setObjectDialogOpen] = useState(false)
  const [objectDialogMode, setObjectDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedObject, setSelectedObject] = useState<EntityItem | null>(null)
  const [quickAddDomainOpen, setQuickAddDomainOpen] = useState(false)

  const { ConfirmDialogComponent, confirm } = useConfirmDialog()

  const currentTypeInfo = ENTITY_TYPES.find(t => t.value === selectedType)!

  // Load data
  const loadData = useCallback(async () => {
    try {
      // Load domains for the Object dialog
      await Promise.all([
        window.domain.getAllMain(),
        window.domain.getAllSub(),
        window.domain.getSubRelations()
      ]).then(async ([mainDomainsData, subDomainsData, relationsData]) => {

      setMainDomains(mainDomainsData)

      const subDomainsWithMain = subDomainsData.map(sub => {
        const rel = relationsData.find(r => r.subDomainId === sub.id)
        return {
          ...sub,
          mainDomainId: rel ? rel.mainDomainId : ''
        }
      })
      setSubDomains(subDomainsWithMain)

      // Load entities of current type
      const entitiesData = await window.entity.getAllByType(selectedType)
      setEntities(entitiesData)

      // Load all entities for relationship selection
      const allEntitiesData = await window.entity.getAll()
      setAllEntities(allEntitiesData)
    })
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }, [selectedType])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredEntities = entities.filter(entity => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = (
      entity.name?.toLowerCase().includes(searchLower) ||
      entity.description?.toLowerCase().includes(searchLower)
    )

    // Filter by domain if selected
    if (selectedDomainId) {
      // Check if entity's subject matches the selected domain
      // Or if selected domain is a main domain, check if entity's subject is a sub domain of it
      const matchesDomain = entity.subjectId === selectedDomainId

      // If selected domain is a main domain, also include entities with sub domains of this main domain
      const selectedMainDomain = mainDomains.find(d => d.id === selectedDomainId)
      if (selectedMainDomain) {
        const subDomainsOfMain = subDomains.filter(sd => sd.mainDomainId === selectedDomainId)
        const subDomainIds = subDomainsOfMain.map(sd => sd.id)
        return matchesSearch && (matchesDomain || subDomainIds.includes(entity.subjectId || ''))
      }

      return matchesSearch && matchesDomain
    }

    return matchesSearch
  })

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(filteredEntities.map(e => e.id)))
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

  const handleAdd = () => {
    if (selectedType === 'object') {
      setObjectDialogMode('add')
      setSelectedObject(null)
      setObjectDialogOpen(true)
    } else {
      // TODO: Implement for other types
      console.log('Add entity of type:', selectedType)
    }
  }

  const handleEdit = (entity: EntityItem) => {
    if (selectedType === 'object') {
      setObjectDialogMode('edit')
      setSelectedObject(entity)
      setObjectDialogOpen(true)
    } else {
      // TODO: Implement for other types
      console.log('Edit entity:', entity)
    }
  }

  const handleDelete = async (entity: EntityItem) => {
    const confirmed = await confirm(
      'Delete Entity',
      `Are you sure you want to delete "${entity.name || 'this entity'}"?`
    )
    if (confirmed) {
      try {
        let result
        if (selectedType === 'object') {
          result = await window.entity.deleteObject(entity.id)
        } else {
          // TODO: Implement for other types
          console.log('Delete entity:', entity)
          return
        }

        if (result.success) {
          await loadData()
        } else {
          alert(`Failed to delete: ${result.error}`)
        }
      } catch (e) {
        console.error('Delete failed:', e)
        alert('An error occurred while deleting')
      }
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return

    const confirmed = await confirm(
      'Delete Entities',
      `Are you sure you want to delete ${selectedIds.size} entit${selectedIds.size > 1 ? 'ies' : 'y'}?`
    )
    if (confirmed) {
      try {
        for (const id of Array.from(selectedIds)) {
          if (selectedType === 'object') {
            await window.entity.deleteObject(id)
          } else {
            // TODO: Implement for other types
            console.log('Delete entity:', id)
          }
        }
        setSelectedIds(new Set())
        await loadData()
      } catch (e) {
        console.error('Batch delete failed:', e)
        alert('An error occurred during batch delete')
      }
    }
  }

  const handleObjectDialogClose = () => {
    setObjectDialogOpen(false)
    setSelectedObject(null)
  }

  const handleObjectDialogSave = async (data: {
    id?: string
    name: string
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
  }) => {
    try {
      let result
      if (objectDialogMode === 'add') {
        result = await window.entity.addObject(data)
      } else if (data.id) {
        result = await window.entity.updateObject(data)
      }

      if (result?.success) {
        handleObjectDialogClose()
        await loadData()
      } else {
        alert(`Failed to save: ${result?.error}`)
      }
    } catch (e) {
      console.error('Failed to save object:', e)
      alert('An error occurred while saving')
    }
  }

  const handleQuickAddDomain = () => {
    setQuickAddDomainOpen(true)
  }

  const handleQuickAddDomainSave = async (data: {
    type: 'main' | 'sub'
    name: string
    description?: string
    mainDomainId?: string
  }) => {
    try {
      let result
      if (data.type === 'main') {
        // Add Main Domain
        result = await window.domain.addMain({
          name: data.name,
          desc: data.description || ''
        })
      } else {
        // Add Sub Domain
        if (!data.mainDomainId) {
          return { success: false, error: 'Main domain is required for sub domain' }
        }
        result = await window.domain.addSub({
          name: data.name,
          desc: data.description || '',
          mainDomainId: data.mainDomainId
        })
      }

      if (result.success) {
        // Reload domains
        await loadData()
        return { success: true, id: result.id }
      } else {
        return { success: false, error: result.error }
      }
    } catch (e) {
      console.error('Failed to add domain:', e)
      return { success: false, error: 'An error occurred' }
    }
  }

  const isAllSelected = filteredEntities.length > 0 && selectedIds.size === filteredEntities.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredEntities.length

  const renderTableCell = (entity: EntityItem, column: string) => {
    switch (column) {
      case 'Name':
        return entity.name || '-'
      case 'Description':
        return (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entity.description || '-'}
          </Typography>
        )
      case 'Domain':
        return entity.subjectName || '-'
      case 'Alias':
        return entity.aliasNames && entity.aliasNames.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {entity.aliasNames.map((name, idx) => (
              <Chip key={idx} label={name} size="small" />
            ))}
          </Box>
        ) : '-'
      case 'Parent':
        return entity.parentNames && entity.parentNames.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {entity.parentNames.map((name, idx) => (
              <Chip key={idx} label={name} size="small" />
            ))}
          </Box>
        ) : '-'
      case 'Relations':
        return entity.relationNames && entity.relationNames.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {entity.relationNames.map((name, idx) => (
              <Chip key={idx} label={name} size="small" />
            ))}
          </Box>
        ) : '-'
      case 'Metric':
        return entity.metric || '-'
      case 'Result (String)':
        return entity.metricResultString || '-'
      case 'Result (Number)':
        return entity.metricResultNumber !== undefined ? entity.metricResultNumber : '-'
      default:
        return '-'
    }
  }

  return (
    <Box>
      {/* Entity Type Selection */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel id="entity-type-label">Entity Type</InputLabel>
            <Select
              labelId="entity-type-label"
              value={selectedType}
              label="Entity Type"
              onChange={(e) => {
                setSelectedType(e.target.value as EntityType)
                setSelectedIds(new Set())
                setSearchQuery('')
              }}
            >
              {ENTITY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel id="domain-filter-label">Filter by Domain</InputLabel>
            <Select
              labelId="domain-filter-label"
              value={selectedDomainId}
              label="Filter by Domain"
              onChange={(e) => {
                setSelectedDomainId(e.target.value)
                setSelectedIds(new Set())
              }}
            >
              <MenuItem value="">
                <em>All Domains</em>
              </MenuItem>

              {/* Main Domains */}
              {mainDomains.length > 0 && (
                <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Main Domains
                </MenuItem>
              )}
              {mainDomains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id} sx={{ pl: 4 }}>
                  {domain.name}
                </MenuItem>
              ))}

              {/* Sub Domains */}
              {subDomains.length > 0 && (
                <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                  Sub Domains
                </MenuItem>
              )}
              {subDomains.map((domain) => {
                const mainDomain = mainDomains.find(m => m.id === domain.mainDomainId)
                return (
                  <MenuItem key={domain.id} value={domain.id} sx={{ pl: 4 }}>
                    {domain.name} {mainDomain && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({mainDomain.name})</Typography>}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        </Box>
      </Paper>

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
          placeholder={`Search ${currentTypeInfo.label}...`}
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

      {/* Entities Table */}
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
              {currentTypeInfo.columns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={currentTypeInfo.columns.length + 2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No {currentTypeInfo.label} found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntities.map((entity) => (
                <TableRow
                  key={entity.id}
                  hover
                  selected={selectedIds.has(entity.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(entity.id)}
                      onChange={() => handleSelectOne(entity.id)}
                    />
                  </TableCell>
                  {currentTypeInfo.columns.map((column) => (
                    <TableCell key={column}>
                      {renderTableCell(entity, column)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(entity)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(entity)}
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

      {/* Object Dialog */}
      {selectedType === 'object' && (
        <ObjectDialog
          key={objectDialogOpen ? `${objectDialogMode}-${selectedObject?.id ?? 'new'}` : 'closed'}
          open={objectDialogOpen}
          mode={objectDialogMode}
          object={selectedObject ? {
            id: selectedObject.id,
            name: selectedObject.name || '',
            description: selectedObject.description || '',
            subjectId: selectedObject.subjectId || '',
            aliasIds: selectedObject.aliasIds || [],
            parentIds: selectedObject.parentIds || [],
            relationIds: selectedObject.relationIds || []
          } : null}
          mainDomains={mainDomains}
          subDomains={subDomains}
          allEntities={allEntities}
          onClose={handleObjectDialogClose}
          onSave={handleObjectDialogSave}
          onQuickAddDomain={handleQuickAddDomain}
        />
      )}

      {/* Quick Add Domain Dialog */}
      <QuickAddDomainDialog
        open={quickAddDomainOpen}
        mainDomains={mainDomains}
        onClose={() => setQuickAddDomainOpen(false)}
        onSave={handleQuickAddDomainSave}
      />

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </Box>
  )
}

export default TechEntityTab
