import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { learningApi, submissionsApi } from '../../api/endpoints';
import { LearningStatus } from '../../types';
import { Calendar, Plus, Send, CheckCircle2 } from 'lucide-react';

interface LearningEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LearningEntryModal: React.FC<LearningEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [learningDate, setLearningDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<LearningStatus>('COMPLETED');
  const [submitForReview, setSubmitForReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      error('Please fill in title and description.', 'Validation');
      return;
    }

    setLoading(true);
    try {
      const res = await learningApi.create({
        title,
        description,
        work_completed: workCompleted || undefined,
        learning_date: learningDate,
        status,
      });

      const newEntry = res.data.data;

      // If user checked "Submit for review"
      if (submitForReview) {
        await submissionsApi.create(
          {
            title: `Submission: ${title}`,
            description: `${description}\n\nWork done:\n${workCompleted || 'Completed exercises'}`,
            learning_entry_id: newEntry.id,
          },
          true
        );
        success('Learning entry recorded and sent to mentors for review!', 'Submission Created');
      } else {
        success("Today's learning entry recorded in journal!", 'Journal Updated');
      }

      // Reset
      setTitle('');
      setDescription('');
      setWorkCompleted('');
      setSubmitForReview(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      error('Failed to save learning journal entry.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Daily Learning Entry"
      description="Document your key learnings, completed exercises, and technical progress."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Learning Topic / Title *"
          placeholder="e.g. REST API Fundamentals & HTTP Idempotency"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Learning Date"
            type="date"
            value={learningDate}
            onChange={(e) => setLearningDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LearningStatus)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            What did you learn today? *
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Key concepts, architecture notes, HTTP status codes, security considerations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Work / Exercises Completed
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Built demo endpoint, implemented unit tests, created architecture slide deck..."
            value={workCompleted}
            onChange={(e) => setWorkCompleted(e.target.value)}
          />
        </div>

        {/* Submit to Mentor checkbox */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
          <input
            type="checkbox"
            id="submitForReviewCheck"
            checked={submitForReview}
            onChange={(e) => setSubmitForReview(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
          />
          <label htmlFor="submitForReviewCheck" className="text-xs cursor-pointer select-none">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200 block">
              Submit directly to Mentor for code review & feedback
            </span>
            <span className="text-indigo-700/80 dark:text-indigo-300/80">
              Your mentor will receive this submission in their review queue and provide structured feedback.
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            isLoading={loading}
            leftIcon={submitForReview ? <Send className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {submitForReview ? 'Save & Submit to Mentor' : 'Save Journal Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
