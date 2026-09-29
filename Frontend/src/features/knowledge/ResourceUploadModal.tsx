import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { categoriesApi, knowledgeApi } from '../../api/endpoints';
import { ResourceType } from '../../types';
import { UploadCloud, Link as LinkIcon, FileText, Plus } from 'lucide-react';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('DOCUMENT');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const { data: categoriesData } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => categoriesApi.listCategories(),
    enabled: isOpen,
  });

  const categories = categoriesData?.data.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      error('Please specify a title for the resource.', 'Validation');
      return;
    }

    setLoading(true);
    try {
      const tagList = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('resource_type', resourceType);
      if (categoryId) formData.append('category_id', String(categoryId));
      if (externalUrl) formData.append('external_url', externalUrl);
      if (tagList.length > 0) formData.append('tags', JSON.stringify(tagList));
      if (selectedFile) formData.append('file', selectedFile);

      await knowledgeApi.upload(formData);
      success('Resource uploaded to company knowledge base!', 'Success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setExternalUrl('');
      setTagsInput('');
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
      description="Contribute documentation, architecture blueprints, guides, or presentations."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
            placeholder="Briefly explain what this resource covers and who should read it..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Resource Type
            </label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as ResourceType)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="DOCUMENT">Document</option>
              <option value="PRESENTATION">Presentation (Deck)</option>
              <option value="PDF">PDF Guide</option>
              <option value="ARCHITECTURE">Architecture Blueprint</option>
              <option value="DIAGRAM">System Diagram</option>
              <option value="VIDEO">Video Tutorial</option>
              <option value="LINK">External Documentation Link</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

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
        </div>

        {/* File Picker or Link input */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Attach Document / Asset
          </label>
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
            <label className="flex flex-col items-center gap-1.5 cursor-pointer text-center">
              <UploadCloud className="w-7 h-7 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to browse files (PDF, PPT, DOC, Image)'}
              </span>
              <span className="text-[10px] text-slate-400">
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : 'Up to 50MB file size'}
              </span>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <Input
          label="External URL / Reference Link (Optional)"
          placeholder="https://docs.company.internal/..."
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          leftIcon={<LinkIcon className="w-4 h-4" />}
        />

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
