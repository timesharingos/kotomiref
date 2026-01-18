import { useState } from 'react'
import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  Divider
} from '@mui/material'
import { useNavigate } from 'react-router'
import Layout from '../Layout'

type OperationType = 'backup' | 'restore' | 'reset' | null

function SettingPage() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<OperationType>(null)
  const [selectedDir, setSelectedDir] = useState('')
  const [operationMode, setOperationMode] = useState<'data' | 'all'>('data')
  const [confirmText, setConfirmText] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const operationNames = {
    backup: 'Data Backup',
    restore: 'Data Restore',
    reset: 'Data Reset'
  }

  const handleOpenDialog = (operation: OperationType) => {
    setCurrentOperation(operation)
    setSelectedDir('')
    setOperationMode('data')
    setConfirmText('')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setCurrentOperation(null)
  }

  const handleSelectDirectory = async () => {
    try {
      const dir = await window.data.selectDirectory()
      if (dir) {
        setSelectedDir(dir)
      }
    } catch (e) {
      console.error('Failed to select directory:', e)
    }
  }

  const handleConfirm = async () => {
    if (!currentOperation) return

    const expectedText = operationNames[currentOperation]
    if (confirmText !== expectedText) {
      setSnackbar({ open: true, message: 'Operation name does not match. Please type exactly: ' + expectedText, severity: 'error' })
      return
    }

    if (currentOperation !== 'reset' && !selectedDir) {
      setSnackbar({ open: true, message: 'Please select a directory', severity: 'error' })
      return
    }

    const includeConfig = operationMode === 'all'

    try {
      let success = false
      switch (currentOperation) {
        case 'backup':
          success = await window.data.backup(selectedDir, includeConfig)
          break
        case 'restore':
          success = await window.data.restore(selectedDir, includeConfig)
          break
        case 'reset':
          success = await window.data.reset(includeConfig)
          break
      }

      if (success) {
        setSnackbar({ open: true, message: `${operationNames[currentOperation]} completed successfully`, severity: 'success' })
        handleCloseDialog()
      } else {
        setSnackbar({ open: true, message: `${operationNames[currentOperation]} failed`, severity: 'error' })
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'An error occurred', severity: 'error' })
    }
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        {/* Database Configuration Group */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Database Configuration
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography>Database Configuration</Typography>
            <Button
              variant="text"
              onClick={() => navigate('/config')}
            >
              Configure
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'grey.700' }} />

        {/* Dangerous Operations Group */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main' }}>
            Dangerous Operations
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography sx={{ color: 'error.main' }}>Data Backup</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('backup')}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white'
                }
              }}
            >
              Backup
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography sx={{ color: 'error.main' }}>Data Restore</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('restore')}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white'
                }
              }}
            >
              Restore
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography sx={{ color: 'error.main' }}>Data Reset</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('reset')}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white'
                }
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>

        {/* Operation Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {currentOperation && operationNames[currentOperation]}
          </DialogTitle>
          <DialogContent>
            {currentOperation !== 'reset' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Select Directory
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={selectedDir}
                    slotProps={{ input: { readOnly: true } }}
                    placeholder="No directory selected"
                    size="small"
                  />
                  <Button variant="outlined" onClick={handleSelectDirectory}>
                    Browse
                  </Button>
                </Box>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Operation Mode
              </Typography>
              <RadioGroup value={operationMode} onChange={(e) => setOperationMode(e.target.value as 'data' | 'all')}>
                <FormControlLabel value="data" control={<Radio />} label="Data Only (kotomiref.db)" />
                <FormControlLabel value="all" control={<Radio />} label="All (kotomiref.db + config.json)" />
              </RadioGroup>
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom color="error">
                To confirm, please type: <strong>{currentOperation && operationNames[currentOperation]}</strong>
              </Typography>
              <TextField
                fullWidth
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type operation name here"
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleConfirm} color="error" variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  )
}

export default SettingPage
