import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { categoriesApi, knowledgeApi } from '../../api/endpoints';
import { ResourceType } from '../../types';
import { UploadCloud, FileText, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [detectedType, setDetectedType] = useState<ResourceType>('DOCUMENT');
  const [detectedExtension, setDetectedExtension] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const { data: categoriesData } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => categoriesApi.listCategories(),
    enabled: isOpen,
  });

  const categories = categoriesData?.data.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = (file.name.split('.').pop() || '').toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`Unsupported format .${ext}. Only PDF, DOC, DOCX, PPT, and PPTX are supported.`);
        setSelectedFile(null);
        setDetectedExtension('');
        return;
      }

      setSelectedFile(file);
      setDetectedExtension(ext.toUpperCase());

      // Auto-detect resource type
      if (ext === 'pdf') {
        setDetectedType('PDF');
      } else if (ext === 'ppt' || ext === 'pptx') {
        setDetectedType('PRESENTATION');
      } else {
        setDetectedType('DOCUMENT');
      }

      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Please specify a title for the resource.', 'Validation');
      return;
    }

    if (!selectedFile) {
      error('Please select a document file (PDF, DOC, DOCX, PPT, or PPTX).', 'Validation');
      return;
    }

    setLoading(true);
    try {
      const tagList = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('resource_type', detectedType);
      if (categoryId) formData.append('category_id', String(categoryId));
      if (tagList.length > 0) formData.append('tags', JSON.stringify(tagList));
      formData.append('file', selectedFile);

      await knowledgeApi.upload(formData);
      success('Resource uploaded to company knowledge base!', 'Success');

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setDetectedExtension('');
      setTagsInput('');
      setCategoryId(undefined);
      setFileError(null);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload resource. Please check inputs.';
      error(msg, 'Upload Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Knowledge Resource"
      description="Upload architectural documents, technical guides, or presentations (PDF, DOC, DOCX, PPT, PPTX)."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Document File Dropzone */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Document File * (PDF, DOC, DOCX, PPT, PPTX)
          </label>
          <div
            className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl transition-all ${
              fileError
                ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                : selectedFile
                ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
          >
            <label className="flex flex-col items-center gap-2 cursor-pointer text-center w-full">
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Auto-detected: {detectedExtension} ({detectedType})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 underline mt-1">
                    Click to replace file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Choose a document to upload
                  </span>
                  <span className="text-xs text-slate-400">
                    Supports PDF, DOC, DOCX, PPT, PPTX (Up to 50MB)
                  </span>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {fileError && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {fileError}
            </p>
          )}
        </div>

        <Input
          label="Resource Title *"
          placeholder="e.g. Distributed Caching Patterns with Redis"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Description & Key Takeaways
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Briefly explain what this document covers and who should read it..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Detected File Type
            </label>
            <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
              {detectedExtension ? `${detectedExtension} • ${detectedType}` : 'Auto-detected upon file selection'}
            </div>
          </div>
        </div>

        <Input
          label="Tags (Comma-separated)"
          placeholder="fastapi, postgresql, microservices, security"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={loading} leftIcon={<Plus className="w-4 h-4" />}>
            Publish Resource
          </Button>
        </div>
      </form>
    </Modal>
  );
};
