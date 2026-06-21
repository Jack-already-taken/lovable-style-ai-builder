import { useAuth } from '@clerk/react';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BuilderTopbar } from '../components/BuilderTopbar';
import { CodePanel } from '../components/CodePanel';
import { PreviewPane } from '../components/PreviewPane';
import { ProjectSidebar } from '../components/ProjectSidebar';
import { apiFetch } from '../lib/api';
import type { BillingStatus, GeneratedFile, Generation, GenerationResponse, Project } from '../lib/types';

const EMPTY_FILES: GeneratedFile[] = [];

type Toast = { type: 'success' | 'error'; message: string } | null;

export function BuilderPage() {
  const { getToken } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>(EMPTY_FILES);
  const [savedFiles, setSavedFiles] = useState<GeneratedFile[]>(EMPTY_FILES);
  const [activePath, setActivePath] = useState('index.html');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [initializing, setInitializing] = useState(true);

  const persistedName = project ? projects.find((item) => item.id === project.id)?.name : null;
  const dirty = useMemo(
    () => JSON.stringify(files) !== JSON.stringify(savedFiles) || Boolean(project && persistedName !== null && project.name !== persistedName),
    [files, savedFiles, project, persistedName]
  );

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const loadProjects = useCallback(async () => {
    const data = await apiFetch<{ projects: Project[] }>('/api/projects', getToken);
    setProjects(data.projects);
    return data.projects;
  }, [getToken]);

  const loadBilling = useCallback(async () => {
    const data = await apiFetch<BillingStatus>('/api/billing-status', getToken);
    setBilling(data);
  }, [getToken]);

  const openProject = useCallback(async (id: string) => {
    const [projectData, historyData] = await Promise.all([
      apiFetch<{ project: Project }>(`/api/project?id=${encodeURIComponent(id)}`, getToken),
      apiFetch<{ items: Generation[] }>(`/api/history?projectId=${encodeURIComponent(id)}&limit=20`, getToken)
    ]);
    setProject(projectData.project);
    setFiles(projectData.project.files || []);
    setSavedFiles(projectData.project.files || []);
    setActivePath(projectData.project.files?.[0]?.path ?? 'index.html');
    setGenerations(historyData.items);
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const loaded = await loadProjects();
        await loadBilling();
        if (cancelled) return;
        if (projectId) await openProject(projectId);
        else if (loaded[0]) navigate(`/app/${loaded[0].id}`, { replace: true });
      } catch (error) {
        if (!cancelled) showToast('error', error instanceof Error ? error.message : 'Failed to initialize builder');
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }
    initialize();
    return () => { cancelled = true; };
  }, [loadBilling, loadProjects, navigate, openProject, projectId, showToast]);

  function newProject() {
    setProject(null);
    setFiles([]);
    setSavedFiles([]);
    setGenerations([]);
    setPrompt('');
    setActivePath('index.html');
    navigate('/app');
  }

  async function generate() {
    setLoading(true);
    try {
      const data = await apiFetch<GenerationResponse>('/api/generate', getToken, {
        method: 'POST',
        body: JSON.stringify({ prompt, projectId: project?.id, currentFiles: files })
      });
      setProject(data.project);
      setFiles(data.project.files);
      setSavedFiles(data.project.files);
      setActivePath(data.project.files[0]?.path ?? 'index.html');
      setGenerations((items) => [data.generation, ...items]);
      setBilling(data.billing);
      setPrompt('');
      setProjects((items) => [data.project, ...items.filter((item) => item.id !== data.project.id)]);
      navigate(`/app/${data.project.id}`, { replace: true });
      showToast('success', project ? 'Changes applied and saved.' : 'Your project is ready.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function saveProject(): Promise<boolean> {
    if (!project) return false;
    setBusyAction('save');
    try {
      const data = await apiFetch<{ project: Project; generation: Generation }>('/api/save', getToken, {
        method: 'POST',
        body: JSON.stringify({ projectId: project.id, name: project.name, files })
      });
      setProject(data.project);
      setSavedFiles(data.project.files);
      setGenerations((items) => [data.generation, ...items]);
      setProjects((items) => items.map((item) => item.id === data.project.id ? data.project : item));
      showToast('success', 'Code changes saved.');
      return true;
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Save failed');
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function updateName(name: string) {
    if (!project) return;
    setProject({ ...project, name });
  }

  async function deployProject() {
    if (!project) return;
    if (dirty && !(await saveProject())) return;
    setBusyAction('deploy');
    try {
      const data = await apiFetch<{ url: string; project: Project }>('/api/deploy', getToken, {
        method: 'POST', body: JSON.stringify({ projectId: project.id })
      });
      setProject(data.project);
      setProjects((items) => items.map((item) => item.id === data.project.id ? data.project : item));
      showToast('success', `Deployed to ${data.url}`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Deployment failed');
    } finally {
      setBusyAction(null);
    }
  }

  async function exportGithub() {
    if (!project) return;
    if (dirty && !(await saveProject())) return;
    setBusyAction('github');
    try {
      const repoName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `builderkit-${project.id.slice(0, 8)}`;
      const data = await apiFetch<{ url: string; project: Project }>('/api/export-github', getToken, {
        method: 'POST', body: JSON.stringify({ projectId: project.id, repoName, isPrivate: true })
      });
      setProject(data.project);
      setProjects((items) => items.map((item) => item.id === data.project.id ? data.project : item));
      showToast('success', 'Exported to GitHub.');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'GitHub export failed');
    } finally {
      setBusyAction(null);
    }
  }

  if (initializing) {
    return <main className="loading-screen"><LoaderCircle className="spin" /> Loading workspace…</main>;
  }

  return (
    <main className="builder-page">
      <ProjectSidebar
        projects={projects}
        activeProjectId={project?.id ?? null}
        generations={generations}
        prompt={prompt}
        loading={loading}
        onPromptChange={setPrompt}
        onGenerate={generate}
        onNewProject={newProject}
        onSelectProject={(item) => navigate(`/app/${item.id}`)}
      />
      <section className="workspace">
        <BuilderTopbar
          project={project}
          billing={billing}
          dirty={dirty}
          busyAction={busyAction}
          onNameChange={updateName}
          onSave={saveProject}
          onDeploy={deployProject}
          onExport={exportGithub}
        />
        {billing?.enforcementEnabled && !billing.hasAccess && (
          <div className="access-banner"><AlertCircle size={17} /> Subscribe to Builder Pro to generate more apps.</div>
        )}
        <div className="split-view">
          <PreviewPane files={files} />
          <CodePanel files={files} activePath={activePath} onActivePathChange={setActivePath} onFilesChange={setFiles} />
        </div>
      </section>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </main>
  );
}
