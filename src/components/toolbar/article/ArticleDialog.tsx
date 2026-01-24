import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
  Chip,
  Typography,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import SignatureDialog from './SignatureDialog'
import QuickAddAuthorDialog from './QuickAddAuthorDialog'
import QuickAddAffiliationDialog from './QuickAddAffiliationDialog'
import QuickAddContributionDialog from './QuickAddContributionDialog'
import QuickAddImprovementDialog from './QuickAddImprovementDialog'
import QuickAddAlgoDialog from './QuickAddAlgoDialog'
import QuickAddObjectDialog from './QuickAddObjectDialog'
import QuickAddDefinitionDialog from './QuickAddDefinitionDialog'
import QuickAddDomainDialog from './QuickAddDomainDialog'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Type definitions
interface Signature {
  id?: string
  authorId: string
  affiliationId: string
  name: string
  sigNo: number
}

interface Reference {
  id?: string
  refNo: number
  refIndex: string
  refTitle: string
  refYear: number | null
  refPublication: string
  refVolume: number | null
  refIssue: number | null
  refStartPage: number | null
  refEndPage: number | null
  refDoi: string
  refAbs: string
  refUrl?: string
  signatures: Signature[]
}

interface EntityType {
  id: string
  name: string
  type: string
  typeName: string
  description?: string
  subjectId?: string
  mainDomainId?: string | null
  metric?: string
  metricResultString?: string
  metricResultNumber?: number
  aliasIds?: string[]
  parentIds?: string[]
  originIds?: string[]
  advanceIds?: string[]
  targetIds?: string[]
  expectationIds?: string[]
  transformationIds?: string[]
  problemIds?: string[]
  // Contribution-specific fields
  improvementIds?: string[]
  algoIds?: string[]
  objectIds?: string[]
  solutionToId?: string
}

interface Author {
  id: string
  name: string
}

interface Affiliation {
  id: string
  name: string
}

interface MainDomain {
  id: string
  name: string
}

interface SubDomain {
  id: string
  name: string
  mainDomainId: string | null
}

interface ArticleData {
  id: string
  artTitle: string
  artPath: string
  artPrimaryRefEntry: number | null
  file: File | null
  references: Reference[]
  entityTags: (EntityType | string)[]
  contributions: (EntityType | string)[]
}

interface ArticleDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  article: ArticleData | null
  onClose: () => void
  onSave: (data: ArticleData) => void
}

const steps = ['Basic Info & Upload', 'References', 'Entity Tags', 'Contributions', 'Preview & Confirm']

const ArticleDialog = ({ open, mode, article, onClose, onSave }: ArticleDialogProps) => {
  const [activeStep, setActiveStep] = useState(0)

  const [formData, setFormData] = useState<ArticleData>({
    id: '',
    artTitle: '',
    artPath: '',
    artPrimaryRefEntry: null,
    file: null,
    references: [],
    entityTags: [],
    contributions: []
  })

  // Current reference being edited
  const [currentReference, setCurrentReference] = useState<Reference>({
    refNo: 0,
    refIndex: '',
    refTitle: '',
    refYear: null,
    refPublication: '',
    refVolume: null,
    refIssue: null,
    refStartPage: null,
    refEndPage: null,
    refDoi: '',
    refAbs: '',
    signatures: []
  })

  const [allEntities, setAllEntities] = useState<EntityType[]>([])
  const [mainDomains, setMainDomains] = useState<MainDomain[]>([])
  const [subDomains, setSubDomains] = useState<SubDomain[]>([])
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false)
  const [textContent, setTextContent] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Signature management states
  const [authors, setAuthors] = useState<Author[]>([])
  const [affiliations, setAffiliations] = useState<Affiliation[]>([])
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [signatureDialogMode, setSignatureDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedSignatureIndex, setSelectedSignatureIndex] = useState<number | null>(null)

  // Quick add dialogs
  const [quickAddAuthorDialogOpen, setQuickAddAuthorDialogOpen] = useState(false)
  const [quickAddAffiliationDialogOpen, setQuickAddAffiliationDialogOpen] = useState(false)
  const [quickAddContributionDialogOpen, setQuickAddContributionDialogOpen] = useState(false)
  const [quickAddImprovementDialogOpen, setQuickAddImprovementDialogOpen] = useState(false)
  const [quickAddAlgoDialogOpen, setQuickAddAlgoDialogOpen] = useState(false)
  const [quickAddObjectDialogOpen, setQuickAddObjectDialogOpen] = useState(false)
  const [quickAddDefinitionDialogOpen, setQuickAddDefinitionDialogOpen] = useState(false)
  const [quickAddDomainDialogOpen, setQuickAddDomainDialogOpen] = useState(false)

  // Detailed entities for preview step
  const [detailedEntities, setDetailedEntities] = useState<Record<string, EntityType>>({})

  // Load data function
  const loadData = async () => {
    try {
      // Load all entities for tagging
      const entitiesResult = await window.entity.getAll()
      setAllEntities(entitiesResult)

      // Load authors and affiliations for signature management
      const [authorsResult, affiliationsResult, mainDomainsResult, subDomainsResult] = await Promise.all([
        window.author.getAll(),
        window.affiliation.getAll(),
        window.domain.getAllMain(),
        window.domain.getAllSub()
      ])
      setAuthors(authorsResult)
      setAffiliations(affiliationsResult)
      setMainDomains(mainDomainsResult)
      setSubDomains(subDomainsResult)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }

  // Load file preview from path
  const loadFilePreview = async (filePath: string) => {
    try {
      if (!filePath) return

      setPdfPreviewLoading(true)

      // Get file extension
      const ext = filePath.toLowerCase().split('.').pop()

      if (ext === 'pdf') {
        // Load PDF preview
        const fileBuffer = await window.electron.readFile(filePath)
        const arrayBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength
        )

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

        // Get first page
        const page = await pdf.getPage(1)

        // Set canvas size
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = canvasRef.current

        if (canvas) {
          canvas.width = viewport.width
          canvas.height = viewport.height

          const context = canvas.getContext('2d')
          if (context) {
            // Render PDF page
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await page.render(renderContext as any).promise

            // Convert canvas to data URL for preview
            const dataUrl = canvas.toDataURL()
            setFilePreview(dataUrl)
          }
        }
      } else if (ext === 'docx' || ext === 'doc') {
        // Load Word document preview
        const fileBuffer = await window.electron.readFile(filePath)
        const arrayBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength
        )

        // Convert Word document to HTML
        const result = await mammoth.convertToHtml({
          arrayBuffer: arrayBuffer
        } as { arrayBuffer: ArrayBuffer })

        // Store HTML content and set preview type
        setTextContent(result.value)
        setFilePreview('word-preview')
      } else if (ext === 'txt') {
        // Load text file preview
        const fileBuffer = await window.electron.readFile(filePath)
        const text = new TextDecoder().decode(fileBuffer)
        setTextContent(text)
        setFilePreview('text-preview')
      } else if (ext === 'md') {
        // Load Markdown file preview
        const fileBuffer = await window.electron.readFile(filePath)
        const text = new TextDecoder().decode(fileBuffer)
        setTextContent(text)
        setFilePreview('markdown-preview')
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
        // Load image preview
        const fileBuffer = await window.electron.readFile(filePath)

        // Determine MIME type
        let mimeType = 'image/jpeg'
        if (ext === 'png') mimeType = 'image/png'
        else if (ext === 'gif') mimeType = 'image/gif'
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'

        // Create blob with correct MIME type
        const blob = new Blob([fileBuffer], { type: mimeType })
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
          setPdfPreviewLoading(false)
        }
        reader.readAsDataURL(blob)
        return // Don't set loading to false here, reader.onload will do it
      } else {
        // For other file types, just show the path
        setFilePreview(filePath)
      }

      setPdfPreviewLoading(false)
    } catch (e) {
      console.error('Failed to load file preview:', e)
      setFilePreview('preview-error')
      setPdfPreviewLoading(false)
    }
  }

  // Initialize form data when dialog opens
  useEffect(() => {
    if (!open) return

    const initializeData = async () => {
      await loadData()

      // Initialize form data
      const initialFormData = mode === 'edit' && article ? {
        id: article.id,
        artTitle: article.artTitle || '',
        artPath: article.artPath || '',
        artPrimaryRefEntry: article.artPrimaryRefEntry || null,
        file: null,
        references: article.references || [],
        entityTags: article.entityTags || [],
        contributions: article.contributions || []
      } : {
        id: '',
        artTitle: '',
        artPath: '',
        artPrimaryRefEntry: null,
        file: null,
        references: [],
        entityTags: [],
        contributions: []
      }

      setFormData(initialFormData)
      setActiveStep(0)
      setFilePreview(null)

      // Load file preview if artPath exists
      if (mode === 'edit' && article?.artPath) {
        loadFilePreview(article.artPath)
      }
    }

    initializeData()
  }, [open, mode, article])

  // Load detailed entity information for preview step
  useEffect(() => {
    const loadDetailedEntities = async () => {
      if (activeStep !== 4 || formData.contributions.length === 0) {
        return
      }

      const entityIds = new Set<string>()

      // Collect all entity IDs from contributions
      formData.contributions.forEach((contrib) => {
        if (typeof contrib === 'string') return
        if (contrib.improvementIds) contrib.improvementIds.forEach((id: string) => entityIds.add(id))
        if (contrib.algoIds) contrib.algoIds.forEach((id: string) => entityIds.add(id))
        if (contrib.objectIds) contrib.objectIds.forEach((id: string) => entityIds.add(id))
        if (contrib.solutionToId) entityIds.add(contrib.solutionToId)
      })

      // Fetch detailed information for each entity
      const detailedData: Record<string, EntityType> = {}

      for (const id of entityIds) {
        const entity = allEntities.find(e => e.id === id)
        if (entity && entity.type) {
          try {
            // Fetch full entity details based on type
            const entities = await window.entity.getAllByType(entity.type)
            const fullEntity = entities.find(e => e.id === id)
            if (fullEntity) {
              // Convert EntityItem to EntityType
              detailedData[id] = {
                id: fullEntity.id,
                name: fullEntity.name || '',
                type: entity.type,
                typeName: entity.typeName,
                description: fullEntity.description,
                subjectId: fullEntity.subjectId,
                aliasIds: fullEntity.aliasIds,
                parentIds: fullEntity.parentIds,
                improvementIds: fullEntity.improvementIds,
                algoIds: fullEntity.algoIds,
                objectIds: fullEntity.objectIds,
                solutionToId: fullEntity.solutionToId
              }
            }
          } catch (error) {
            console.error(`Failed to fetch details for entity ${id}:`, error)
          }
        }
      }

      setDetailedEntities(detailedData)
    }

    loadDetailedEntities()
  }, [activeStep, formData.contributions, allEntities])

  // File upload handler using Electron dialog
  const handleFileUpload = async () => {
    try {
      // Use Electron dialog to select file and get absolute path
      const absolutePath = await window.electron.selectFile()

      if (!absolutePath) {
        // User cancelled
        return
      }

      console.log('File selected with absolute path:', absolutePath)

      // Extract file name from path
      const fileName = absolutePath.split(/[\\/]/).pop() || ''
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

      // Validate file type
      const validExtensions = ['.md', '.txt', '.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.gif']
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Invalid file type. Supported formats: md, txt, doc(x), pdf, and images (jpg, png, gif)')
        return
      }

      // Clear previous preview state
      setFilePreview(null)
      setTextContent('')
      setPdfPreviewLoading(true)

      // Store absolute path (no File object needed)
      setFormData({ ...formData, file: null, artPath: absolutePath })

      // Generate preview based on file type
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        // Image preview - read file and convert to data URL
        try {
          const fileBuffer = await window.electron.readFile(absolutePath)

          // Determine MIME type based on extension
          let mimeType = 'image/jpeg'
          if (fileExtension === '.png') mimeType = 'image/png'
          else if (fileExtension === '.gif') mimeType = 'image/gif'
          else if (['.jpg', '.jpeg'].includes(fileExtension)) mimeType = 'image/jpeg'

          // Create blob with correct MIME type
          const blob = new Blob([fileBuffer], { type: mimeType })
          const reader = new FileReader()
          reader.onload = (e) => {
            setFilePreview(e.target?.result as string)
          }
          reader.readAsDataURL(blob)
        } catch (e) {
          console.error('Failed to load image preview:', e)
          toast.error('Failed to load image preview')
        }
      } else if (fileExtension === '.pdf') {
        // Render PDF first page from absolute path
        await loadFilePreview(absolutePath)
      } else if (fileExtension === '.txt') {
        // Render text file from absolute path
        try {
          const fileBuffer = await window.electron.readFile(absolutePath)
          const text = new TextDecoder().decode(fileBuffer)
          setTextContent(text)
          setFilePreview('text-preview')
          setPdfPreviewLoading(false)
        } catch (e) {
          console.error('Failed to load text preview:', e)
          toast.error('Failed to load text preview')
          setPdfPreviewLoading(false)
        }
      } else if (fileExtension === '.md') {
        // Render Markdown file from absolute path
        try {
          const fileBuffer = await window.electron.readFile(absolutePath)
          const text = new TextDecoder().decode(fileBuffer)
          setTextContent(text)
          setFilePreview('markdown-preview')
          setPdfPreviewLoading(false)
        } catch (e) {
          console.error('Failed to load markdown preview:', e)
          toast.error('Failed to load markdown preview')
          setPdfPreviewLoading(false)
        }
      } else if (['.doc', '.docx'].includes(fileExtension)) {
        // Render Word document from absolute path
        await loadFilePreview(absolutePath)
      }
    } catch (error) {
      console.error('Failed to select file:', error)
      toast.error('Failed to select file')
    }
  }

  // Reference handlers
  const handleAddReference = () => {
    // Validate required fields
    if (!currentReference.refPublication.trim()) {
      toast.error('Publication is required')
      return
    }
    if (!currentReference.refAbs.trim()) {
      toast.error('Abstract is required')
      return
    }
    if (currentReference.refEndPage === null) {
      toast.error('End page is required')
      return
    }

    // Validate positive integers
    if (currentReference.refYear !== null && (currentReference.refYear <= 0 || !Number.isInteger(currentReference.refYear))) {
      toast.error('Year must be a positive integer')
      return
    }
    if (currentReference.refVolume !== null && (currentReference.refVolume <= 0 || !Number.isInteger(currentReference.refVolume))) {
      toast.error('Volume must be a positive integer')
      return
    }
    if (currentReference.refIssue !== null && (currentReference.refIssue <= 0 || !Number.isInteger(currentReference.refIssue))) {
      toast.error('Issue must be a positive integer')
      return
    }
    if (currentReference.refStartPage !== null && (currentReference.refStartPage <= 0 || !Number.isInteger(currentReference.refStartPage))) {
      toast.error('Start page must be a positive integer')
      return
    }
    if (currentReference.refEndPage <= 0 || !Number.isInteger(currentReference.refEndPage)) {
      toast.error('End page must be a positive integer')
      return
    }

    // Set default startPage to 1 if not provided
    const startPage = currentReference.refStartPage || 1

    // Validate endPage >= startPage
    if (currentReference.refEndPage < startPage) {
      toast.error('End page must be greater than or equal to start page')
      return
    }

    // Set default title to article title if not provided
    const refTitle = currentReference.refTitle.trim() || formData.artTitle

    // Add reference to list
    const newReference = {
      ...currentReference,
      refNo: formData.references.length,
      refStartPage: startPage,
      refTitle: refTitle
    }

    const updatedReferences = [...formData.references, newReference]

    // Auto-set primary if this is the first reference
    const updatedPrimary = updatedReferences.length === 1 ? 0 : formData.artPrimaryRefEntry

    setFormData({
      ...formData,
      references: updatedReferences,
      artPrimaryRefEntry: updatedPrimary
    })

    // Reset current reference
    setCurrentReference({
      refNo: 0,
      refIndex: '',
      refTitle: '',
      refYear: null,
      refPublication: '',
      refVolume: null,
      refIssue: null,
      refStartPage: null,
      refEndPage: null,
      refDoi: '',
      refAbs: '',
      signatures: []
    })

    toast.success('Reference added successfully')
  }

  const handleRemoveReference = (refNo: number) => {
    const updatedReferences = formData.references
      .filter(ref => ref.refNo !== refNo)
      .map((ref, index) => ({ ...ref, refNo: index })) // Re-number references

    // Update primary if needed
    let updatedPrimary = formData.artPrimaryRefEntry
    if (updatedReferences.length === 0) {
      updatedPrimary = null
    } else if (updatedReferences.length === 1) {
      updatedPrimary = 0
    } else if (formData.artPrimaryRefEntry === refNo) {
      updatedPrimary = 0 // Reset to first if primary was removed
    } else if (formData.artPrimaryRefEntry !== null && formData.artPrimaryRefEntry > refNo) {
      updatedPrimary = formData.artPrimaryRefEntry - 1 // Adjust if after removed
    }

    setFormData({
      ...formData,
      references: updatedReferences,
      artPrimaryRefEntry: updatedPrimary
    })
  }

  // Signature management functions
  const handleAddSignature = () => {
    setSignatureDialogMode('add')
    setSelectedSignatureIndex(null)
    setSignatureDialogOpen(true)
  }

  const handleEditSignature = (index: number) => {
    setSignatureDialogMode('edit')
    setSelectedSignatureIndex(index)
    setSignatureDialogOpen(true)
  }

  const handleDeleteSignature = (index: number) => {
    const updatedSignatures = currentReference.signatures.filter((_, i) => i !== index)
    setCurrentReference({
      ...currentReference,
      signatures: updatedSignatures
    })
  }

  const handleSaveSignature = async (data: Signature) => {
    if (signatureDialogMode === 'add') {
      setCurrentReference({
        ...currentReference,
        signatures: [...currentReference.signatures, data]
      })
    } else if (signatureDialogMode === 'edit' && selectedSignatureIndex !== null) {
      const updatedSignatures = [...currentReference.signatures]
      updatedSignatures[selectedSignatureIndex] = data
      setCurrentReference({
        ...currentReference,
        signatures: updatedSignatures
      })
    }
    setSignatureDialogOpen(false)
  }

  // Quick add handlers
  const handleQuickAddAuthor = () => {
    setQuickAddAuthorDialogOpen(true)
  }

  const handleQuickAddAffiliation = () => {
    setQuickAddAffiliationDialogOpen(true)
  }

  const handleSaveQuickAuthor = async (name: string, affiliationIds: string[]) => {
    try {
      const result = await window.author.add({ name, affiliations: affiliationIds })
      if (result.success && result.id) {
        setQuickAddAuthorDialogOpen(false)
        toast.success('Author added successfully')
        // Reload authors to get the complete data
        const authorsResult = await window.author.getAll()
        setAuthors(authorsResult)
      } else {
        toast.error(result.error || 'Failed to add author')
      }
    } catch (error) {
      console.error('Failed to add author:', error)
      toast.error('Failed to add author')
    }
  }

  const handleSaveQuickAffiliation = async (name: string, parentId: string | null) => {
    try {
      const result = await window.affiliation.add({ name, parentId })
      if (result.success && result.id) {
        setQuickAddAffiliationDialogOpen(false)
        toast.success('Affiliation added successfully')
        // Reload affiliations to get the complete data
        const affiliationsResult = await window.affiliation.getAll()
        setAffiliations(affiliationsResult)
      } else {
        toast.error(result.error || 'Failed to add affiliation')
      }
    } catch (error) {
      console.error('Failed to add affiliation:', error)
      toast.error('Failed to add affiliation')
    }
  }

  // Quick add entity handlers
  const handleSaveQuickImprovement = async (data: {
    name: string
    description: string
    subjectId: string
    metric: string
    metricResultString: string
    metricResultNumber: number | null
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    originIds: string[]
    advanceIds: string[]
  }) => {
    try {
      const result = await window.entity.addImprovement({
        name: data.name,
        description: data.description,
        subjectId: data.subjectId,
        metric: data.metric,
        metricResultString: data.metricResultString,
        metricResultNumber: data.metricResultNumber || undefined,
        aliasIds: data.aliasIds,
        parentIds: data.parentIds,
        relationIds: data.relationIds,
        originIds: data.originIds,
        advanceIds: data.advanceIds
      })
      if (result.success) {
        setQuickAddImprovementDialogOpen(false)
        toast.success('Improvement added successfully')
        // Reload entities
        const entitiesResult = await window.entity.getAll()
        setAllEntities(entitiesResult)
      } else {
        toast.error(result.error || 'Failed to add improvement')
      }
    } catch (error) {
      console.error('Failed to add improvement:', error)
      toast.error('Failed to add improvement')
    }
  }

  const handleSaveQuickAlgo = async (data: {
    name: string
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    targetIds: string[]
    expectationIds: string[]
    transformationIds: string[]
  }) => {
    try {
      const result = await window.entity.addAlgo({
        name: data.name,
        description: data.description,
        subjectId: data.subjectId,
        aliasIds: data.aliasIds,
        parentIds: data.parentIds,
        relationIds: data.relationIds,
        targetIds: data.targetIds,
        expectationIds: data.expectationIds,
        transformationIds: data.transformationIds
      })
      if (result.success) {
        setQuickAddAlgoDialogOpen(false)
        toast.success('Algorithm added successfully')
        // Reload entities
        const entitiesResult = await window.entity.getAll()
        setAllEntities(entitiesResult)
      } else {
        toast.error(result.error || 'Failed to add algorithm')
      }
    } catch (error) {
      console.error('Failed to add algorithm:', error)
      toast.error('Failed to add algorithm')
    }
  }

  const handleSaveQuickObject = async (data: {
    name: string
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
  }) => {
    try {
      const result = await window.entity.addObject({
        name: data.name,
        description: data.description,
        subjectId: data.subjectId,
        aliasIds: data.aliasIds,
        parentIds: data.parentIds,
        relationIds: data.relationIds
      })
      if (result.success) {
        setQuickAddObjectDialogOpen(false)
        toast.success('Research object added successfully')
        // Reload entities
        const entitiesResult = await window.entity.getAll()
        setAllEntities(entitiesResult)
      } else {
        toast.error(result.error || 'Failed to add research object')
      }
    } catch (error) {
      console.error('Failed to add research object:', error)
      toast.error('Failed to add research object')
    }
  }

  const handleSaveQuickDefinition = async (data: {
    name: string
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    refineIds: string[]
    scenarioIds: string[]
    evoIds: string[]
  }) => {
    try {
      const result = await window.entity.addDefinition({
        name: data.name,
        description: data.description,
        subjectId: data.subjectId,
        aliasIds: data.aliasIds,
        parentIds: data.parentIds,
        relationIds: data.relationIds,
        refineIds: data.refineIds,
        scenarioIds: data.scenarioIds,
        evoIds: data.evoIds
      })
      if (result.success) {
        setQuickAddDefinitionDialogOpen(false)
        toast.success('Definition added successfully')
        // Reload entities
        const entitiesResult = await window.entity.getAll()
        setAllEntities(entitiesResult)
      } else {
        toast.error(result.error || 'Failed to add definition')
      }
    } catch (error) {
      console.error('Failed to add definition:', error)
      toast.error('Failed to add definition')
    }
  }

  const handleSaveQuickDomain = async (data: {
    name: string
    description: string
    type: 'main' | 'sub'
    mainDomainId?: string
  }) => {
    try {
      if (data.type === 'main') {
        const result = await window.domain.addMain({
          name: data.name,
          desc: data.description
        })
        if (result.success) {
          setQuickAddDomainDialogOpen(false)
          toast.success('Main domain added successfully')
          // Reload domains
          const [mainDomainsResult, subDomainsResult] = await Promise.all([
            window.domain.getAllMain(),
            window.domain.getAllSub()
          ])
          setMainDomains(mainDomainsResult)
          setSubDomains(subDomainsResult)
        } else {
          toast.error(result.error || 'Failed to add main domain')
        }
      } else {
        const result = await window.domain.addSub({
          name: data.name,
          desc: data.description,
          mainDomainId: data.mainDomainId!
        })
        if (result.success) {
          setQuickAddDomainDialogOpen(false)
          toast.success('Sub domain added successfully')
          // Reload domains
          const [mainDomainsResult, subDomainsResult] = await Promise.all([
            window.domain.getAllMain(),
            window.domain.getAllSub()
          ])
          setMainDomains(mainDomainsResult)
          setSubDomains(subDomainsResult)
        } else {
          toast.error(result.error || 'Failed to add sub domain')
        }
      }
    } catch (error) {
      console.error('Failed to add domain:', error)
      toast.error('Failed to add domain')
    }
  }

  const handleSaveQuickContribution = async (data: {
    description: string
    subjectId: string
    aliasIds: string[]
    parentIds: string[]
    relationIds: string[]
    improvementIds: string[]
    algoIds: string[]
    objectIds: string[]
    solutionToId: string
  }) => {
    try {
      const result = await window.entity.addContribution({
        description: data.description,
        subjectId: data.subjectId,
        aliasIds: data.aliasIds,
        parentIds: data.parentIds,
        relationIds: data.relationIds,
        improvementIds: data.improvementIds,
        algoIds: data.algoIds,
        objectIds: data.objectIds,
        solutionToId: data.solutionToId
      })
      if (result.success && result.id) {
        setQuickAddContributionDialogOpen(false)
        toast.success('Contribution added successfully')
        // Add to contributions list
        const newContribution: EntityType = {
          id: result.id,
          name: data.description, // Use description as name
          type: 'contrib',
          typeName: 'Contribution',
          description: data.description,
          subjectId: data.subjectId,
          aliasIds: data.aliasIds,
          parentIds: data.parentIds,
          improvementIds: data.improvementIds,
          algoIds: data.algoIds,
          objectIds: data.objectIds,
          solutionToId: data.solutionToId
        }
        setFormData({
          ...formData,
          contributions: [...formData.contributions, newContribution]
        })
        // Reload entities
        const entitiesResult = await window.entity.getAll()
        setAllEntities(entitiesResult)
      } else {
        toast.error(result.error || 'Failed to add contribution')
      }
    } catch (error) {
      console.error('Failed to add contribution:', error)
      toast.error('Failed to add contribution')
    }
  }

  const handleSetPrimary = (refNo: number) => {
    setFormData({
      ...formData,
      artPrimaryRefEntry: refNo
    })
  }

  // Step navigation
  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      // Validate basic info: only title and file are required
      if (!formData.artTitle.trim()) {
        toast.error('Article title is required')
        return
      }
      if (!formData.file && !formData.artPath) {
        toast.error('Please upload an article file')
        return
      }
    }

    if (activeStep === 1) {
      // Validate references: at least one reference is required
      if (formData.references.length === 0) {
        toast.error('At least one reference is required')
        return
      }
    }

    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleSave = async () => {
    try {
      // Prepare article data for saving
      const articleData = {
        id: formData.id,
        artTitle: formData.artTitle,
        artPath: formData.artPath,
        artPrimaryRefEntry: formData.artPrimaryRefEntry,
        file: formData.file,
        references: formData.references as never[],
        entityTags: formData.entityTags.map((tag) =>
          typeof tag === 'string' ? tag : tag.id
        ),
        contributions: formData.contributions.map((contrib) =>
          typeof contrib === 'string' ? contrib : contrib.id
        )
      }

      let result
      if (mode === 'add') {
        // Add new article
        result = await window.article.add(articleData as never)
      } else {
        // Update existing article
        result = await window.article.update(articleData as never)
      }

      if (result.success) {
        toast.success(mode === 'add' ? 'Article added successfully' : 'Article updated successfully')
        onSave(formData)
        onClose()
      } else {
        toast.error(result.error || 'Failed to save article')
      }
    } catch (error) {
      console.error('Failed to save article:', error)
      toast.error('Failed to save article')
    }
  }

  // Step 1: Basic Info & File Upload
  const renderBasicInfoStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Article Title */}
        <TextField
          label="Article Title"
          value={formData.artTitle}
          onChange={(e) => setFormData({ ...formData, artTitle: e.target.value })}
          fullWidth
          required
          multiline
          rows={2}
          placeholder="Enter the article title"
        />

        <Divider />

        {/* File Upload */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Upload Article File *
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Supported formats: Markdown (.md), Text (.txt), Word (.doc, .docx), PDF (.pdf), Images (.jpg, .png, .gif)
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mb: 2 }}
            onClick={handleFileUpload}
          >
            {formData.artPath ? formData.artPath.split(/[\\/]/).pop() : 'Choose File'}
          </Button>

          {formData.artPath && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Selected: {formData.artPath}
            </Typography>
          )}

          {/* Loading Indicator */}
          {pdfPreviewLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Loading preview...
              </Typography>
            </Box>
          )}

          {/* File Preview */}
          {filePreview && !pdfPreviewLoading && (
            <Paper sx={{ p: 2, bgcolor: 'background.paper', mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                File Preview
              </Typography>
              {filePreview.startsWith('data:image') ? (
                // Image preview (including PDF rendered as image)
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img
                    src={filePreview}
                    alt="Article preview"
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                </Box>
              ) : filePreview === 'pdf-preview-error' ? (
                // PDF preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load PDF preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : filePreview === 'text-preview' ? (
                // Text file preview (txt, md)
                <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #ddd', borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="caption" sx={{ color: '#666' }} gutterBottom>
                    📝 Text Content:
                  </Typography>
                  <Box sx={{
                    mt: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#000000'
                  }}>
                    {textContent.length > 0 ? (
                      <>
                        {textContent.substring(0, 2000)}
                        {textContent.length > 2000 && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 2, fontStyle: 'italic', color: '#666' }}>
                            ... (showing first 2000 characters of {textContent.length} total)
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666' }}>
                        (Empty file)
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : filePreview === 'text-preview-error' ? (
                // Text preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load text preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : filePreview === 'markdown-preview' ? (
                // Markdown file preview
                <Box sx={{
                  p: 3,
                  bgcolor: '#ffffff',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  '& h1': {
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginTop: '1.5rem',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                    color: '#1a1a1a',
                    borderBottom: '2px solid #e0e0e0',
                    paddingBottom: '0.5rem'
                  },
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginTop: '1.25rem',
                    marginBottom: '0.75rem',
                    lineHeight: 1.3,
                    color: '#2a2a2a',
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.3rem'
                  },
                  '& h3': {
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginTop: '1rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#3a3a3a'
                  },
                  '& h4, & h5, & h6': {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginTop: '0.75rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#4a4a4a'
                  },
                  '& p': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.75rem',
                    color: '#333'
                  },
                  '& ul, & ol': {
                    marginLeft: '1.5rem',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.5rem'
                  },
                  '& li': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.25rem',
                    color: '#333'
                  },
                  '& strong': {
                    fontWeight: 'bold',
                    color: '#1a1a1a'
                  },
                  '& em': {
                    fontStyle: 'italic'
                  },
                  '& a': {
                    color: '#1976d2',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#1565c0'
                    }
                  },
                  '& code': {
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    color: '#d63384'
                  },
                  '& pre': {
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    marginBottom: '1rem',
                    border: '1px solid #e0e0e0'
                  },
                  '& pre code': {
                    backgroundColor: 'transparent',
                    padding: 0,
                    color: '#333'
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #1976d2',
                    paddingLeft: '1rem',
                    marginLeft: '0',
                    marginBottom: '1rem',
                    color: '#666',
                    fontStyle: 'italic',
                    backgroundColor: '#f8f9fa'
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '1rem',
                    border: '1px solid #ddd'
                  },
                  '& th, & td': {
                    border: '1px solid #ddd',
                    padding: '8px 12px',
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '1rem 0',
                    borderRadius: '4px'
                  },
                  '& hr': {
                    border: 'none',
                    borderTop: '2px solid #e0e0e0',
                    margin: '1.5rem 0'
                  }
                }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                    📝 Markdown Content:
                  </Typography>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {textContent}
                  </ReactMarkdown>
                </Box>
              ) : filePreview === 'markdown-preview-error' ? (
                // Markdown preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load Markdown preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : filePreview === 'word-preview' ? (
                // Word document preview
                <Box sx={{
                  p: 3,
                  bgcolor: '#ffffff',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  '& h1': {
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginTop: '1.5rem',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                    color: '#1a1a1a'
                  },
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginTop: '1.25rem',
                    marginBottom: '0.75rem',
                    lineHeight: 1.3,
                    color: '#2a2a2a'
                  },
                  '& h3': {
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginTop: '1rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#3a3a3a'
                  },
                  '& h4, & h5, & h6': {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginTop: '0.75rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                    color: '#4a4a4a'
                  },
                  '& p': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.75rem',
                    color: '#333',
                    textAlign: 'justify'
                  },
                  '& ul, & ol': {
                    marginLeft: '1.5rem',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.5rem'
                  },
                  '& li': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: '0.25rem',
                    color: '#333'
                  },
                  '& strong': {
                    fontWeight: 'bold',
                    color: '#1a1a1a'
                  },
                  '& em': {
                    fontStyle: 'italic'
                  },
                  '& a': {
                    color: '#1976d2',
                    textDecoration: 'underline'
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '1rem',
                    border: '1px solid #ddd'
                  },
                  '& th, & td': {
                    border: '1px solid #ddd',
                    padding: '8px 12px',
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #ddd',
                    paddingLeft: '1rem',
                    marginLeft: '0',
                    marginBottom: '1rem',
                    color: '#666',
                    fontStyle: 'italic'
                  },
                  '& code': {
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  },
                  '& pre': {
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    marginBottom: '1rem'
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '1rem 0'
                  }
                }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                    📄 Word Document Content:
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{ __html: textContent }}
                  />
                </Box>
              ) : filePreview === 'word-preview-error' ? (
                // Word preview error
                <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                  <Typography variant="body2" color="error">
                    ❌ Failed to load Word document preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    The file will still be uploaded
                  </Typography>
                </Box>
              ) : (
                // File path display
                <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid #444', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    File Path:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {filePreview}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </Box>
    )
  }

  // Step 2: References
  const renderReferencesStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            References
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add references cited in this article. At least one reference is required.
          </Typography>
        </Box>

        {/* Added References List */}
        {formData.references.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Added References ({formData.references.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {formData.references.map((ref) => (
                <Paper
                  key={ref.refNo}
                  sx={{
                    p: 2,
                    bgcolor: ref.refNo === formData.artPrimaryRefEntry ? '#1976d2' : '#424242',
                    border: ref.refNo === formData.artPrimaryRefEntry ? '2px solid' : '1px solid',
                    borderColor: ref.refNo === formData.artPrimaryRefEntry ? '#2196f3' : '#616161',
                    color: '#ffffff'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={`#${Math.floor(ref.refNo)}`}
                          size="small"
                          color={ref.refNo === formData.artPrimaryRefEntry ? 'primary' : 'default'}
                        />
                        {ref.refNo === formData.artPrimaryRefEntry && (
                          <Chip label="Primary" size="small" color="primary" variant="outlined" />
                        )}
                        {ref.refIndex && (
                          <Chip label={ref.refIndex} size="small" variant="outlined" />
                        )}
                      </Box>

                      {ref.refTitle && (
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {ref.refTitle}
                        </Typography>
                      )}

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Publication:</strong> {ref.refPublication}
                        {ref.refYear !== null && Math.floor(ref.refYear) !== -1 && ` (${Math.floor(ref.refYear)})`}
                        {ref.refVolume !== null && Math.floor(ref.refVolume) !== -1 && `, Vol. ${Math.floor(ref.refVolume)}`}
                        {ref.refIssue !== null && Math.floor(ref.refIssue) !== -1 && `, Issue ${Math.floor(ref.refIssue)}`}
                        {((ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1) || (ref.refEndPage !== null && Math.floor(ref.refEndPage) !== -1)) && `, pp. ${ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1 ? Math.floor(ref.refStartPage) : '?'}-${ref.refEndPage !== null && Math.floor(ref.refEndPage) !== -1 ? Math.floor(ref.refEndPage) : '?'}`}
                      </Typography>

                      {ref.refDoi && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          <strong>DOI:</strong> {ref.refDoi}
                        </Typography>
                      )}

                      {ref.refAbs && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          <strong>Abstract:</strong> {ref.refAbs.substring(0, 150)}
                          {ref.refAbs.length > 150 && '...'}
                        </Typography>
                      )}

                      {/* Signatures Display */}
                      {ref.signatures && ref.signatures.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ color: '#e0e0e0', fontWeight: 'bold' }} display="block" gutterBottom>
                            Signatures ({ref.signatures.length}):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {ref.signatures.map((sig: Signature, index: number) => {
                              const author = authors.find(a => a.id === sig.authorId)
                              const affiliation = affiliations.find(a => a.id === sig.affiliationId)
                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 1,
                                    px: 1,
                                    py: 0.5
                                  }}
                                >
                                  <Typography variant="caption" sx={{ color: '#90caf9', fontWeight: 'bold' }}>
                                    #{index + 1}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#ffffff' }}>
                                    {author?.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                                    @
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#ce93d8' }}>
                                    {affiliation?.name || 'Unknown'}
                                  </Typography>
                                </Box>
                              )
                            })}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      {formData.references.length > 1 && ref.refNo !== formData.artPrimaryRefEntry && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSetPrimary(ref.refNo)}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveReference(ref.refNo)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        )}

        {/* Add New Reference Form */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add New Reference
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Signature Management Section - FIRST */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Signatures (Authors & Affiliations) *
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add author-affiliation pairs for this reference. Each signature represents one author from one institution.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddSignature}
                  startIcon={<CloudUploadIcon />}
                >
                  Add Signature
                </Button>
              </Box>

              {/* Signatures List */}
              {currentReference.signatures.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {currentReference.signatures.map((sig: Signature, index: number) => {
                    const author = authors.find(a => a.id === sig.authorId)
                    const affiliation = affiliations.find(a => a.id === sig.affiliationId)
                    return (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          bgcolor: '#424242',
                          border: '1px solid',
                          borderColor: '#616161',
                          color: '#ffffff'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip label={`#${index + 1}`} size="small" color="primary" />
                              <Chip label={author?.name || 'Unknown Author'} size="small" />
                              <Typography variant="caption" sx={{ color: '#ffffff' }}>@</Typography>
                              <Chip label={affiliation?.name || 'Unknown Affiliation'} size="small" color="secondary" />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                              {sig.name || `${formData.artTitle}-Ref${currentReference.refNo}-Sig${index + 1}`}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ color: '#ffffff', borderColor: '#ffffff' }}
                              onClick={() => handleEditSignature(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteSignature(index)}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#424242', border: '1px solid #616161' }}>
                  <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                    No signatures added yet. Click "Add Signature" to add author-affiliation pairs.
                  </Typography>
                </Paper>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Row 1: Index and Title */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Platform Index"
                placeholder="e.g., arxiv 2501.34521"
                value={currentReference.refIndex}
                onChange={(e) => setCurrentReference({ ...currentReference, refIndex: e.target.value })}
                fullWidth
                helperText="Optional: Platform-specific identifier"
              />
              <TextField
                label="Title"
                value={currentReference.refTitle}
                onChange={(e) => setCurrentReference({ ...currentReference, refTitle: e.target.value })}
                fullWidth
                helperText="Optional"
              />
            </Box>

            {/* Row 2: Publication and Year */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Publication *"
                value={currentReference.refPublication}
                onChange={(e) => setCurrentReference({ ...currentReference, refPublication: e.target.value })}
                fullWidth
                required
                helperText="Required: Journal, conference, etc."
              />
              <TextField
                label="Year"
                type="number"
                value={currentReference.refYear || ''}
                onChange={(e) => setCurrentReference({ ...currentReference, refYear: e.target.value ? parseInt(e.target.value) : null })}
                sx={{ width: '150px' }}
                helperText="Optional"
              />
            </Box>

            {/* Row 3: Volume, Issue, Pages */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Volume"
                type="number"
                value={currentReference.refVolume || ''}
                onChange={(e) => setCurrentReference({ ...currentReference, refVolume: e.target.value ? parseInt(e.target.value) : null })}
                sx={{ width: '120px' }}
                helperText="Optional"
              />
              <TextField
                label="Issue"
                type="number"
                value={currentReference.refIssue || ''}
                onChange={(e) => setCurrentReference({ ...currentReference, refIssue: e.target.value ? parseInt(e.target.value) : null })}
                sx={{ width: '120px' }}
                helperText="Optional"
              />
              <TextField
                label="Start Page"
                type="number"
                value={currentReference.refStartPage || ''}
                onChange={(e) => setCurrentReference({ ...currentReference, refStartPage: e.target.value ? parseInt(e.target.value) : null })}
                sx={{ width: '150px' }}
                helperText="Optional"
              />
              <TextField
                label="End Page *"
                type="number"
                value={currentReference.refEndPage || ''}
                onChange={(e) => setCurrentReference({ ...currentReference, refEndPage: e.target.value ? parseInt(e.target.value) : null })}
                sx={{ width: '150px' }}
                required
                helperText="Required"
              />
            </Box>

            {/* Row 4: DOI */}
            <TextField
              label="DOI"
              placeholder="e.g., 10.1234/example.2024.001"
              value={currentReference.refDoi}
              onChange={(e) => setCurrentReference({ ...currentReference, refDoi: e.target.value })}
              fullWidth
              helperText="Optional: Digital Object Identifier"
            />

            {/* Row 5: Abstract */}
            <TextField
              label="Abstract *"
              value={currentReference.refAbs}
              onChange={(e) => setCurrentReference({ ...currentReference, refAbs: e.target.value })}
              fullWidth
              multiline
              rows={4}
              required
              helperText="Required: Brief summary of the reference"
            />

            {/* Add Button */}
            <Button
              variant="contained"
              onClick={handleAddReference}
              sx={{ alignSelf: 'flex-start', mt: 2 }}
            >
              Add Reference
            </Button>
          </Box>
        </Paper>

      </Box>
    )
  }

  // Step 3: Entity Tags
  const renderEntityTagsStep = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Entity Tags
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Tag this article with relevant entities (Objects, Algorithms, Improvements, etc.)
        </Typography>

        <Autocomplete
          multiple
          options={allEntities}
          getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.typeName})`}
          value={formData.entityTags}
          onChange={(_, newValue) => {
            setFormData({ ...formData, entityTags: newValue })
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Entity Tags"
              placeholder="Select entities to tag"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              if (typeof option === 'string') {
                return (
                  <Chip
                    key={key}
                    label={option}
                    {...tagProps}
                    size="small"
                  />
                )
              }
              return (
                <Chip
                  key={key}
                  label={option.name}
                  {...tagProps}
                  size="small"
                  color={
                    option.type === 'object' ? 'primary' :
                    option.type === 'algo' ? 'secondary' :
                    option.type === 'improvement' ? 'success' :
                    option.type === 'problem' ? 'warning' :
                    option.type === 'definition' ? 'info' :
                    option.type === 'contrib' ? 'error' :
                    'default'
                  }
                />
              )
            })
          }
        />

        {formData.entityTags.length > 0 && (
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Entity Tags ({formData.entityTags.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {formData.entityTags.map((tag, index) => {
                if (typeof tag === 'string') {
                  return (
                    <Chip
                      key={index}
                      label={tag}
                      size="medium"
                    />
                  )
                }
                return (
                  <Chip
                    key={tag.id}
                    label={`${tag.name} (${tag.typeName})`}
                    size="medium"
                    color={
                      tag.type === 'object' ? 'primary' :
                      tag.type === 'algo' ? 'secondary' :
                      tag.type === 'improvement' ? 'success' :
                      tag.type === 'problem' ? 'warning' :
                      tag.type === 'definition' ? 'info' :
                      tag.type === 'contrib' ? 'error' :
                      'default'
                    }
                  />
                )
              })}
            </Box>
          </Paper>
        )}
      </Box>
    )
  }

  // Step 4: Contributions
  const renderContributionsStep = () => {
    const getEntityName = (id: string) => {
      return allEntities.find(e => e.id === id)?.name ?? id
    }

    const handleRemoveContribution = (index: number) => {
      const newContributions = formData.contributions.filter((_, i) => i !== index)
      setFormData({ ...formData, contributions: newContributions })
    }

    // Get all contribution entities
    const allContributions = allEntities.filter(e => e.type === 'contrib')

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Contributions
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select existing contributions or create new ones. Each contribution can include improvements, algorithms, research objects, and a definition it solves.
        </Typography>

        {/* Autocomplete for selecting existing contributions */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Autocomplete
            sx={{ flexGrow: 1 }}
            options={allContributions.filter(c => !formData.contributions.find(fc => {
              if (typeof fc === 'string') return false
              return fc.id === c.id
            }))}
            getOptionLabel={(option) => option.name || 'Unnamed Contribution'}
            onChange={async (_, value) => {
              if (value) {
                // Fetch full contribution details
                try {
                  const contributions = await window.entity.getAllByType('contrib')
                  const fullContribution = contributions.find(c => c.id === value.id)
                  if (fullContribution) {
                    // Convert EntityItem to EntityType
                    const entityContribution: EntityType = {
                      id: fullContribution.id,
                      name: fullContribution.name || 'Unnamed Contribution',
                      type: 'contrib',
                      typeName: 'Contribution',
                      description: fullContribution.description,
                      subjectId: fullContribution.subjectId,
                      aliasIds: fullContribution.aliasIds,
                      parentIds: fullContribution.parentIds,
                      improvementIds: fullContribution.improvementIds,
                      algoIds: fullContribution.algoIds,
                      objectIds: fullContribution.objectIds,
                      solutionToId: fullContribution.solutionToId
                    }
                    // Add the full contribution to the list
                    setFormData({
                      ...formData,
                      contributions: [...formData.contributions, entityContribution]
                    })
                  } else {
                    // Fallback: convert value to EntityType
                    const entityValue: EntityType = {
                      id: value.id,
                      name: value.name,
                      type: 'contrib',
                      typeName: 'Contribution',
                      description: value.name
                    }
                    setFormData({
                      ...formData,
                      contributions: [...formData.contributions, entityValue]
                    })
                  }
                } catch (error) {
                  console.error('Failed to fetch contribution details:', error)
                  toast.error('Failed to load contribution details')
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Contribution"
                placeholder="Search for existing contributions..."
              />
            )}
            value={null}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setQuickAddContributionDialogOpen(true)}
            sx={{ minWidth: '150px', height: '56px' }}
          >
            Quick Add
          </Button>
        </Box>

        {/* Contributions List */}
        {formData.contributions.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formData.contributions.map((contrib, index) => {
              // Handle string contributions
              if (typeof contrib === 'string') {
                return (
                  <Paper key={index} sx={{ p: 2, bgcolor: '#2a2a2a', border: '1px solid #444' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {contrib}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveContribution(index)}
                        sx={{ color: '#ff6b6b' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                )
              }

              // Handle EntityType contributions
              return (
                <Paper key={index} sx={{ p: 2, bgcolor: '#2a2a2a', border: '1px solid #444' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Contribution #{index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveContribution(index)}
                      sx={{ color: '#ff6b6b' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Description */}
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold' }}>
                        Description:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {contrib.description}
                      </Typography>
                    </Box>

                    {/* Improvements */}
                    {contrib.improvementIds && contrib.improvementIds.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold' }}>
                          Improvements ({contrib.improvementIds.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {contrib.improvementIds.map((id: string) => (
                            <Chip
                              key={id}
                              label={getEntityName(id)}
                              size="small"
                              color="success"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Algorithms */}
                    {contrib.algoIds && contrib.algoIds.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold' }}>
                          Algorithms ({contrib.algoIds.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {contrib.algoIds.map((id: string) => (
                            <Chip
                              key={id}
                              label={getEntityName(id)}
                              size="small"
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Research Objects */}
                    {contrib.objectIds && contrib.objectIds.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold' }}>
                          Research Objects ({contrib.objectIds.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {contrib.objectIds.map((id: string) => (
                            <Chip
                              key={id}
                              label={getEntityName(id)}
                              size="small"
                              color="primary"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Solution To (Definition) */}
                    {contrib.solutionToId && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#999', fontWeight: 'bold' }}>
                          Solution To:
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={getEntityName(contrib.solutionToId)}
                            size="small"
                            color="info"
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Box>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
            <Typography variant="body2" color="text.secondary">
              No contributions added yet. Click "Add Contribution" to get started.
            </Typography>
          </Paper>
        )}
      </Box>
    )
  }

  // Step 5: Preview & Confirm
  const renderPreviewStep = () => {
    // Helper function to get entity name by ID
    const getEntityName = (id: string) => {
      return detailedEntities[id]?.name || allEntities.find(e => e.id === id)?.name || id
    }

    // Helper function to get domain name by ID
    const getDomainName = (id: string) => {
      const mainDomain = mainDomains.find(d => d.id === id)
      if (mainDomain) return mainDomain.name
      const subDomain = subDomains.find(d => d.id === id)
      if (subDomain) return subDomain.name
      return id
    }

    // Component to render entity details card
    const EntityDetailCard = ({ entityId }: { entityId: string }) => {
      const entity = detailedEntities[entityId]

      if (!entity) {
        return (
          <Box sx={{
            p: 1.5,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 1,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography variant="body2" color="text.secondary">
              Loading details for {getEntityName(entityId)}...
            </Typography>
          </Box>
        )
      }

      return (
        <Box sx={{
          p: 1.5,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 1,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {entity.name || 'Unnamed'}
          </Typography>
          {entity.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
              {entity.description}
            </Typography>
          )}
          {entity.subjectId && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Domain:</Typography>
              <Chip label={getDomainName(entity.subjectId)} size="small" variant="outlined" />
            </Box>
          )}
          {entity.metric && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Metric:</Typography>
              <Typography variant="caption">{entity.metric}</Typography>
              {entity.metricResultString && (
                <Typography variant="caption" color="success.main">
                  → {entity.metricResultString}
                </Typography>
              )}
              {entity.metricResultNumber !== undefined && entity.metricResultNumber !== null && (
                <Typography variant="caption" color="success.main">
                  → {entity.metricResultNumber}
                </Typography>
              )}
            </Box>
          )}
          {entity.originIds && entity.originIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Origin:</Typography>
              {entity.originIds.map((id: string, idx: number) => (
                <Chip key={idx} label={getEntityName(id)} size="small" variant="outlined" />
              ))}
            </Box>
          )}
          {entity.advanceIds && entity.advanceIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Advance:</Typography>
              {entity.advanceIds.map((id: string, idx: number) => (
                <Chip key={idx} label={getEntityName(id)} size="small" variant="outlined" />
              ))}
            </Box>
          )}
          {entity.targetIds && entity.targetIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Target:</Typography>
              {entity.targetIds.map((id: string, idx: number) => (
                <Chip key={idx} label={getEntityName(id)} size="small" variant="outlined" />
              ))}
            </Box>
          )}
          {entity.expectationIds && entity.expectationIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Expectation:</Typography>
              {entity.expectationIds.map((id: string, idx: number) => (
                <Chip key={idx} label={getEntityName(id)} size="small" variant="outlined" />
              ))}
            </Box>
          )}
          {entity.transformationIds && entity.transformationIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Transformation:</Typography>
              {entity.transformationIds.map((id: string, idx: number) => (
                <Chip key={idx} label={getEntityName(id)} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Preview & Confirm
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Please review all information before saving.
        </Typography>

        {/* Basic Information */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Basic Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Article Title:</Typography>
              <Typography variant="body2">{formData.artTitle || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">File Path:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {formData.artPath || '-'}
              </Typography>
            </Box>
            {formData.file && (
              <Box>
                <Typography variant="caption" color="text.secondary">File:</Typography>
                <Typography variant="body2">
                  {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* File Preview */}
        {filePreview && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              File Preview
            </Typography>
            {filePreview.startsWith('data:image') ? (
              // Image preview (including PDF rendered as image)
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <img
                  src={filePreview}
                  alt="Article preview"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              </Box>
            ) : filePreview === 'pdf-preview-error' ? (
              // PDF preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load PDF preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : filePreview === 'text-preview' ? (
              // Text file preview (txt, md)
              <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #ddd', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="caption" sx={{ color: '#666' }} gutterBottom>
                  📝 Text Content:
                </Typography>
                <Box sx={{
                  mt: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#000000'
                }}>
                  {textContent.length > 0 ? (
                    <>
                      {textContent.substring(0, 1500)}
                      {textContent.length > 1500 && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 2, fontStyle: 'italic', color: '#666' }}>
                          ... (showing first 1500 characters of {textContent.length} total)
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666' }}>
                      (Empty file)
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : filePreview === 'text-preview-error' ? (
              // Text preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load text preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : filePreview === 'markdown-preview' ? (
              // Markdown file preview
              <Box sx={{
                p: 3,
                bgcolor: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: 1,
                maxHeight: 300,
                overflow: 'auto',
                '& h1': {
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  marginTop: '1.25rem',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                  borderBottom: '2px solid #e0e0e0',
                  paddingBottom: '0.4rem'
                },
                '& h2': {
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  marginBottom: '0.6rem',
                  lineHeight: 1.3,
                  color: '#2a2a2a',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '0.25rem'
                },
                '& h3': {
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  marginTop: '0.75rem',
                  marginBottom: '0.5rem',
                  lineHeight: 1.3,
                  color: '#3a3a3a'
                },
                '& h4, & h5, & h6': {
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginTop: '0.6rem',
                  marginBottom: '0.4rem',
                  lineHeight: 1.3,
                  color: '#4a4a4a'
                },
                '& p': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.6rem',
                  color: '#333'
                },
                '& ul, & ol': {
                  marginLeft: '1.5rem',
                  marginBottom: '0.6rem',
                  paddingLeft: '0.5rem'
                },
                '& li': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.2rem',
                  color: '#333'
                },
                '& strong': {
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                },
                '& em': {
                  fontStyle: 'italic'
                },
                '& a': {
                  color: '#1976d2',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#1565c0'
                  }
                },
                '& code': {
                  backgroundColor: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.85em',
                  color: '#d63384'
                },
                '& pre': {
                  backgroundColor: '#f5f5f5',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginBottom: '0.75rem',
                  border: '1px solid #e0e0e0'
                },
                '& pre code': {
                  backgroundColor: 'transparent',
                  padding: 0,
                  color: '#333'
                },
                '& blockquote': {
                  borderLeft: '4px solid #1976d2',
                  paddingLeft: '1rem',
                  marginLeft: '0',
                  marginBottom: '0.75rem',
                  color: '#666',
                  fontStyle: 'italic',
                  backgroundColor: '#f8f9fa'
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '0.75rem',
                  border: '1px solid #ddd'
                },
                '& th, & td': {
                  border: '1px solid #ddd',
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold'
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  margin: '0.75rem 0',
                  borderRadius: '4px'
                },
                '& hr': {
                  border: 'none',
                  borderTop: '2px solid #e0e0e0',
                  margin: '1rem 0'
                }
              }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                  📝 Markdown Content:
                </Typography>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {textContent}
                </ReactMarkdown>
              </Box>
            ) : filePreview === 'markdown-preview-error' ? (
              // Markdown preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load Markdown preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : filePreview === 'word-preview' ? (
              // Word document preview
              <Box sx={{
                p: 3,
                bgcolor: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: 1,
                maxHeight: 300,
                overflow: 'auto',
                '& h1': {
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  marginTop: '1.25rem',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                  color: '#1a1a1a'
                },
                '& h2': {
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  marginBottom: '0.6rem',
                  lineHeight: 1.3,
                  color: '#2a2a2a'
                },
                '& h3': {
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  marginTop: '0.75rem',
                  marginBottom: '0.5rem',
                  lineHeight: 1.3,
                  color: '#3a3a3a'
                },
                '& h4, & h5, & h6': {
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginTop: '0.6rem',
                  marginBottom: '0.4rem',
                  lineHeight: 1.3,
                  color: '#4a4a4a'
                },
                '& p': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.6rem',
                  color: '#333',
                  textAlign: 'justify'
                },
                '& ul, & ol': {
                  marginLeft: '1.5rem',
                  marginBottom: '0.6rem',
                  paddingLeft: '0.5rem'
                },
                '& li': {
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  marginBottom: '0.2rem',
                  color: '#333'
                },
                '& strong': {
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                },
                '& em': {
                  fontStyle: 'italic'
                },
                '& a': {
                  color: '#1976d2',
                  textDecoration: 'underline'
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '0.75rem',
                  border: '1px solid #ddd'
                },
                '& th, & td': {
                  border: '1px solid #ddd',
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold'
                },
                '& blockquote': {
                  borderLeft: '4px solid #ddd',
                  paddingLeft: '1rem',
                  marginLeft: '0',
                  marginBottom: '0.75rem',
                  color: '#666',
                  fontStyle: 'italic'
                },
                '& code': {
                  backgroundColor: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.85em'
                },
                '& pre': {
                  backgroundColor: '#f5f5f5',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginBottom: '0.75rem'
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  margin: '0.75rem 0'
                }
              }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 2 }}>
                  📄 Word Document Content:
                </Typography>
                <Box
                  dangerouslySetInnerHTML={{ __html: textContent }}
                />
              </Box>
            ) : filePreview === 'word-preview-error' ? (
              // Word preview error
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'background.paper', border: '1px solid #f44336' }}>
                <Typography variant="body2" color="error">
                  ❌ Failed to load Word document preview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The file will still be uploaded
                </Typography>
              </Box>
            ) : (
              // File path display
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {filePreview}
              </Typography>
            )}
          </Paper>
        )}

        {/* References */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            References
          </Typography>
          {formData.references.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {formData.references.map((ref: Reference, index: number) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: ref.refNo === formData.artPrimaryRefEntry ? 'rgba(76, 175, 80, 0.1)' : 'background.paper',
                    borderRadius: 1,
                    border: ref.refNo === formData.artPrimaryRefEntry ? '2px solid #4caf50' : '1px solid #444',
                    position: 'relative'
                  }}
                >
                  {ref.refNo === formData.artPrimaryRefEntry && (
                    <Chip
                      label="PRIMARY"
                      size="small"
                      color="success"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px' }}>
                        Ref No:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.floor(ref.refNo)}
                      </Typography>
                    </Box>
                    {ref.refIndex && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px' }}>
                          Index:
                        </Typography>
                        <Typography variant="body2">
                          {ref.refIndex}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', mt: 0.5 }}>
                        Title:
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {ref.refTitle || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {ref.refYear !== null && Math.floor(ref.refYear) !== -1 && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Year:
                          </Typography>
                          <Typography variant="body2">
                            {Math.floor(ref.refYear)}
                          </Typography>
                        </Box>
                      )}
                      {ref.refPublication && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Publication:
                          </Typography>
                          <Typography variant="body2">
                            {ref.refPublication}
                          </Typography>
                        </Box>
                      )}
                      {ref.refVolume !== null && Math.floor(ref.refVolume) !== -1 && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Volume:
                          </Typography>
                          <Typography variant="body2">
                            {Math.floor(ref.refVolume)}
                          </Typography>
                        </Box>
                      )}
                      {ref.refIssue !== null && Math.floor(ref.refIssue) !== -1 && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Issue:
                          </Typography>
                          <Typography variant="body2">
                            {Math.floor(ref.refIssue)}
                          </Typography>
                        </Box>
                      )}
                      {((ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1) || (ref.refEndPage !== null && Math.floor(ref.refEndPage) !== -1)) && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Pages:
                          </Typography>
                          <Typography variant="body2">
                            {(ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1) && (ref.refEndPage !== null && Math.floor(ref.refEndPage) !== -1)
                              ? `${Math.floor(ref.refStartPage)}-${Math.floor(ref.refEndPage)}`
                              : (ref.refStartPage !== null && Math.floor(ref.refStartPage) !== -1) ? Math.floor(ref.refStartPage) : (ref.refEndPage !== null ? Math.floor(ref.refEndPage) : '')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {ref.refDoi && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px' }}>
                          DOI:
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {ref.refDoi}
                        </Typography>
                      </Box>
                    )}
                    {ref.refUrl && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px' }}>
                          URL:
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {ref.refUrl}
                        </Typography>
                      </Box>
                    )}
                    {ref.signatures && ref.signatures.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px', mt: 0.5 }}>
                          Authors:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                          {ref.signatures.map((sig: Signature, idx: number) => {
                            const author = authors.find(a => a.id === sig.authorId)
                            const affiliation = affiliations.find(aff => aff.id === sig.affiliationId)
                            return (
                              <Chip
                                key={idx}
                                label={`${author?.name || sig.authorId}${affiliation ? ` (${affiliation.name})` : ''}`}
                                size="small"
                                variant="outlined"
                              />
                            )
                          })}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No references added
            </Typography>
          )}
        </Paper>

        {/* Entity Tags */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Entity Tags
          </Typography>
          {formData.entityTags.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {formData.entityTags.map((tag, index) => {
                if (typeof tag === 'string') {
                  return (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      color="default"
                    />
                  )
                }
                return (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    color={
                      tag.type === 'object' ? 'primary' :
                      tag.type === 'algo' ? 'secondary' :
                      tag.type === 'improvement' ? 'success' :
                      tag.type === 'problem' ? 'warning' :
                      tag.type === 'definition' ? 'info' :
                      tag.type === 'contrib' ? 'error' :
                      'default'
                    }
                  />
                )
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No entity tags added
            </Typography>
          )}
        </Paper>

        {/* Contributions */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Contributions
          </Typography>
          {formData.contributions.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {formData.contributions.map((contrib, index: number) => {
                if (typeof contrib === 'string') {
                  return (
                    <Box key={index} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #444' }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Contribution #{index + 1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {contrib}
                      </Typography>
                    </Box>
                  )
                }
                return (
                  <Box key={index} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #444' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Contribution #{index + 1}
                    </Typography>

                  {/* Contribution Description */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                      Description:
                    </Typography>
                    <Typography variant="body2">
                      {contrib.description || 'No description'}
                    </Typography>
                  </Box>

                  {/* Domain */}
                  {contrib.subjectId && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Domain:
                      </Typography>
                      <Chip label={getDomainName(contrib.subjectId)} size="small" color="primary" />
                    </Box>
                  )}

                  {/* Improvements */}
                  {contrib.improvementIds && contrib.improvementIds.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Improvements ({contrib.improvementIds.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contrib.improvementIds.map((id: string) => (
                          <EntityDetailCard key={id} entityId={id} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Algorithms */}
                  {contrib.algoIds && contrib.algoIds.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Algorithms ({contrib.algoIds.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contrib.algoIds.map((id: string) => (
                          <EntityDetailCard key={id} entityId={id} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Research Objects */}
                  {contrib.objectIds && contrib.objectIds.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Research Objects ({contrib.objectIds.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contrib.objectIds.map((id: string) => (
                          <EntityDetailCard key={id} entityId={id} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Solution To */}
                  {contrib.solutionToId && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Solution To:
                      </Typography>
                      <EntityDetailCard entityId={contrib.solutionToId} />
                    </Box>
                  )}
                </Box>
                )
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No contributions added
            </Typography>
          )}
        </Paper>
      </Box>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <DialogTitle>
        {mode === 'add' ? 'Add Article' : 'Edit Article'}
      </DialogTitle>
      <DialogContent>
        {/* Hidden canvas for PDF rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Stepper */}
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        <Box sx={{ mt: 2 }}>
          {activeStep === 0 && renderBasicInfoStep()}
          {activeStep === 1 && renderReferencesStep()}
          {activeStep === 2 && renderEntityTagsStep()}
          {activeStep === 3 && renderContributionsStep()}
          {activeStep === 4 && renderPreviewStep()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} startIcon={<NavigateBeforeIcon />}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" endIcon={<NavigateNextIcon />}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSave} variant="contained" color="success">
            Confirm & Save
          </Button>
        )}
      </DialogActions>

      {/* Signature Dialog */}
      <SignatureDialog
        open={signatureDialogOpen}
        mode={signatureDialogMode}
        signature={
          signatureDialogMode === 'edit' && selectedSignatureIndex !== null
            ? currentReference.signatures[selectedSignatureIndex]
            : null
        }
        articleName={formData.artTitle}
        refNo={formData.references.length}
        currentSignatureCount={currentReference.signatures.length}
        authors={authors}
        affiliations={affiliations}
        onClose={() => setSignatureDialogOpen(false)}
        onSave={handleSaveSignature}
        onQuickAddAuthor={handleQuickAddAuthor}
        onQuickAddAffiliation={handleQuickAddAffiliation}
      />

      {/* Quick Add Author Dialog */}
      <QuickAddAuthorDialog
        open={quickAddAuthorDialogOpen}
        affiliations={affiliations}
        onClose={() => setQuickAddAuthorDialogOpen(false)}
        onSave={handleSaveQuickAuthor}
      />

      {/* Quick Add Affiliation Dialog */}
      <QuickAddAffiliationDialog
        open={quickAddAffiliationDialogOpen}
        affiliations={affiliations}
        onClose={() => setQuickAddAffiliationDialogOpen(false)}
        onSave={handleSaveQuickAffiliation}
      />

      {/* Quick Add Contribution Dialog */}
      <QuickAddContributionDialog
        open={quickAddContributionDialogOpen}
        allEntities={allEntities}
        mainDomains={mainDomains}
        subDomains={subDomains as never[]}
        onClose={() => setQuickAddContributionDialogOpen(false)}
        onSave={handleSaveQuickContribution}
        onQuickAddDomain={() => setQuickAddDomainDialogOpen(true)}
        onQuickAddImprovement={() => setQuickAddImprovementDialogOpen(true)}
        onQuickAddAlgo={() => setQuickAddAlgoDialogOpen(true)}
        onQuickAddObject={() => setQuickAddObjectDialogOpen(true)}
        onQuickAddDefinition={() => setQuickAddDefinitionDialogOpen(true)}
      />

      {/* Quick Add Improvement Dialog */}
      <QuickAddImprovementDialog
        open={quickAddImprovementDialogOpen}
        allEntities={allEntities}
        mainDomains={mainDomains}
        subDomains={subDomains as never[]}
        onClose={() => setQuickAddImprovementDialogOpen(false)}
        onSave={handleSaveQuickImprovement}
        onQuickAddDomain={() => setQuickAddDomainDialogOpen(true)}
      />

      {/* Quick Add Algo Dialog */}
      <QuickAddAlgoDialog
        open={quickAddAlgoDialogOpen}
        allEntities={allEntities}
        mainDomains={mainDomains}
        subDomains={subDomains as never[]}
        onClose={() => setQuickAddAlgoDialogOpen(false)}
        onSave={handleSaveQuickAlgo}
        onQuickAddDomain={() => setQuickAddDomainDialogOpen(true)}
      />

      {/* Quick Add Object Dialog */}
      <QuickAddObjectDialog
        open={quickAddObjectDialogOpen}
        allEntities={allEntities}
        mainDomains={mainDomains}
        subDomains={subDomains as never[]}
        onClose={() => setQuickAddObjectDialogOpen(false)}
        onSave={handleSaveQuickObject}
        onQuickAddDomain={() => setQuickAddDomainDialogOpen(true)}
      />

      {/* Quick Add Definition Dialog */}
      <QuickAddDefinitionDialog
        open={quickAddDefinitionDialogOpen}
        allEntities={allEntities}
        mainDomains={mainDomains}
        subDomains={subDomains as never[]}
        onClose={() => setQuickAddDefinitionDialogOpen(false)}
        onSave={handleSaveQuickDefinition}
        onQuickAddDomain={() => setQuickAddDomainDialogOpen(true)}
      />

      {/* Quick Add Domain Dialog */}
      <QuickAddDomainDialog
        open={quickAddDomainDialogOpen}
        mainDomains={mainDomains}
        onClose={() => setQuickAddDomainDialogOpen(false)}
        onSave={handleSaveQuickDomain}
      />
    </Dialog>
  )
}

export default ArticleDialog

