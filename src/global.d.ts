// global.d.ts
/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_USE_BACKEND: string;
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  // Add other Vite env variables here
}
