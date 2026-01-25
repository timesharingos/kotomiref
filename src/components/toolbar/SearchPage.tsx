import { useState, useEffect, useCallback } from 'react'
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import Layout from '../Layout'
import { toast } from 'react-toastify'

interface SearchNode {
  id: string
  name: string
  description: string
  type: string
}

interface SearchEdge {
  from: string
  to: string
  type: string
}

interface SearchGraphResult {
  nodes: SearchNode[]
  edges: SearchEdge[]
}

interface EntityOption {
  id: string
  name: string
  type: string
}

type SearchType =
  | 'problemEvolution'
  | 'definitionEvolution'
  | 'entityImprovement'
  | 'problemDefinitions'
  | 'oneHopNeighbors'

function SearchPage() {
  const [searchType, setSearchType] = useState<SearchType>('problemEvolution')
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null)
  const [searchResult, setSearchResult] = useState<SearchGraphResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [loadingEntities, setLoadingEntities] = useState(false)

  // Load entities based on search type


  const loadEntities = useCallback(async () => {
    setLoadingEntities(true)
    try {
      let entityType = ''

      switch (searchType) {
        case 'problemEvolution':
        case 'problemDefinitions':
          entityType = 'problem'
          break
        case 'definitionEvolution':
          entityType = 'definition'
          break
        case 'entityImprovement':
          // Load all entity types for improvement search
          entityType = 'all'
          break
        case 'oneHopNeighbors':
          // Load all entity types for neighbor search
          entityType = 'all'
          break
      }

      if (entityType === 'all') {
        // Use new API: getAllNodes for each type
        const types = ['object', 'algo', 'improvement', 'problem', 'definition', 'contrib']
        const allEntitiesPromises = types.map(async (type) => {
          const entities = await window.entity.getAllNodes(type)
          // Add type field to each entity and ensure name is always a string
          return entities.map(entity => ({
            id: entity.id,
            name: entity.name || entity.id, // Fallback to ID if name is missing
            type: type
          }))
        })
        const allEntitiesArrays = await Promise.all(allEntitiesPromises)
        const allEntities = allEntitiesArrays.flat()

        setEntities(allEntities)
      } else {
        // Use new API: getAllNodes
        const result = await window.entity.getAllNodes(entityType)
        setEntities(result.map(e => ({
          id: e.id,
          name: e.name || '',
          type: entityType
        })))
      }
    } catch (error) {
      console.error('Failed to load entities:', error)
      toast.error('Failed to load entities')
    } finally {
      setLoadingEntities(false)
    }
  }, [searchType])

  useEffect(() => {
    loadEntities()
  }, [searchType, loadEntities]) 

  const handleSearch = async () => {
    if (!selectedEntity) {
      toast.error('Please select an entity')
      return
    }

    setLoading(true)
    try {
      let result: SearchGraphResult

      switch (searchType) {
        case 'problemEvolution':
          result = await window.search.problemEvolutionChain(selectedEntity.id)
          break
        case 'definitionEvolution':
          result = await window.search.definitionEvolutionChain(selectedEntity.id)
          break
        case 'entityImprovement':
          result = await window.search.entityImprovementPath(selectedEntity.id)
          break
        case 'problemDefinitions':
          result = await window.search.problemDefinitionsAndSolutions(selectedEntity.id)
          break
        case 'oneHopNeighbors':
          result = await window.search.oneHopNeighbors(selectedEntity.id)
          break
        default:
          throw new Error('Invalid search type')
      }

      setSearchResult(result)

      if (result.nodes.length === 0) {
        toast.info('No results found')
      } else {
        toast.success(`Found ${result.nodes.length} nodes and ${result.edges.length} relationships`)
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNodeClick = async (nodeId: string) => {
    // When clicking a node, search for its one-hop neighbors
    setLoading(true)
    try {
      const result = await window.search.oneHopNeighbors(nodeId)
      setSearchResult(result)
      toast.success(`Found ${result.nodes.length} neighbors`)
    } catch (error) {
      console.error('Failed to get neighbors:', error)
      toast.error('Failed to get neighbors')
    } finally {
      setLoading(false)
    }
  }

  const getSearchTypeLabel = (type: SearchType): string => {
    switch (type) {
      case 'problemEvolution':
        return 'Problem Evolution Chain'
      case 'definitionEvolution':
        return 'Definition Evolution Chain'
      case 'entityImprovement':
        return 'Entity Improvement Path'
      case 'problemDefinitions':
        return 'Problem Definitions & Solutions'
      case 'oneHopNeighbors':
        return 'One-Hop Neighbors'
      default:
        return ''
    }
  }

  const getNodeColor = (nodeType: string): string => {
    switch (nodeType) {
      case 'problem':
        return '#ff6b6b'
      case 'definition':
        return '#4ecdc4'
      case 'entity':
        return '#95e1d3'
      case 'object':
        return '#51cf66'
      case 'algo':
        return '#339af0'
      case 'improvement':
        return '#f38181'
      case 'scenario':
        return '#aa96da'
      case 'contribution':
        return '#fcbad3'
      case 'center':
        return '#ffd93d'
      case 'neighbor':
        return '#a8dadc'
      default:
        return '#6c757d'
    }
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          Knowledge Graph Search
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Search and explore relationships in the knowledge graph
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Search Type</InputLabel>
                <Select
                  value={searchType}
                  label="Search Type"
                  onChange={(e) => {
                    setSearchType(e.target.value as SearchType)
                    setSelectedEntity(null)
                    setSearchResult(null)
                  }}
                >
                  <MenuItem value="problemEvolution">Problem Evolution Chain</MenuItem>
                  <MenuItem value="definitionEvolution">Definition Evolution Chain</MenuItem>
                  <MenuItem value="entityImprovement">Entity Improvement Path</MenuItem>
                  <MenuItem value="problemDefinitions">Problem Definitions & Solutions</MenuItem>
                  <MenuItem value="oneHopNeighbors">One-Hop Neighbors</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                value={selectedEntity}
                onChange={(_, newValue) => setSelectedEntity(newValue)}
                options={entities}
                getOptionLabel={(option) => `${option.name} (${option.type})`}
                loading={loadingEntities}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Entity"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingEntities ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !selectedEntity}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {searchResult && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Search Results: {getSearchTypeLabel(searchType)}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Click on any node to explore its one-hop neighbors
              </Alert>
            </Box>
          )}
        </Paper>

        {searchResult && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTreeIcon />
                Graph Visualization
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`${searchResult.nodes.length} Nodes`} color="primary" size="small" />
                <Chip label={`${searchResult.edges.length} Edges`} color="secondary" size="small" />
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Nodes
                    </Typography>
                    <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {searchResult.nodes.map((node) => (
                        <Card
                          key={node.id}
                          sx={{
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 },
                            borderLeft: `4px solid ${getNodeColor(node.type)}`
                          }}
                          onClick={() => handleNodeClick(node.id)}
                        >
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {node.name}
                              </Typography>
                              <Chip
                                label={node.type}
                                size="small"
                                sx={{
                                  backgroundColor: getNodeColor(node.type),
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                            {node.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                {node.description.length > 100
                                  ? `${node.description.substring(0, 100)}...`
                                  : node.description}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Relationships
                    </Typography>
                    <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {searchResult.edges.map((edge, index) => {
                        const fromNode = searchResult.nodes.find(n => n.id === edge.from)
                        const toNode = searchResult.nodes.find(n => n.id === edge.to)
                        return (
                          <Card key={index} sx={{ mb: 1 }}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={fromNode?.name || edge.from}
                                  size="small"
                                  sx={{ backgroundColor: getNodeColor(fromNode?.type || ''), color: 'white' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  →
                                </Typography>
                                <Chip label={edge.type} size="small" color="primary" variant="outlined" />
                                <Typography variant="body2" color="text.secondary">
                                  →
                                </Typography>
                                <Chip
                                  label={toNode?.name || edge.to}
                                  size="small"
                                  sx={{ backgroundColor: getNodeColor(toNode?.type || ''), color: 'white' }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Layout>
  )
}

export default SearchPage
