import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningPathsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { PathCreateModal } from './PathCreateModal';
import { Compass, Search, Plus, Clock, ArrowRight, Layers, Award } from 'lucide-react';

export const LearningPathsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();

  const canManage = hasRole('ADMIN') || hasRole('MENTOR') || hasPermission('path:manage');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['learningPathsList', search, selectedLevel],
    queryFn: () =>
      learningPathsApi.list({
        search: search || undefined,
        level: selectedLevel || undefined,
        page_size: 20,
      }),
  });

  const paths = data?.data.data.items || [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Learning Roadmaps
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Structured competency paths designed by tech leads and architects for team onboarding and continuous growth.
          </p>
        </div>

        {canManage && (
          <Button
            variant="gradient"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Learning Path
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search roadmaps by technology, title, or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Difficulty Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Grid of Learning Paths */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : paths.length === 0 ? (
        <EmptyState
          title="No learning paths found"
          description="Try modifying your search filter or publish a new roadmap."
          actionText={canManage ? 'Create Roadmap' : undefined}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <div
              key={path.id}
              onClick={() => navigate(`/learning-paths/${path.id}`)}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${
                      path.level === 'Advanced'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : path.level === 'Intermediate'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {path.level}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {path.estimated_hours} Hours
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {path.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {path.description || 'Structured enterprise engineering curriculum.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {path.modules_count} Milestones
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {path.user_progress_percentage}% completed
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${path.user_progress_percentage}%` }}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    {path.user_progress_percentage > 0 ? 'Continue Roadmap' : 'Start Roadmap'}{' '}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <PathCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
