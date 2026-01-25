// Entity types for the application

export interface EntityItem {
  id: string
  name?: string
  description?: string
  // Common fields
  subjectId?: string
  subjectName?: string
  aliasIds?: string[]
  parentIds?: string[]
  relationIds?: string[]
  // Improvement specific
  metric?: string
  metricResultString?: string
  metricResultNumber?: number
  originIds?: string[]
  advanceIds?: string[]
  // Algorithm specific
  targetIds?: string[]
  expectationIds?: string[]
  transformationIds?: string[]
  // Contribution specific
  improvementIds?: string[]
  algoIds?: string[]
  objectIds?: string[]
  solutionToId?: string
  solutionToName?: string
}

export type EntityType = 'object' | 'algo' | 'improvement' | 'problem' | 'definition' | 'contrib'

export interface EntityOption {
  id: string
  name: string
  type: string
  description?: string
}

// Type for addNode data parameter (without id since it's generated)
export type AddNodeData = Omit<EntityItem, 'id'>

