/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_KZT_PER_USD?: string;
  readonly VITE_RUB_PER_USD?: string;
  readonly VITE_GROUP_POLL_MS?: string;
  readonly VITE_NOTIFY_POLL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
