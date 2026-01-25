import { useState, useEffect } from 'react'
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
  Stack,
  IconButton,
  Snackbar
} from '@mui/material'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router'

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
  const [isEditMode, setIsEditMode] = useState(false)
  const [isReadonly, setIsReadonly] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if config already exists
    const loadConfig = async () => {
      try {
        const config = await window.config.getConfig()
        if (config && config.initialized) {
          setIsEditMode(true)
          setDbmode(config.dbmode)
          setFilemode(config.filemode)
          setFiledir(config.filedir)
          setIsReadonly(config.filemode === 'readonly')
        }
      } catch (e) {
        console.error('Failed to load config:', e)
      }
    }
    loadConfig()
  }, [])

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

      let success
      if (isEditMode) {
        // In edit mode, only update config file without reinitializing
        success = await window.config.updateConfig(config)
        if (success) {
          setSnackbarOpen(true)
        }
      } else {
        // In initial setup mode, save and initialize
        success = await window.config.saveConfig(config)
      }

      if (!success) {
        setError('Failed to save configuration')
      }
    } catch {
      setError('An error occurred while saving configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {isEditMode && (
            <IconButton onClick={handleBack} aria-label="back" sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {isEditMode ? 'Edit Configuration' : 'Initial Configuration'}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
          {isEditMode
            ? 'You can only modify the file directory in edit mode.'
            : 'Welcome to Kotomiref! Please configure your initial settings.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isReadonly && isEditMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            File mode is set to readonly. No changes can be made.
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 4 }}>
          <FormControl fullWidth disabled={isEditMode}>
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

          <FormControl fullWidth disabled={isEditMode}>
            <InputLabel id="filemode-label">File Mode</InputLabel>
            <Select
              labelId="filemode-label"
              value={filemode}
              label="File Mode"
              onChange={(e) => setFilemode(e.target.value)}
            >
              <MenuItem value="readonly">Read Only</MenuItem>
              <MenuItem value="copy" disabled>
                Copy (Coming Soon)
              </MenuItem>
              <MenuItem value="cut" disabled>
                Cut (Coming Soon)
              </MenuItem>
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
                disabled={isReadonly}
              />
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={handleSelectDirectory}
                sx={{ mt: 1 }}
                disabled={isReadonly}
              >
                Select Directory
              </Button>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={loading || isReadonly}
            fullWidth
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Stack>

        {!isEditMode && (
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
              • Read Only: Files remain in their original location (Recommended)
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              • Copy: Files are copied to the specified directory (Coming Soon)
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              • Cut: Files are moved to the specified directory (Coming Soon)
            </Typography>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message="Configuration updated successfully. Changes will take effect on next restart."
      />
    </Container>
  )
}

export default ConfigPage

