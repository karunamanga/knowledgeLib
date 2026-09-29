import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, knowledgeApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { ResourceTypeBadge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { UserAvatar } from '../../components/common/UserAvatar';
import { ResourceUploadModal } from '../knowledge/ResourceUploadModal';
import { ResourceDetailModal } from '../knowledge/ResourceDetailModal';
import { Resource } from '../../types';
import {
  Sparkles,
  UploadCloud,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FolderGit2,
  Calendar,
  AlertCircle,
  Eye,
  Download,
  Plus,
  User,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => dashboardApi.getSummary(),
  });

  const { data: knowledgeData, refetch: refetchKnowledge } = useQuery({
    queryKey: ['recentKnowledgeList'],
    queryFn: () => knowledgeApi.list({ page: 1, page_size: 6 }),
  });

  const summary = data?.data.data;
  const recentResources = knowledgeData?.data.data.items || summary?.recent_resources || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Mentor Review Alert Banner (if any pending) */}
      {summary && summary.pending_reviews_count > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                You have {summary.pending_reviews_count} submission{summary.pending_reviews_count > 1 ? 's' : ''} awaiting mentor review
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Review employee submissions and provide constructive feedback.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/reviews')}
            className="shrink-0 border-amber-300 dark:border-amber-700 bg-white/50 dark:bg-slate-900/50"
          >
            Review Queue
          </Button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10 border border-indigo-700/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-indigo-200 border border-white/10">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Organisation Learning Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.full_name || 'Team Member'}.
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 font-light leading-relaxed">
              Explore your company's knowledge base, access architectural designs, share new documentation, and manage your learning profile.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="gradient"
              size="sm"
              onClick={() => navigate('/knowledge')}
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              Explore Knowledge Library
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload Resource
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              leftIcon={<User className="w-4 h-4" />}
            >
              My Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Key Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Resources</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary?.total_org_resources || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Resources Explored</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary?.resources_explored || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Journal Entries</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary?.total_learning_entries || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Learning Progress</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary?.learning_progress_pct || 0}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Section: Recent Knowledge Resources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Knowledge Resources
            </h3>
          </div>
          <button
            onClick={() => navigate('/knowledge')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Explore all knowledge <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentResources.map((res) => (
              <div
                key={res.id}
                onClick={() => setSelectedResource(res)}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <ResourceTypeBadge type={res.resource_type} size="sm" />
                    {res.category && (
                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                        {res.category.name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {res.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <UserAvatar name={res.author?.full_name || 'Author'} avatarUrl={res.author?.avatar_url} size="xs" />
                    <span className="truncate max-w-[90px]">{res.author?.full_name || 'Team'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {res.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> {res.download_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No knowledge resources uploaded yet
              </h4>
              <p className="text-xs text-slate-500">
                Be the first to share documentation, architecture blueprints, or guides with your team.
              </p>
            </div>
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setUploadModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload First Resource
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ResourceUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          refetch();
          refetchKnowledge();
        }}
        onSuccess={() => {
          refetch();
          refetchKnowledge();
        }}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        onDeleted={() => {
          setSelectedResource(null);
          refetch();
          refetchKnowledge();
        }}
      />
    </div>
  );
};
