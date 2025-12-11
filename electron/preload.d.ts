export {};

declare global {
  interface Window {
    dev: {
      send: (msg: string) => void;
      invoke: (msg: string) => Promise<string>;
    };
  }
}