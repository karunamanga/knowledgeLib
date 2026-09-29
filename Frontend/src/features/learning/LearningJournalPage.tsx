import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningApi, submissionsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LearningStatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { LearningEntryModal } from './LearningEntryModal';
import {
  CalendarCheck,
  Search,
  Plus,
  Send,
  Calendar,
  Trash2,
  CheckCircle2,
  FileText,
  User,
} from 'lucide-react';

export const LearningJournalPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { user, hasRole } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const isMentorOrAdmin = hasRole('ADMIN') || hasRole('MENTOR');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['learningEntriesList', search, showAllUsers],
    queryFn: () =>
      learningApi.list({
        search: search || undefined,
        all_users: showAllUsers,
        page_size: 30,
      }),
  });

  const submitMutation = useMutation({
    mutationFn: (entry: any) =>
      submissionsApi.create(
        {
          title: `Submission: ${entry.title}`,
          description: `${entry.description}\n\nWork done:\n${entry.work_completed || ''}`,
          learning_entry_id: entry.id,
        },
        true
      ),
    onSuccess: () => {
      success('Learning entry submitted to mentors for review!', 'Submission Created');
      queryClient.invalidateQueries({ queryKey: ['submissionsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: () => {
      error('Could not create submission.', 'Error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => learningApi.delete(id),
    onSuccess: () => {
      success('Journal entry deleted.', 'Deleted');
      refetch();
    },
  });

  const entries = data?.data.data.items || [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Daily Learning Journal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Keep track of your day-to-day progress, technical discoveries, and submit deliverables for mentor feedback.
          </p>
        </div>

        <Button
          variant="gradient"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Today's Learning
        </Button>
      </div>

      {/* Filter and Scope Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search entries by topic or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {isMentorOrAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <button
              onClick={() => setShowAllUsers(false)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                !showAllUsers
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              My Journal
            </button>
            <button
              onClick={() => setShowAllUsers(true)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                showAllUsers
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Team Members
            </button>
          </div>
        )}
      </div>

      {/* Journal Timeline List */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No learning entries recorded yet"
          description="Start documenting what you learned today to build your engineering portfolio."
          actionText="Add First Entry"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isOwner = user?.id === entry.user_id;

            return (
              <div
                key={entry.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.learning_date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <LearningStatusBadge status={entry.status} size="sm" />
                    {showAllUsers && entry.user && (
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" /> {entry.user.full_name}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => submitMutation.mutate(entry)}
                        isLoading={submitMutation.isPending}
                        leftIcon={<Send className="w-3.5 h-3.5 text-indigo-500" />}
                      >
                        Submit to Mentor
                      </Button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this journal entry?')) {
                            deleteMutation.mutate(entry.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {entry.title}
                  </h3>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Today I Learned:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {entry.description}
                    </p>
                  </div>

                  {entry.work_completed && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Work / Deliverables Completed:
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {entry.work_completed}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <LearningEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
