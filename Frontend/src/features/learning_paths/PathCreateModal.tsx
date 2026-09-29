import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { learningPathsApi } from '../../api/endpoints';
import { Plus, Trash2, Layers } from 'lucide-react';

interface PathCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ModuleInput {
  title: string;
  description: string;
}

export const PathCreateModal: React.FC<PathCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [modules, setModules] = useState<ModuleInput[]>([
    { title: '1. Fundamentals & Core Concepts', description: '' },
    { title: '2. Deep Dive & Patterns', description: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const handleAddModule = () => {
    setModules((prev) => [
      ...prev,
      { title: `${prev.length + 1}. New Milestone`, description: '' },
    ]);
  };

  const handleRemoveModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModuleChange = (index: number, field: keyof ModuleInput, value: string) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      error('Please provide a roadmap title.', 'Validation');
      return;
    }

    setLoading(true);
    try {
      await learningPathsApi.create({
        title,
        description,
        level,
        estimated_hours: Number(estimatedHours),
        is_published: true,
        modules: modules.map((m, idx) => ({
          title: m.title,
          description: m.description,
          order_index: idx,
          resource_ids: [],
        })),
      });

      success('New learning roadmap published!', 'Success');
      setTitle('');
      setDescription('');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      error('Failed to create learning path.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Structured Learning Path"
      description="Design a guided learning curriculum with sequential milestone modules."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        <Input
          label="Roadmap Title *"
          placeholder="e.g. Full-Stack Python & React Engineer Roadmap"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Roadmap Overview
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="What will engineers achieve by completing this learning path?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Proficiency Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Beginner">Beginner (Foundations)</option>
              <option value="Intermediate">Intermediate (Practitioner)</option>
              <option value="Advanced">Advanced (Architect / Staff)</option>
            </select>
          </div>

          <Input
            label="Estimated Total Hours"
            type="number"
            min={1}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
          />
        </div>

        {/* Modules Builder */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" /> Roadmap Modules / Milestones ({modules.length})
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddModule}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Module
            </Button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {modules.map((mod, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => handleModuleChange(idx, 'title', e.target.value)}
                    placeholder={`Module ${idx + 1} Title`}
                    className="w-full font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={mod.description}
                  onChange={(e) => handleModuleChange(idx, 'description', e.target.value)}
                  placeholder="Module objectives, topics and exercises..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={loading}>
            Publish Roadmap
          </Button>
        </div>
      </form>
    </Modal>
  );
};
