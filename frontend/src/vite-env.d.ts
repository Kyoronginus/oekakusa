/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FIBONACCI_API_URL: string;
  readonly VITE_COLOR_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
