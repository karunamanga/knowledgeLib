import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SubmissionStatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { SubmissionCreateModal } from './SubmissionCreateModal';
import { SubmissionStatus } from '../../types';
import {
  Send,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const SubmissionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['submissionsList', search, selectedStatus],
    queryFn: () =>
      submissionsApi.list({
        search: search || undefined,
        status: selectedStatus ? (selectedStatus as SubmissionStatus) : undefined,
        page_size: 20,
      }),
  });

  const resubmitMutation = useMutation({
    mutationFn: (id: number) => submissionsApi.submit(id),
    onSuccess: () => {
      success('Submission updated and resubmitted to mentors!', 'Resubmitted');
      refetch();
    },
    onError: () => {
      error('Failed to resubmit work.', 'Error');
    },
  });

  const submissions = data?.data.data.items || [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Send className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Submissions & Mentor Reviews
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track evaluation status, mentor feedback, and milestone approvals for your exercises and deliverables.
          </p>
        </div>

        <Button
          variant="gradient"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Submission
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search submissions by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as SubmissionStatus | '')}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Needs Changes</option>
          <option value="RESUBMITTED">Resubmitted</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Submissions List with Timeline & Feedback Cards */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description="Submit completed exercises or milestones to receive mentor evaluation."
          actionText="Create Submission"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SubmissionStatusBadge status={sub.status} />
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{' '}
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {sub.title}
                  </h3>
                </div>

                {/* Resubmit button if rejected or draft */}
                {(sub.status === 'REJECTED' || sub.status === 'DRAFT') && (
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => resubmitMutation.mutate(sub.id)}
                    isLoading={resubmitMutation.isPending}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Resubmit for Review
                  </Button>
                )}
              </div>

              {/* Description */}
              {sub.description && (
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {sub.description}
                </div>
              )}

              {/* Mentor Feedback Highlight Box */}
              {sub.feedback && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    sub.status === 'APPROVED'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                      : sub.status === 'REJECTED'
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100'
                      : 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> Mentor Feedback
                    </span>
                    {sub.reviewer && (
                      <span className="font-normal opacity-80">
                        Reviewed by {sub.reviewer.full_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {sub.feedback}
                  </p>
                </div>
              )}

              {/* Submission Lifecycle Status Timeline Progress Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium text-slate-400">
                  <div
                    className={`py-1 rounded-lg ${
                      ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMITTED'].includes(
                        sub.status
                      )
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    1. Submitted
                  </div>
                  <div
                    className={`py-1 rounded-lg ${
                      ['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(sub.status)
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    2. In Review
                  </div>
                  <div
                    className={`py-1 rounded-lg ${
                      sub.status === 'APPROVED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                        : sub.status === 'REJECTED'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    3. {sub.status === 'REJECTED' ? 'Changes Needed' : 'Approved'}
                  </div>
                  <div
                    className={`py-1 rounded-lg ${
                      sub.status === 'APPROVED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    4. Milestone Done
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <SubmissionCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
