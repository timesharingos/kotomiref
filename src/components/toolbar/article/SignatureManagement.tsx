import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { toast } from 'react-toastify'
import SignatureDialog from './SignatureDialog'

interface Signature {
  id: string
  name: string
  authorId: string | null
  affiliationId: string | null
}

interface Author {
  id: string
  name: string
}

interface Affiliation {
  id: string
  name: string
}

interface SignatureManagementProps {
  referenceId: string
  articleName: string
  refNo: number
  onSignaturesChange?: () => void
}

function SignatureManagement({
  referenceId,
  articleName,
  refNo,
  onSignaturesChange
}: SignatureManagementProps) {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [affiliations, setAffiliations] = useState<Affiliation[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null)

  useEffect(() => {
    if (referenceId) {
      loadData()
    }
  }, [referenceId])

  const loadData = async () => {
    try {
      const [sigs, auths, affs] = await Promise.all([
        window.signature.getByReference(referenceId),
        window.author.getAll(),
        window.affiliation.getAll()
      ])
      setSignatures(sigs)
      setAuthors(auths)
      setAffiliations(affs)
    } catch (e) {
      console.error('Failed to load signature data:', e)
      toast.error('Failed to load signature data')
    }
  }

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedSignature(null)
    setDialogOpen(true)
  }

  const handleEdit = (signature: Signature) => {
    setDialogMode('edit')
    setSelectedSignature(signature)
    setDialogOpen(true)
  }

  const handleDelete = async (signature: Signature) => {
    if (!window.confirm(`Are you sure you want to delete signature "${signature.name}"?`)) {
      return
    }

    try {
      // First unlink from reference
      const unlinkResult = await window.signature.unlinkFromReference(referenceId, signature.id)
      if (!unlinkResult.success) {
        toast.error(`Failed to unlink signature: ${unlinkResult.error}`)
        return
      }

      // Then delete the signature
      const deleteResult = await window.signature.delete(signature.id)
      if (deleteResult.success) {
        toast.success('Signature deleted successfully')
        await loadData()
        onSignaturesChange?.()
      } else {
        toast.error(`Failed to delete signature: ${deleteResult.error}`)
      }
    } catch (e) {
      console.error('Failed to delete signature:', e)
      toast.error('An error occurred while deleting signature')
    }
  }

  const handleSave = async (data: Signature) => {
    try {
      // Save signature
      const saveResult = await window.signature.save({
        id: data.id,
        name: data.name,
        authorId: data.authorId,
        affiliationId: data.affiliationId
      })

      if (!saveResult.success) {
        toast.error(`Failed to save signature: ${saveResult.error}`)
        return
      }

      // If adding new signature, link it to reference
      if (dialogMode === 'add' && saveResult.id) {
        const linkResult = await window.signature.linkToReference(referenceId, saveResult.id)
        if (!linkResult.success) {
          toast.error(`Failed to link signature: ${linkResult.error}`)
          return
        }
      }

      toast.success(`Signature ${dialogMode === 'add' ? 'added' : 'updated'} successfully`)
      setDialogOpen(false)
      await loadData()
      onSignaturesChange?.()
    } catch (e) {
      console.error('Failed to save signature:', e)
      toast.error('An error occurred while saving signature')
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
  }

  const getAuthorName = (authorId: string | null) => {
    if (!authorId) return 'N/A'
    return authors.find(a => a.id === authorId)?.name || 'Unknown'
  }

  const getAffiliationName = (affiliationId: string | null) => {
    if (!affiliationId) return 'N/A'
    return affiliations.find(a => a.id === affiliationId)?.name || 'Unknown'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Signatures ({signatures.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="small"
        >
          Add Signature
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each signature represents an author affiliated with an institution for this reference.
      </Typography>

      {signatures.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No signatures added yet. Click "Add Signature" to add one.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>No.</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Affiliation</TableCell>
                <TableCell>Signature Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signatures.map((sig, index) => (
                <TableRow key={sig.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Chip label={getAuthorName(sig.authorId)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={getAffiliationName(sig.affiliationId)} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {sig.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(sig)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(sig)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <SignatureDialog
        open={dialogOpen}
        mode={dialogMode}
        signature={selectedSignature}
        articleName={articleName}
        refNo={refNo}
        currentSignatureCount={signatures.length}
        authors={authors}
        affiliations={affiliations}
        onClose={handleDialogClose}
        onSave={handleSave}
      />
    </Box>
  )
}

export default SignatureManagement

