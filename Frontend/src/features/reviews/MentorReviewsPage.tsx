import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../../api/endpoints';
import { Submission, SubmissionStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { SubmissionStatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const MentorReviewsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | ''>('');
  const [activeReviewSubmission, setActiveReviewSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [reviewAction, setReviewAction] = useState<SubmissionStatus>('APPROVED');

  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mentorReviewsList', search, selectedStatus],
    queryFn: () =>
      reviewsApi.listPending({
        search: search || undefined,
        status: selectedStatus ? (selectedStatus as SubmissionStatus) : undefined,
        page_size: 25,
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, feedback }: { id: number; status: SubmissionStatus; feedback: string }) =>
      reviewsApi.review(id, { status, feedback }),
    onSuccess: (_, vars) => {
      success(
        `Submission ${vars.status === 'APPROVED' ? 'approved' : 'reviewed'} with feedback!`,
        'Review Completed'
      );
      setActiveReviewSubmission(null);
      setFeedback('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: () => {
      error('Failed to submit review.', 'Error');
    },
  });

  const submissions = data?.data.data.items || [];

  const handleOpenReview = (sub: Submission) => {
    setActiveReviewSubmission(sub);
    setFeedback(sub.feedback || '');
    setReviewAction('APPROVED');
  };

  const handleExecuteReview = (statusToApply: SubmissionStatus) => {
    if (!activeReviewSubmission) return;
    if (!feedback.trim()) {
      error('Please write mentor feedback before completing the review.', 'Validation');
      return;
    }

    reviewMutation.mutate({
      id: activeReviewSubmission.id,
      status: statusToApply,
      feedback: feedback.trim(),
    });
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mentor Review Dashboard
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Review employee exercises, code milestones, evaluate submissions, and guide professional growth.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search pending reviews by employee name or topic..."
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
          <option value="">All Review Queue</option>
          <option value="SUBMITTED">Needs Review (Submitted)</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Needs Changes</option>
          <option value="RESUBMITTED">Resubmitted</option>
        </select>
      </div>

      {/* Review Queue Cards */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="Review queue is clear"
          description="There are currently no employee submissions awaiting review."
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SubmissionStatusBadge status={sub.status} size="sm" />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {sub.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {sub.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      sub.user?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        sub.user?.full_name || 'User'
                      )}&background=6366f1&color=fff`
                    }
                    alt={sub.user?.full_name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {sub.user?.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {sub.user?.designation || 'Software Engineer'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => handleOpenReview(sub)}
                  leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
                >
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog Modal */}
      {activeReviewSubmission && (
        <Modal
          isOpen={!!activeReviewSubmission}
          onClose={() => setActiveReviewSubmission(null)}
          title={`Review Submission: ${activeReviewSubmission.title}`}
          description={`Submitted by ${activeReviewSubmission.user?.full_name} on ${new Date(
            activeReviewSubmission.created_at
          ).toLocaleDateString()}`}
          size="lg"
        >
          <div className="space-y-5 text-left">
            {/* Submission Content Review */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Employee Notes & Deliverables:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {activeReviewSubmission.description || 'No notes provided.'}
              </p>
            </div>

            {/* Feedback Editor */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mentor Feedback & Recommendations *
              </label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
                placeholder="Write actionable code review feedback, praise strong patterns, and recommend next steps..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExecuteReview('UNDER_REVIEW')}
                isLoading={reviewMutation.isPending}
                leftIcon={<Clock className="w-3.5 h-3.5" />}
              >
                Mark Under Review
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleExecuteReview('REJECTED')}
                  isLoading={reviewMutation.isPending}
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Request Changes
                </Button>

                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => handleExecuteReview('APPROVED')}
                  isLoading={reviewMutation.isPending}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Submission
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
