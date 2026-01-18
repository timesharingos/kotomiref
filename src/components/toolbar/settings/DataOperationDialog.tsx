import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Box,
  Typography
} from '@mui/material'

interface DataOperationDialogProps {
  open: boolean
  operationName: string
  needsDirectory: boolean
  selectedDir: string
  operationMode: 'data' | 'all'
  confirmText: string
  onClose: () => void
  onSelectDirectory: () => void
  onOperationModeChange: (mode: 'data' | 'all') => void
  onConfirmTextChange: (text: string) => void
  onConfirm: () => void
}

function DataOperationDialog({
  open,
  operationName,
  needsDirectory,
  selectedDir,
  operationMode,
  confirmText,
  onClose,
  onSelectDirectory,
  onOperationModeChange,
  onConfirmTextChange,
  onConfirm
}: DataOperationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{operationName}</DialogTitle>
      <DialogContent>
        {needsDirectory && (
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
              <Button variant="outlined" onClick={onSelectDirectory}>
                Browse
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Operation Mode
          </Typography>
          <RadioGroup value={operationMode} onChange={(e) => onOperationModeChange(e.target.value as 'data' | 'all')}>
            <FormControlLabel value="data" control={<Radio />} label="Data Only (kotomiref.db)" />
            <FormControlLabel value="all" control={<Radio />} label="All (kotomiref.db + config.json)" />
          </RadioGroup>
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom color="error">
            To confirm, please type: <strong>{operationName}</strong>
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => onConfirmTextChange(e.target.value)}
            placeholder="Type operation name here"
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DataOperationDialog

