import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { projectsApi } from '../../api/endpoints';
import { FolderGit2, Plus, Link as LinkIcon, Code2 } from 'lucide-react';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [architectureSummary, setArchitectureSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      error('Please fill in project name and description.', 'Validation');
      return;
    }

    setLoading(true);
    try {
      await projectsApi.create({
        name,
        problem_statement: problemStatement || undefined,
        description,
        technologies: technologies || undefined,
        repository_url: repositoryUrl || undefined,
        documentation_url: documentationUrl || undefined,
        architecture_summary: architectureSummary || undefined,
      });

      success('Company project added to portal knowledge base!', 'Project Created');
      setName('');
      setDescription('');
      setProblemStatement('');
      setTechnologies('');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      error('Failed to create project.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Company Project"
      description="Document an internal system, service architecture, or engineering project."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Project Name *"
          placeholder="e.g. Expense & Reimbursement Reconciliation Engine"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Problem Statement
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="What business or technical problem does this project solve?"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Description & Core Features *
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Overview of capabilities, workflows, APIs, and key features..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <Input
          label="Technology Stack (Comma-separated)"
          placeholder="Python, FastAPI, PostgreSQL, React, TypeScript, Docker"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
          leftIcon={<Code2 className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Repository URL"
            placeholder="https://github.com/company/..."
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            leftIcon={<LinkIcon className="w-4 h-4" />}
          />

          <Input
            label="Documentation URL"
            placeholder="https://docs.company.internal/..."
            value={documentationUrl}
            onChange={(e) => setDocumentationUrl(e.target.value)}
            leftIcon={<LinkIcon className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Architecture Summary
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Layering, queues, databases, authentication, background workers..."
            value={architectureSummary}
            onChange={(e) => setArchitectureSummary(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={loading} leftIcon={<Plus className="w-4 h-4" />}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
