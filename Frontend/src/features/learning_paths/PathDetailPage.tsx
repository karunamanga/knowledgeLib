import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { ResourceTypeBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Compass,
  FileText,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';

export const PathDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success } = useToast();

  const pathId = Number(id);

  const { data, isLoading } = useQuery({
    queryKey: ['learningPathDetail', pathId],
    queryFn: () => learningPathsApi.get(pathId),
    enabled: !!pathId,
  });

  const toggleMutation = useMutation({
    mutationFn: (moduleId: number) => learningPathsApi.toggleModuleProgress(moduleId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['learningPathDetail', pathId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      if (res.data.data.is_completed) {
        success('Milestone marked as completed!', 'Progress Updated');
      }
    },
  });

  const path = data?.data.data;

  if (isLoading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Learning path not found.</p>
        <Button size="sm" onClick={() => navigate('/learning-paths')} className="mt-4">
          Back to Learning Paths
        </Button>
      </div>
    );
  }

  const completedModules = path.modules?.filter((m) => m.is_completed).length || 0;
  const totalModules = path.modules?.length || 0;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Back button */}
      <button
        onClick={() => navigate('/learning-paths')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all roadmaps
      </button>

      {/* Path Header Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {path.level} Level
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {path.estimated_hours} Hours estimated
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {path.title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
              {path.description || 'Follow this curriculum step-by-step to master the engineering domain.'}
            </p>
          </div>

          {/* Progress Indicator Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 min-w-[200px] shrink-0 text-center space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {path.user_progress_percentage}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${path.user_progress_percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {completedModules} of {totalModules} milestones completed
            </p>
          </div>
        </div>
      </div>

      {/* Sequential Milestone Modules Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Curriculum Milestones ({totalModules})
          </h3>
        </div>

        <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {path.modules?.map((module, index) => (
            <div
              key={module.id}
              className={`relative pl-14 p-5 rounded-2xl border transition-all ${
                module.is_completed
                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-800/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {/* Checkmark circle trigger on timeline */}
              <button
                onClick={() => toggleMutation.mutate(module.id)}
                disabled={toggleMutation.isPending}
                className={`absolute left-4 top-5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  module.is_completed
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-500'
                }`}
                title={module.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                <Check className="w-3.5 h-3.5" />
              </button>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {module.title}
                  </h4>
                  <Button
                    size="sm"
                    variant={module.is_completed ? 'secondary' : 'outline'}
                    onClick={() => toggleMutation.mutate(module.id)}
                    leftIcon={module.is_completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5" />}
                  >
                    {module.is_completed ? 'Completed' : 'Mark Completed'}
                  </Button>
                </div>

                {module.description && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {module.description}
                  </p>
                )}

                {/* Linked Module Resources */}
                {module.resources && module.resources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Recommended Materials & Blueprints
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {module.resources.map((mr) => (
                        <div
                          key={mr.id}
                          onClick={() => {
                            if (mr.resource) {
                              navigate(`/knowledge?selected=${mr.resource.id}`);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {mr.resource && (
                              <ResourceTypeBadge type={mr.resource.resource_type} size="sm" />
                            )}
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                              {mr.resource?.title || 'Resource'}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
