import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { ResourceTypeBadge } from '../../components/common/Badge';
import {
  ArrowLeft,
  FolderGit2,
  GitBranch,
  BookOpen,
  Network,
  Cpu,
  Layers,
  ExternalLink,
  Code2,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const projectId = Number(id);

  const { data, isLoading } = useQuery({
    queryKey: ['projectDetail', projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });

  const project = data?.data.data;

  if (isLoading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Project not found.</p>
        <Button size="sm" onClick={() => navigate('/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  const techBadges = project.technologies
    ? project.technologies.split(',').map((t) => t.trim())
    : [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Back button */}
      <button
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all projects
      </button>

      {/* Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Company Project
              </span>
              <span className="text-xs text-slate-400">
                Created on {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {project.name}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
              {project.description}
            </p>
          </div>

          {/* Quick Repository & Documentation Links */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-sm"
              >
                <GitBranch className="w-4 h-4" />
                <span>Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {project.documentation_url && (
              <a
                href={project.documentation_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Documentation</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        </div>

        {/* Tech Stack Badges */}
        {techBadges.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-500" /> Technologies & Frameworks
            </span>
            <div className="flex flex-wrap gap-2">
              {techBadges.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Problem Statement & Architecture Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {project.problem_statement && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Problem Statement
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {project.problem_statement}
            </p>
          </div>
        )}

        {project.architecture_summary && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Architecture Blueprint
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {project.architecture_summary}
            </p>
          </div>
        )}
      </div>

      {/* Associated Knowledge Resources */}
      {project.resources && project.resources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Associated Blueprints & Guides
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.resources.map((res) => (
              <div
                key={res.id}
                onClick={() => navigate(`/knowledge?selected=${res.id}`)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <ResourceTypeBadge type={res.resource_type} size="sm" />
                    {res.category && (
                      <span className="text-[10px] text-slate-400">{res.category.name}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{res.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
