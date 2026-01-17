import { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack
} from '@mui/material'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'

interface ConfigData {
  dbmode: string
  filemode: string
  filedir: string
  initialized: boolean
  stateVersion: string
  compatibleVersion: string
}

function ConfigPage() {
  const [dbmode, setDbmode] = useState('sqlite')
  const [filemode, setFilemode] = useState('readonly')
  const [filedir, setFiledir] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelectDirectory = async () => {
    try {
      const dir = await window.config.selectDirectory()
      if (dir) {
        setFiledir(dir)
      }
    } catch {
      setError('Failed to select directory')
    }
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)

    // Validation
    if (filemode !== 'readonly' && !filedir) {
      setError('Please select a file directory for copy/cut mode')
      setLoading(false)
      return
    }

    try {
      const config: ConfigData = {
        dbmode,
        filemode,
        filedir,
        initialized: true,
        stateVersion: '0.0.0',
        compatibleVersion: '0.0.0'
      }

      const success = await window.config.saveConfig(config)
      if (!success) {
        setError('Failed to save configuration')
      }
    } catch {
      setError('An error occurred while saving configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Initial Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Welcome to Kotomiref! Please configure your initial settings.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="dbmode-label">Database Mode</InputLabel>
            <Select
              labelId="dbmode-label"
              value={dbmode}
              label="Database Mode"
              onChange={(e) => setDbmode(e.target.value)}
            >
              <MenuItem value="sqlite">SQLite</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="filemode-label">File Mode</InputLabel>
            <Select
              labelId="filemode-label"
              value={filemode}
              label="File Mode"
              onChange={(e) => setFilemode(e.target.value)}
            >
              <MenuItem value="readonly">Read Only</MenuItem>
              <MenuItem value="copy">Copy</MenuItem>
              <MenuItem value="cut">Cut</MenuItem>
            </Select>
          </FormControl>

          {filemode !== 'readonly' && (
            <Box>
              <TextField
                fullWidth
                label="File Directory"
                value={filedir}
                slotProps={{
                  input: {
                    readOnly: true,
                  }
                }}
                placeholder="Select a directory"
              />
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={handleSelectDirectory}
                sx={{ mt: 1 }}
              >
                Select Directory
              </Button>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Database Mode:</strong> Currently only SQLite is supported.
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            <strong>File Mode:</strong>
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            • Read Only: Files remain in their original location
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            • Copy: Files are copied to the specified directory
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            • Cut: Files are moved to the specified directory
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ConfigPage

