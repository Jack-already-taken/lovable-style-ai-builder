import { useAuth } from '@clerk/react';
import { ArrowRight, Clock3, ExternalLink, GitBranch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { Project } from '../lib/types';

export function HistoryPage() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ projects: Project[] }>('/api/projects', getToken)
      .then((data) => setProjects(data.projects))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Failed to load projects'));
  }, [getToken]);

  return (
    <main className="page-container">
      <div className="page-heading">
        <div><p className="eyebrow">Project history</p><h1>Keep building where you left off.</h1></div>
        <Link className="button button-primary" to="/app">New project <ArrowRight size={17} /></Link>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="history-grid">
        {projects.map((project) => (
          <article className="history-card" key={project.id}>
            <div className="history-card-top"><span className="project-icon">{project.name.slice(0, 1).toUpperCase()}</span><span><Clock3 size={14} /> {new Date(project.updated_at).toLocaleString()}</span></div>
            <h2>{project.name}</h2>
            <p>{project.description || project.last_prompt || 'Generated web project'}</p>
            <div className="history-meta"><span>{project.files.length} files</span><span>{project.deployment_url ? 'Deployed' : 'Draft'}</span></div>
            <div className="history-actions">
              <Link className="button button-secondary" to={`/app/${project.id}`}>Open project</Link>
              {project.deployment_url && <a className="icon-button" href={project.deployment_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}
              {project.github_url && <a className="icon-button" href={project.github_url} target="_blank" rel="noreferrer"><GitBranch size={16} /></a>}
            </div>
          </article>
        ))}
      </div>
      {!projects.length && !error && <div className="empty-history"><h2>No projects yet</h2><p>Generate your first site in the builder.</p></div>}
    </main>
  );
}
