import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'

interface ExportTemplate {
  id: number
  templateZh: string
  templateEn: string
}

// Fixed default template
const DEFAULT_TEMPLATES: ExportTemplate[] = [
  {
    id: 0,
    templateZh: '%a曾经提出，%c。',
    templateEn: '%a proposed that %c.'
  }
]

function ExportTemplateTab() {
  const [templates] = useState<ExportTemplate[]>(DEFAULT_TEMPLATES)

  const showComingSoon = () => {
    alert('敬请期待新版本！\nComing soon in future versions!')
  }

  return (
    <Box>
      {/* Toolbar */}
      <Toolbar sx={{ pl: 0, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={showComingSoon}
          disabled
        >
          <LockIcon sx={{ mr: 0.5, fontSize: 16 }} />
          Add
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={showComingSoon}
          disabled
        >
          <LockIcon sx={{ mr: 0.5, fontSize: 16 }} />
          Delete Selected
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" color="text.secondary">
          Template variables: %a (author), %c (content/claim)
        </Typography>
      </Toolbar>

      {/* Templates Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80}>ID</TableCell>
              <TableCell>Chinese Template</TableCell>
              <TableCell>English Template</TableCell>
              <TableCell align="right" width={120}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id} hover>
                <TableCell>
                  <Chip label={template.id} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {template.templateZh}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {template.templateEn}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={showComingSoon}
                    aria-label="edit (locked)"
                    disabled
                  >
                    <LockIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={showComingSoon}
                    aria-label="delete (locked)"
                    color="error"
                    disabled
                  >
                    <LockIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info Section */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          About Export Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Export templates are used to automatically generate "Related Work" sections 
          based on existing innovation points. Template editing will be available in 
          future versions.
        </Typography>
      </Box>
    </Box>
  )
}

export default ExportTemplateTab

