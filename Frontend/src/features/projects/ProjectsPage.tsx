import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ProjectCreateModal } from './ProjectCreateModal';
import { FolderGit2, Search, Plus, ExternalLink, ArrowRight, GitBranch, Code2 } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();

  const canManage = hasRole('ADMIN') || hasRole('MENTOR') || hasPermission('project:manage');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projectsList', search],
    queryFn: () => projectsApi.list({ search: search || undefined, page_size: 20 }),
  });

  const projects = data?.data.data.items || [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Company Projects
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Internal products, services, repositories, and architectural blueprints across the organisation.
          </p>
        </div>

        {canManage && (
          <Button
            variant="gradient"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Project
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <Input
          placeholder="Search projects by name, technologies, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Grid of Projects */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No company projects found"
          description="Document a new project or service to share architectural insights with the team."
          actionText={canManage ? 'Add Project' : undefined}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const techList = project.technologies
              ? project.technologies.split(',').map((t) => t.trim())
              : [];

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Active Project
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tech Badges */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {techList.slice(0, 5).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                      {techList.length > 5 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{techList.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    By {project.creator?.full_name || 'Engineering Lead'}
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Explore Architecture <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ProjectCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
