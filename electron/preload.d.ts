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
    };
    config: {
      checkInitialized: () => Promise<boolean>;
      saveConfig: (config: ConfigData) => Promise<boolean>;
      getConfig: () => Promise<ConfigData | null>;
      selectDirectory: () => Promise<string | null>;
    };
  }
}