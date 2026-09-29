import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { submissionsApi } from '../../api/endpoints';
import { Send } from 'lucide-react';

interface SubmissionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubmissionCreateModal: React.FC<SubmissionCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      error('Please specify a title for the submission.', 'Validation');
      return;
    }

    setLoading(true);
    try {
      await submissionsApi.create({ title, description }, true);
      success('Work submitted for mentor code review!', 'Submitted');
      setTitle('');
      setDescription('');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      error('Failed to create submission.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Submission"
      description="Submit your assignment, project code, or architecture deck for mentor evaluation."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Submission Title *"
          placeholder="e.g. Capstone: FastAPI Modular Monolith Implementation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Description & Notes for Reviewer
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Links to branches, pull requests, key architectural decisions, test coverage..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            isLoading={loading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
