import { useState } from 'react'
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
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'

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
    columns: ['Name', 'Description']
  },
  {
    value: 'algo',
    label: 'Algorithm',
    columns: ['Name', 'Description']
  },
  {
    value: 'improvement',
    label: 'Improvement',
    columns: ['Name', 'Description', 'Metric', 'Result (String)', 'Result (Number)']
  },
  {
    value: 'contrib',
    label: 'Contribution',
    columns: ['Description']
  },
  {
    value: 'problem',
    label: 'Problem',
    columns: ['Name', 'Description']
  },
  {
    value: 'definition',
    label: 'Scenario',
    columns: ['Name', 'Description']
  }
]

// Mock data interface - will be replaced with actual data
interface EntityItem {
  id: string
  name?: string
  description?: string
  metric?: string
  metricResultString?: string
  metricResultNumber?: number
}

function TechEntityTab() {
  const [selectedType, setSelectedType] = useState<EntityType>('object')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Mock data - will be replaced with actual API calls
  const [entities] = useState<EntityItem[]>([])

  const currentTypeInfo = ENTITY_TYPES.find(t => t.value === selectedType)!

  const filteredEntities = entities.filter(entity => {
    const searchLower = searchQuery.toLowerCase()
    return (
      entity.name?.toLowerCase().includes(searchLower) ||
      entity.description?.toLowerCase().includes(searchLower)
    )
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
    // TODO: Implement add functionality
    console.log('Add entity of type:', selectedType)
  }

  const handleEdit = (entity: EntityItem) => {
    // TODO: Implement edit functionality
    console.log('Edit entity:', entity)
  }

  const handleDelete = (entity: EntityItem) => {
    // TODO: Implement delete functionality
    console.log('Delete entity:', entity)
  }

  const handleBatchDelete = () => {
    // TODO: Implement batch delete functionality
    console.log('Batch delete entities:', Array.from(selectedIds))
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
    </Box>
  )
}

export default TechEntityTab
