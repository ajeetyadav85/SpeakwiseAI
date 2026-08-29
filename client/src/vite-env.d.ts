/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: any) => void;
        prompt: (momentListener?: any) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
      };
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: any) => void;
          error_callback?: (error: any) => void;
        }) => {
          requestAccessToken: () => void;
        };
      };
    };
  };
}
