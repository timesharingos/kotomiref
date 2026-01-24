import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Autocomplete
} from '@mui/material'
import { toast } from 'react-toastify'

interface Author {
  id: string
  name: string
}

interface Affiliation {
  id: string
  name: string
}

interface Signature {
  id?: string
  name: string
  authorId: string | null
  affiliationId: string | null
}

interface SignatureDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  signature: Signature | null
  articleName: string
  refNo: number
  currentSignatureCount: number
  authors: Author[]
  affiliations: Affiliation[]
  onClose: () => void
  onSave: (data: Signature) => void
  onQuickAddAuthor?: () => void
  onQuickAddAffiliation?: () => void
}

function SignatureDialog({
  open,
  mode,
  signature,
  articleName,
  refNo,
  currentSignatureCount,
  authors,
  affiliations,
  onClose,
  onSave,
  onQuickAddAuthor,
  onQuickAddAffiliation
}: SignatureDialogProps) {
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [affiliationId, setAffiliationId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const authorSelectRef = useRef<HTMLInputElement>(null)

  // Generate signature name based on article name, ref number, and signature index
  const generateSignatureName = (authId: string | null, affId: string | null) => {
    const sigIndex = mode === 'add' ? currentSignatureCount + 1 : (signature?.name.split('-').pop() || '1')
    const authorName = authId ? authors.find(a => a.id === authId)?.name || 'Unknown' : 'Unknown'
    const affName = affId ? affiliations.find(a => a.id === affId)?.name || 'Unknown' : 'Unknown'
    return `${articleName}-Ref${refNo}-Sig${sigIndex} (${authorName} @ ${affName})`
  }

  // Initialize state from props
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && signature) {
        setAuthorId(signature.authorId)
        setAffiliationId(signature.affiliationId)
        setName(signature.name)
      } else {
        setAuthorId(null)
        setAffiliationId(null)
        setName(generateSignatureName(null, null))
      }
    }
  }, [open, mode, signature])

  // Update name when author or affiliation changes
  useEffect(() => {
    if (open && mode === 'add') {
      setName(generateSignatureName(authorId, affiliationId))
    }
  }, [authorId, affiliationId, open, mode])

  // Focus management
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        authorSelectRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = () => {
    if (!authorId) {
      toast.error('Please select an author')
      return
    }
    if (!affiliationId) {
      toast.error('Please select an affiliation')
      return
    }

    onSave({
      id: signature?.id,
      name: name.trim(),
      authorId,
      affiliationId
    })
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Signature' : 'Edit Signature'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            A signature represents an author affiliated with an institution for this reference.
          </Typography>

          {/* Author Selection */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Author *</Typography>
              {onQuickAddAuthor && (
                <Button size="small" onClick={onQuickAddAuthor}>
                  Quick Add
                </Button>
              )}
            </Box>
            <Autocomplete
              options={authors}
              getOptionLabel={(option) => option.name}
              value={authors.find(a => a.id === authorId) || null}
              onChange={(_event, newValue) => {
                setAuthorId(newValue?.id || null)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={authorSelectRef}
                  placeholder="Select an author"
                  required
                />
              )}
            />
          </Box>

          {/* Affiliation Selection */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Affiliation *</Typography>
              {onQuickAddAffiliation && (
                <Button size="small" onClick={onQuickAddAffiliation}>
                  Quick Add
                </Button>
              )}
            </Box>
            <Autocomplete
              options={affiliations}
              getOptionLabel={(option) => option.name}
              value={affiliations.find(a => a.id === affiliationId) || null}
              onChange={(_event, newValue) => {
                setAffiliationId(newValue?.id || null)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select an affiliation"
                  required
                />
              )}
            />
          </Box>

          {/* Signature Name (Auto-generated, Read-only) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Signature Name (Auto-generated)
            </Typography>
            <TextField
              fullWidth
              value={name}
              disabled
              helperText="Format: ArticleName-RefNo-SigNo (Author @ Affiliation)"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SignatureDialog

