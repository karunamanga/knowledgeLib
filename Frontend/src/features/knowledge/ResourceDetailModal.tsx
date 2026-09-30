import React, { useState, useEffect } from 'react';
import { Resource } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ResourceTypeBadge } from '../../components/common/Badge';
import { UserAvatar } from '../../components/common/UserAvatar';
import { knowledgeApi } from '../../api/endpoints';
import { getAccessToken, getFullApiUrl } from '../../api/client';
import {
  Download,
  Calendar,
  Eye,
  Trash2,
  Tag,
  User,
  FileText,
  HardDrive,
  ExternalLink,
} from 'lucide-react';

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { user, hasRole, hasPermission } = useAuth();
  const { success, error } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [resource?.id]);

  if (!resource) return null;

  const isAuthor = user?.id === resource.author_id;
  const canDelete = isAuthor || hasRole('ADMIN') || hasPermission('knowledge:delete');
  const token = getAccessToken();

  const previewImageUrl = getFullApiUrl(
    `/api/v1/knowledge/${resource.id}/preview`
  );

  const downloadEndpoint = getFullApiUrl(
    `/api/v1/knowledge/${resource.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`
  );

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      return;
    }

    try {
      await knowledgeApi.delete(resource.id);
      success('Resource removed from knowledge library.', 'Deleted');
      onClose();
      if (onDeleted) onDeleted();
    } catch {
      error('Failed to delete resource. Please check permissions.', 'Error');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(downloadEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        window.open(downloadEndpoint, '_blank');
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const downloadFilename =
        resource.file_name ||
        resource.original_filename ||
        `${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${(resource.file_type || 'pdf').toLowerCase()}`;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      success('File downloaded successfully.', 'Download Complete');
    } catch {
      window.open(downloadEndpoint, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const fileExt = (
    resource.file_name ||
    resource.original_filename ||
    resource.title ||
    ''
  ).split('.').pop()?.toLowerCase() || '';

  const isPdf =
    fileExt === 'pdf' ||
    resource.file_type?.toLowerCase() === 'pdf' ||
    resource.resource_type === 'PDF' ||
    resource.mime_type?.includes('pdf');

  const isWordDoc =
    fileExt === 'doc' ||
    fileExt === 'docx' ||
    resource.file_type?.toLowerCase().includes('doc') ||
    resource.mime_type?.includes('word') ||
    resource.mime_type?.includes('officedocument.wordprocessingml');

  const displayFileType = (
    resource.file_type ||
    fileExt ||
    resource.resource_type ||
    'Document'
  ).toUpperCase();

  const fileSizeText = resource.file_size
    ? `${(resource.file_size / 1024).toFixed(1)} KB`
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" hideCloseButton={false}>
      <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
        {/* Top Badges & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ResourceTypeBadge type={resource.resource_type} />
            {resource.category && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {resource.category.name}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
              {displayFileType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            )}
            <Button
              variant="gradient"
              size="sm"
              onClick={handleDownload}
              isLoading={isDownloading}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Resource
            </Button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {resource.title}
          </h2>
          {resource.description && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {resource.description}
            </div>
          )}
        </div>

        {/* Resource Preview Section */}
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Document Preview
            </h4>
            <span className="text-[11px] font-medium text-slate-400">
              {displayFileType} Preview
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
            {!imageError ? (
              <div className="flex items-center justify-center w-full">
                <img
                  src={previewImageUrl}
                  alt={resource.title}
                  className="max-h-[600px] w-auto max-w-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/80 object-contain bg-white transition-opacity duration-300"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Preview unavailable
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  You can download the original document to view all contents and full formatting.
                </p>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Resource
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags & Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author & File Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="space-y-1 text-left">
            <span className="text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Author
            </span>
            <div className="flex items-center gap-1.5">
              <UserAvatar
                name={resource.author?.full_name || 'Author'}
                avatarUrl={resource.author?.avatar_url}
                size="xs"
              />
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {resource.author?.full_name || 'Anonymous'}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Published
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {new Date(resource.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-1 text-left">
            <span className="text-slate-400 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> File Size
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {fileSizeText || 'Attached Document'}
            </p>
          </div>

          <div className="space-y-1 text-left">
            <span className="text-slate-400 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Downloads
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {resource.download_count} times
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
