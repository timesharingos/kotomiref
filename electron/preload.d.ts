export {};

interface ConfigData {
  dbmode: string;
  filemode: string;
  filedir: string;
  initialized: boolean;
  stateVersion: string;
  compatibleVersion: string;
}

interface Affiliation {
  id: string;
  name: string;
  parentId: string | null;
}

interface AffiliationHierarchy {
  childId: string;
  parentId: string;
}

interface Author {
  id: string;
  name: string;
  affiliations: string[];
}

interface AuthorAffiliation {
  authorId: string;
  affiliationId: string;
}

interface Signature {
  id: string;
  name: string;
  authorId: string;
  affiliationId: string;
  sigNo: number;
}

interface SignatureData {
  id?: string;
  name: string;
  authorId: string | null;
  affiliationId: string | null;
  referenceId?: string;
}

interface MainDomain {
  id: string;
  name: string;
  description?: string;
}

interface SubDomain {
  id: string;
  name: string;
  description?: string;
  mainDomainId: string | null;
}

interface SubDomainRelation {
  subDomainId: string;
  mainDomainId: string;
}

interface EntityItem {
  id: string;
  name?: string;
  description?: string;
  metric?: string;
  metricResultString?: string;
  metricResultNumber?: number;
  subjectId?: string;
  subjectName?: string;
  aliasIds?: string[];
  aliasNames?: string[];
  parentIds?: string[];
  parentNames?: string[];
  relationIds?: string[];
  relationNames?: string[];
  targetIds?: string[];
  targetNames?: string[];
  expectationIds?: string[];
  expectationNames?: string[];
  transformationIds?: string[];
  transformationNames?: string[];
  originIds?: string[];
  originNames?: string[];
  advanceIds?: string[];
  advanceNames?: string[];
  domainIds?: string[];
  domainNames?: string[];
  evoIds?: string[];
  evoNames?: string[];
  refineIds?: string[];
  refineNames?: string[];
  scenarioIds?: string[];
  scenarioNames?: string[];
  // Contribution-specific fields
  improvementIds?: string[];
  improvementNames?: string[];
  algoIds?: string[];
  algoNames?: string[];
  objectIds?: string[];
  objectNames?: string[];
  solutionToId?: string;
  solutionToName?: string;
}

interface AllEntityItem {
  id: string;
  name: string;
  type: string;
  typeName: string;
}

interface ObjectData {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  aliasIds: string[];
  parentIds: string[];
  relationIds: string[];
}

interface AlgoData {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  aliasIds: string[];
  parentIds: string[];
  relationIds: string[];
  targetIds: string[];
  expectationIds: string[];
  transformationIds: string[];
}

interface ImprovementData {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  metric?: string;
  metricResultString?: string;
  metricResultNumber?: number;
  aliasIds: string[];
  parentIds: string[];
  relationIds: string[];
  originIds: string[];
  advanceIds: string[];
}

interface ProblemData {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  aliasIds: string[];
  parentIds: string[];
  relationIds: string[];
  domainIds: string[];
  evoIds: string[];
}

interface DefinitionData {
  id?: string;
  name: string;
  description: string;
  subjectId: string;
  aliasIds: string[];
  parentIds: string[];
  relationIds: string[];
  refineIds: string[];
  scenarioIds: string[];
  evoIds: string[];
}

interface ContributionData {
  id?: string;
  description: string;
  subjectId: string;
  aliasIds: string[];
  parentIds: string[];
  relationIds: string[];
  improvementIds: string[];
  algoIds: string[];
  objectIds: string[];
  solutionToId: string;
}

interface ReferenceSignature {
  id?: string;
  authorId: string;
  affiliationId: string;
  order: number;
}

interface Reference {
  id?: string;
  refNo: number;
  refIndex: string;
  refTitle: string;
  refYear: number | null;
  refPublication: string;
  refVolume: number | null;
  refIssue: number | null;
  refStartPage: number | null;
  refEndPage: number | null;
  refDoi: string;
  refAbs: string;
  signatures: ReferenceSignature[];
}

interface Article {
  id: string;
  artTitle: string;
  artPath: string;
  artPrimaryRefEntry: number | null;
  references: Reference[];
  entityTags: string[];
  contributions: string[];
}

interface ArticleData {
  id?: string;
  artTitle: string;
  artPath: string;
  artPrimaryRefEntry: number | null;
  references: Reference[];
  entityTags: string[];
  contributions: string[];
}

declare global {
  interface Window {
    dev: {
      send: (msg: string) => void;
      invoke: (msg: string) => Promise<string>;
      getVersion: () => Promise<string>;
    };
    config: {
      checkInitialized: () => Promise<boolean>;
      saveConfig: (config: ConfigData) => Promise<boolean>;
      updateConfig: (config: ConfigData) => Promise<boolean>;
      getConfig: () => Promise<ConfigData | null>;
      selectDirectory: () => Promise<string | null>;
      initOnly: () => Promise<void>;
    };
    data: {
      backup: (targetDir: string, includeConfig: boolean) => Promise<boolean>;
      restore: (sourceDir: string, includeConfig: boolean) => Promise<boolean>;
      reset: (includeConfig: boolean) => Promise<boolean>;
      selectDirectory: () => Promise<string | null>;
    };
    electron: {
      readFile: (filePath: string) => Promise<Buffer>;
      selectFile: () => Promise<string | null>;
    };
    affiliation: {
      getAll: () => Promise<Affiliation[]>;
      getHierarchy: () => Promise<AffiliationHierarchy[]>;
      add: (data: { name: string; parentId: string | null }) => Promise<{ success: boolean; id?: string; error?: string }>;
      update: (data: { id: string; name: string; parentId: string | null }) => Promise<{ success: boolean; error?: string }>;
      delete: (id: string) => Promise<{ success: boolean; deletedCount?: number; error?: string }>;
    };
    author: {
      getAll: () => Promise<Author[]>;
      getAffiliations: () => Promise<AuthorAffiliation[]>;
      add: (data: { name: string; affiliations: string[] }) => Promise<{ success: boolean; id?: string; error?: string }>;
      update: (data: { id: string; name: string; affiliations: string[] }) => Promise<{ success: boolean; error?: string }>;
      delete: (id: string) => Promise<{ success: boolean; error?: string }>;
    };
    signature: {
      getAll: () => Promise<Signature[]>;
      getByReference: (referenceId: string) => Promise<Signature[]>;
      save: (data: SignatureData) => Promise<{ success: boolean; id?: string; error?: string }>;
      delete: (id: string) => Promise<{ success: boolean; error?: string }>;
      linkToReference: (referenceId: string, signatureId: string) => Promise<{ success: boolean; id?: string; error?: string }>;
      unlinkFromReference: (referenceId: string, signatureId: string) => Promise<{ success: boolean; error?: string }>;
    };
    domain: {
      getAllMain: () => Promise<MainDomain[]>;
      getAllSub: () => Promise<SubDomain[]>;
      getSubRelations: () => Promise<SubDomainRelation[]>;
      addMain: (data: { name: string; desc?: string }) => Promise<{ success: boolean; id?: string; error?: string }>;
      updateMain: (data: { id: string; name: string; desc?: string }) => Promise<{ success: boolean; error?: string }>;
      deleteMain: (id: string) => Promise<{ success: boolean; deletedSubCount?: number; error?: string }>;
      addSub: (data: { name: string; desc?: string; mainDomainId: string }) => Promise<{ success: boolean; id?: string; error?: string }>;
      updateSub: (data: { id: string; name: string; desc?: string; mainDomainId: string }) => Promise<{ success: boolean; error?: string }>;
      deleteSub: (id: string) => Promise<{ success: boolean; error?: string }>;
    };
    entity: {
      getAllByType: (entityType: string) => Promise<EntityItem[]>;
      getAll: () => Promise<AllEntityItem[]>;
      addObject: (data: ObjectData) => Promise<{ success: boolean; id?: string; entityId?: string; error?: string }>;
      updateObject: (data: ObjectData) => Promise<{ success: boolean; error?: string }>;
      deleteObject: (id: string) => Promise<{ success: boolean; error?: string }>;
      addAlgo: (data: AlgoData) => Promise<{ success: boolean; id?: string; entityId?: string; error?: string }>;
      updateAlgo: (data: AlgoData) => Promise<{ success: boolean; error?: string }>;
      deleteAlgo: (id: string) => Promise<{ success: boolean; error?: string }>;
      addImprovement: (data: ImprovementData) => Promise<{ success: boolean; id?: string; entityId?: string; error?: string }>;
      updateImprovement: (data: ImprovementData) => Promise<{ success: boolean; error?: string }>;
      deleteImprovement: (id: string) => Promise<{ success: boolean; error?: string }>;
      addProblem: (data: ProblemData) => Promise<{ success: boolean; id?: string; entityId?: string; error?: string }>;
      updateProblem: (data: ProblemData) => Promise<{ success: boolean; error?: string }>;
      deleteProblem: (id: string) => Promise<{ success: boolean; error?: string }>;
      addDefinition: (data: DefinitionData) => Promise<{ success: boolean; id?: string; entityId?: string; error?: string }>;
      updateDefinition: (data: DefinitionData) => Promise<{ success: boolean; error?: string }>;
      deleteDefinition: (id: string) => Promise<{ success: boolean; error?: string }>;
      addContribution: (data: ContributionData) => Promise<{ success: boolean; id?: string; entityId?: string; error?: string }>;
      updateContribution: (data: ContributionData) => Promise<{ success: boolean; error?: string }>;
      deleteContribution: (id: string) => Promise<{ success: boolean; error?: string }>;
    };
    article: {
      getAll: () => Promise<Article[]>;
      getById: (id: string) => Promise<Article | null>;
      add: (data: ArticleData) => Promise<{ success: boolean; id?: string; error?: string }>;
      update: (data: ArticleData) => Promise<{ success: boolean; error?: string }>;
      delete: (id: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}