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
  }
}