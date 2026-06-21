export type FileLanguage = 'html' | 'css' | 'javascript';

export type GeneratedFile = {
  path: string;
  language: FileLanguage;
  content: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  files: GeneratedFile[];
  last_prompt: string | null;
  deployment_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Generation = {
  id: string;
  project_id: string;
  prompt: string;
  files: GeneratedFile[];
  summary: string | null;
  kind: 'ai' | 'manual';
  model: string | null;
  created_at: string;
};

export type BillingStatus = {
  configured: boolean;
  enforcementEnabled: boolean;
  hasAccess: boolean;
  status: string;
  currentPeriodEnd: string | null;
  dailyUsed: number;
  dailyLimit: number;
};

export type GenerationResponse = {
  project: Project;
  generation: Generation;
  billing: BillingStatus;
};
