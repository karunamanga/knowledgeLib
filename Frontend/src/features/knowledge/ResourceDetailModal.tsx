import React, { useState } from 'react';
import { Resource } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ResourceTypeBadge } from '../../components/common/Badge';
import { UserAvatar } from '../../components/common/UserAvatar';
import { knowledgeApi } from '../../api/endpoints';
import { getAccessToken, API_BASE_URL } from '../../api/client';
import {
  Download,
  ExternalLink,
  Calendar,
  Eye,
  Trash2,
  Tag,
  User,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Layers,
  Sparkles,
  File,
} from 'lucide-react';
import { renderAsync } from 'docx-preview';

interface WordDocumentViewerProps {
  resourceId: number;
  token?: string | null;
  filename: string;
  fileSize?: number;
  onDownload: () => void;
  isDownloading: boolean;
}

const WordDocumentViewer: React.FC<WordDocumentViewerProps> = ({
  resourceId,
  token,
  filename,
  fileSize,
  onDownload,
  isDownloading,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setRenderError(null);

    const downloadUrl = `${API_BASE_URL}/knowledge/${resourceId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    fetch(downloadUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(async (blob) => {
        if (!active || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        await renderAsync(blob, containerRef.current, undefined, {
          inWrapper: false,
          ignoreWidth: true,
          experimental: true,
          className: 'docx-preview-body',
        });
      })
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((err) => {
        if (active) {
          console.warn('docx-preview warning:', err);
          setRenderError(err.message || 'Preview generation failed');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [resourceId, token]);

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {filename}
            </p>
            <p className="text-[11px] text-slate-500">
              {fileSize ? `${(fileSize / 1024).toFixed(1)} KB • ` : ''}Microsoft Word Document
            </p>
          </div>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={onDownload}
          isLoading={isDownloading}
          leftIcon={<Download className="w-3.5 h-3.5" />}
        >
          Download File
        </Button>
      </div>

      {/* In-Browser Document Canvas */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Word Document Reader</span>
          <span className="text-[11px] text-indigo-600 font-medium">In-Browser Render</span>
        </div>
        <div className="p-6 max-h-[500px] overflow-y-auto text-slate-900 bg-white">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Rendering document layout & typography...</p>
            </div>
          )}

          {renderError && (
            <div className="text-center py-12 space-y-3">
              <p className="text-xs text-slate-500">
                Notice: Embedded preview could not render all formatting elements.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download Original .docx to View
              </Button>
            </div>
          )}

          <div
            ref={containerRef}
            className="docx-viewer-content prose prose-slate max-w-none text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};

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

  if (!resource) return null;

  const isAuthor = user?.id === resource.author_id;
  const canDelete = isAuthor || hasRole('ADMIN') || hasPermission('knowledge:delete');

  const token = getAccessToken();
  const directPublicUrl = resource.download_url || (resource.storage_key ? `${API_BASE_URL}/knowledge/files/${resource.storage_key}` : '');

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
    if (resource.external_url && !resource.storage_key) {
      window.open(resource.external_url, '_blank');
      return;
    }

    setIsDownloading(true);
    try {
      const downloadEndpoint = `${API_BASE_URL}/knowledge/${resource.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      const res = await fetch(downloadEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        // Fallback direct navigation
        window.open(downloadEndpoint, '_blank');
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = resource.original_filename || `${resource.title}.download`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      success('File downloaded successfully.', 'Download Complete');
    } catch (err: any) {
      // Fallback
      const token = getAccessToken();
      window.open(`${API_BASE_URL}/knowledge/${resource.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Extension helpers
  const filename = (resource.original_filename || resource.title || '').toLowerCase();
  const isPdf =
    resource.resource_type === 'PDF' ||
    resource.content_type?.includes('pdf') ||
    filename.endsWith('.pdf');

  const isImage =
    resource.resource_type === 'IMAGE' ||
    resource.content_type?.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(filename);

  const isVideo =
    resource.resource_type === 'VIDEO' ||
    resource.content_type?.startsWith('video/') ||
    /\.(mp4|webm|mov)$/i.test(filename);

  const isWordDoc =
    filename.endsWith('.doc') ||
    filename.endsWith('.docx') ||
    resource.content_type?.includes('word') ||
    resource.content_type?.includes('officedocument.wordprocessingml');

  const isSpreadsheet =
    filename.endsWith('.xls') ||
    filename.endsWith('.xlsx') ||
    filename.endsWith('.csv') ||
    resource.content_type?.includes('spreadsheet') ||
    resource.content_type?.includes('excel');

  const isPresentation =
    filename.endsWith('.ppt') ||
    filename.endsWith('.pptx') ||
    resource.resource_type === 'PRESENTATION' ||
    resource.content_type?.includes('presentation');

  const isLink = resource.resource_type === 'LINK' || Boolean(resource.external_url);

  // If download URL is a full public URL (like Supabase storage), Google Docs Viewer can render docs/sheets/presentations
  const isPublicUrl = Boolean(resource.download_url && resource.download_url.startsWith('http'));
  const canUseDocViewer = isPublicUrl && (isWordDoc || isSpreadsheet || isPresentation);

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
            {(resource.storage_key || resource.external_url) && (
              <Button
                variant="gradient"
                size="sm"
                onClick={handleDownload}
                isLoading={isDownloading}
                leftIcon={resource.storage_key ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
              >
                {resource.storage_key ? 'Download Resource' : 'Open Link'}
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
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

        {/* Resource Preview & Content Section */}
        <div className="space-y-3 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resource Preview & Content
          </h4>

          {/* 1. PDF Preview */}
          {resource.storage_key && isPdf ? (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
                <iframe
                  src={directPublicUrl}
                  title={resource.title}
                  className="w-full h-96 sm:h-[450px] border-0"
                />
              </div>
              <div className="flex justify-end gap-3">
                <a
                  href={directPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF in new tab</span>
                </a>
              </div>
            </div>
          ) : resource.storage_key && isImage ? (
            /* 2. Image Preview */
            <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <img
                src={directPublicUrl}
                alt={resource.title}
                className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : resource.storage_key && isVideo ? (
            /* 3. Video Preview */
            <div className="rounded-xl overflow-hidden bg-black border border-slate-800">
              <video controls className="w-full max-h-96">
                <source src={directPublicUrl} type={resource.content_type || 'video/mp4'} />
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          ) : resource.storage_key && isWordDoc ? (
            /* 4. In-Browser Microsoft Word Previewer */
            <WordDocumentViewer
              resourceId={resource.id}
              token={token}
              filename={resource.original_filename || resource.title}
              fileSize={resource.file_size}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          ) : canUseDocViewer ? (
            /* 5. Google Docs Embedded Viewer for Excel/PPT on public storage */
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.download_url!)}&embedded=true`}
                  title={resource.title}
                  className="w-full h-96 sm:h-[450px] border-0"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download {isSpreadsheet ? 'Spreadsheet' : 'Presentation'}
                </Button>
              </div>
            </div>
          ) : resource.storage_key ? (
            /* 5. Document / Office File Dedicated Asset Card */
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900/80 border border-indigo-100 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                    {isWordDoc ? (
                      <FileText className="w-8 h-8" />
                    ) : isSpreadsheet ? (
                      <FileSpreadsheet className="w-8 h-8" />
                    ) : isPresentation ? (
                      <Layers className="w-8 h-8" />
                    ) : (
                      <File className="w-8 h-8" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                      {resource.original_filename || resource.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {isWordDoc ? 'Microsoft Word Document' : isSpreadsheet ? 'Excel Spreadsheet' : isPresentation ? 'Presentation Deck' : 'Knowledge File'}
                      </span>
                      <span>•</span>
                      <span>{resource.file_size ? `${(resource.file_size / 1024).toFixed(1)} KB` : 'Attached Document'}</span>
                    </p>
                  </div>
                </div>

                <Button
                  variant="gradient"
                  size="md"
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="shadow-md shadow-indigo-500/20 shrink-0"
                >
                  Download File
                </Button>
              </div>

              <div className="pt-3 border-t border-indigo-100/80 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                <span>Direct binary download with zero-latency streaming.</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {resource.download_count} total downloads
                </span>
              </div>
            </div>
          ) : isLink ? (
            /* 6. External Link */
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  External Knowledge Reference
                </p>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 break-all">
                  {resource.external_url}
                </p>
              </div>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => window.open(resource.external_url, '_blank')}
                rightIcon={<ExternalLink className="w-4 h-4" />}
                className="shrink-0"
              >
                Visit Resource
              </Button>
            </div>
          ) : null}
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
              <UserAvatar name={resource.author?.full_name || 'Author'} avatarUrl={resource.author?.avatar_url} size="xs" />
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
              <Eye className="w-3.5 h-3.5" /> Views
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {resource.view_count} views
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
