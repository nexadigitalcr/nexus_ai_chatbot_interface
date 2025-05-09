/// <reference types="vite/client" />

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

interface ImportMetaEnv {
  readonly VITE_OPENAI_REALTIME_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}