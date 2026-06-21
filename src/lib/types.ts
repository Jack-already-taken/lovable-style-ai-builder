export type GeneratedFile = {
  path: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'tsx' | 'json' | string;
  content: string;
};

export type GenerationResponse = {
  appName: string;
  projectId?: string;
  generationId?: string;
  files: GeneratedFile[];
};

export type HistoryItem = {
  id: string;
  project_id: string;
  prompt: string;
  files: GeneratedFile[];
  created_at: string;
};
