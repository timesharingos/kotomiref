import { useState } from 'react'
import { Button, Snackbar, Alert } from '@mui/material'
import SettingGroup from './SettingGroup'
import SettingEntry from './SettingEntry'
import DataOperationDialog from './DataOperationDialog'

type OperationType = 'backup' | 'restore' | 'reset' | null

function DangerousOperationsGroup() {
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
      setSnackbar({ 
        open: true, 
        message: 'Operation name does not match. Please type exactly: ' + expectedText, 
        severity: 'error' 
      })
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
        setSnackbar({ 
          open: true, 
          message: `${operationNames[currentOperation]} completed successfully`, 
          severity: 'success' 
        })
        handleCloseDialog()
      } else {
        setSnackbar({
          open: true,
          message: `${operationNames[currentOperation]} failed`,
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Operation error:', error)
      setSnackbar({ open: true, message: 'An error occurred', severity: 'error' })
    }
  }

  return (
    <>
      <SettingGroup title="Dangerous Operations" isDangerous showDivider={false}>
        <SettingEntry
          label="Data Backup"
          isDangerous
          action={
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('backup')}
              sx={{ '&:hover': { backgroundColor: 'error.main', color: 'white' } }}
            >
              Backup
            </Button>
          }
        />
        <SettingEntry
          label="Data Restore"
          isDangerous
          action={
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('restore')}
              sx={{ '&:hover': { backgroundColor: 'error.main', color: 'white' } }}
            >
              Restore
            </Button>
          }
        />
        <SettingEntry
          label="Data Reset"
          isDangerous
          action={
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('reset')}
              sx={{ '&:hover': { backgroundColor: 'error.main', color: 'white' } }}
            >
              Reset
            </Button>
          }
        />
      </SettingGroup>

      <DataOperationDialog
        open={dialogOpen}
        operationName={currentOperation ? operationNames[currentOperation] : ''}
        needsDirectory={currentOperation !== 'reset'}
        selectedDir={selectedDir}
        operationMode={operationMode}
        confirmText={confirmText}
        onClose={handleCloseDialog}
        onSelectDirectory={handleSelectDirectory}
        onOperationModeChange={setOperationMode}
        onConfirmTextChange={setConfirmText}
        onConfirm={handleConfirm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default DangerousOperationsGroup

