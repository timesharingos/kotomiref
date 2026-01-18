export {};

interface ConfigData {
  dbmode: string;
  filemode: string;
  filedir: string;
  initialized: boolean;
  stateVersion: string;
  compatibleVersion: string;
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
    };
    data: {
      backup: (targetDir: string, includeConfig: boolean) => Promise<boolean>;
      restore: (sourceDir: string, includeConfig: boolean) => Promise<boolean>;
      reset: (includeConfig: boolean) => Promise<boolean>;
      selectDirectory: () => Promise<string | null>;
    };
  }
}