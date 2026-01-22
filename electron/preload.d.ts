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
    };
  }
}