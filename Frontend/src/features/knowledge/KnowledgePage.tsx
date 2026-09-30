import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi, categoriesApi } from '../../api/endpoints';
import { Resource, ResourceType } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ResourceTypeBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ResourceDetailModal } from './ResourceDetailModal';
import { ResourceUploadModal } from './ResourceUploadModal';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAccessToken, getFullApiUrl } from '../../api/client';
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Download,
  Eye,
  Calendar,
  BookOpen,
  Tag as TagIcon,
  Trash2,
  FileText,
} from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole, hasPermission } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<ResourceType | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle URL param selection for direct navigation
  const selectedParam = routeId || searchParams.get('selected');

  // Query single resource if routeId/selectedParam provided
  const { data: directResourceData } = useQuery({
    queryKey: ['singleResource', selectedParam],
    queryFn: () => knowledgeApi.get(Number(selectedParam)),
    enabled: !!selectedParam,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => categoriesApi.listCategories(),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tagsList'],
    queryFn: () => categoriesApi.listTags(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'knowledgeList',
      debouncedSearch,
      selectedCategory,
      selectedType,
      selectedTag,
      sortBy,
      sortOrder,
      page,
    ],
    queryFn: () =>
      knowledgeApi.list({
        search: debouncedSearch || undefined,
        category_id: selectedCategory,
        resource_type: selectedType,
        tag: selectedTag,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 18,
      }),
  });

  const resources = data?.data.data.items || [];
  const totalItems = data?.data.data.total || 0;
  const totalPages = data?.data.data.total_pages || 1;
  const categories = categoriesData?.data.data || [];
  const tags = tagsData?.data.data || [];

  useEffect(() => {
    if (directResourceData?.data.data) {
      setSelectedResource(directResourceData.data.data);
    } else if (selectedParam && resources.length > 0) {
      const found = resources.find((r) => r.id === Number(selectedParam));
      if (found) setSelectedResource(found);
    }
  }, [selectedParam, resources, directResourceData]);

  const canDeleteResource = (res: Resource) =>
    user?.id === res.author_id || hasRole('ADMIN') || hasPermission('knowledge:delete');

  const handleDirectDownload = async (res: Resource, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getAccessToken();
      const downloadUrl = getFullApiUrl(
        `/api/v1/knowledge/${res.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`
      );
      const response = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        window.open(downloadUrl, '_blank');
        return;
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const downloadFilename =
        res.file_name ||
        res.original_filename ||
        `${res.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${(res.file_type || 'pdf').toLowerCase()}`;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download completed successfully.', 'Download');
      queryClient.invalidateQueries({ queryKey: ['knowledgeList'] });
    } catch {
      window.open(
        getFullApiUrl(`/api/v1/knowledge/${res.id}/download`),
        '_blank'
      );
    }
  };

  const handleDirectDelete = async (res: Resource, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${res.title}"?`)) return;
    try {
      await knowledgeApi.delete(res.id);
      toast.success('Resource removed from knowledge library.', 'Deleted');
      queryClient.invalidateQueries({ queryKey: ['knowledgeList'] });
      refetch();
    } catch {
      toast.error('Failed to delete resource.', 'Error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Knowledge Library
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Search, discover and contribute to the organisation's engineering and product blueprints.
          </p>
        </div>

        <Button
          variant="gradient"
          onClick={() => setUploadModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Upload Knowledge
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by title, description, keywords, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={selectedType || ''}
              onChange={(e) =>
                setSelectedType(e.target.value ? (e.target.value as ResourceType) : undefined)
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Document Types</option>
              <option value="DOCUMENT">Documents (DOC/DOCX)</option>
              <option value="PDF">PDF Guides</option>
              <option value="PRESENTATION">Presentations (PPT/PPTX)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="created_at">Most Recent</option>
              <option value="views">Most Viewed</option>
              <option value="downloads">Most Downloaded</option>
              <option value="title">Title (A-Z)</option>
            </select>

            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              selectedCategory === undefined
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id === selectedCategory ? undefined : c.id)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Selected Tag Indicator */}
        {selectedTag && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" /> Filtered by tag:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1">
              #{selectedTag}
              <button
                onClick={() => setSelectedTag(undefined)}
                className="hover:text-rose-500 ml-1"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Main Resource Cards Grid / List */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : resources.length === 0 ? (
        <EmptyState
          title="No knowledge resources found"
          description="Try adjusting your search filters, category selection, or upload a new resource."
          actionText="Upload Resource"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={() => setUploadModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => {
            const previewUrl = getFullApiUrl(`/api/v1/knowledge/${res.id}/preview`);
            const fileTypeBadge = (
              res.file_type ||
              res.original_filename?.split('.').pop() ||
              res.resource_type ||
              'DOC'
            ).toUpperCase();

            return (
              <div
                key={res.id}
                onClick={() => setSelectedResource(res)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* First-Page Visual Preview Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-3.5 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={res.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Top Badges overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <ResourceTypeBadge type={res.resource_type} size="sm" />
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/85 backdrop-blur-xs text-white shadow-xs">
                        {fileTypeBadge}
                      </span>
                    </div>

                    {res.category && (
                      <div className="absolute top-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-0.5 rounded-full font-medium shadow-xs truncate max-w-[140px]">
                        {res.category.name}
                      </div>
                    )}
                  </div>

                  {/* Resource Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {res.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {res.description || 'No summary description provided.'}
                    </p>

                    {res.tags && res.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {res.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(tag.slug);
                            }}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-colors"
                          >
                            #{tag.name}
                          </span>
                        ))}
                        {res.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{res.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Author, Date, Views, Download, Delete */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={res.author?.full_name || 'User'}
                      avatarUrl={res.author?.avatar_url}
                      size="xs"
                    />
                    <div className="text-left">
                      <span className="truncate max-w-[90px] block text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {res.author?.full_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(res.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mr-1">
                      <span className="flex items-center gap-0.5" title="Views">
                        <Eye className="w-3.5 h-3.5" /> {res.view_count}
                      </span>
                      <span className="flex items-center gap-0.5" title="Downloads">
                        <Download className="w-3.5 h-3.5" /> {res.download_count}
                      </span>
                    </div>

                    <button
                      title="Download file"
                      onClick={(e) => handleDirectDownload(res, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {canDeleteResource(res) && (
                      <button
                        title="Delete resource"
                        onClick={(e) => handleDirectDelete(res, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {resources.map((res) => {
            const previewUrl = getFullApiUrl(`/api/v1/knowledge/${res.id}/preview`);
            const fileTypeBadge = (
              res.file_type ||
              res.original_filename?.split('.').pop() ||
              res.resource_type ||
              'DOC'
            ).toUpperCase();

            return (
              <div
                key={res.id}
                onClick={() => setSelectedResource(res)}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 flex-1 pr-4">
                  {/* List View Miniature Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={res.title}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ResourceTypeBadge type={res.resource_type} size="sm" />
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {fileTypeBadge}
                      </span>
                      {res.category && (
                        <span className="text-[11px] text-slate-400">
                          • {res.category.name}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {res.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{res.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                  <span className="hidden md:inline">By {res.author?.full_name}</span>
                  <span className="hidden sm:inline">
                    {new Date(res.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {res.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> {res.download_count}
                  </span>

                  <button
                    title="Download file"
                    onClick={(e) => handleDirectDownload(res, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {canDeleteResource(res) && (
                    <button
                      title="Delete resource"
                      onClick={(e) => handleDirectDelete(res, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * 18 + 1} - {Math.min(page * 18, totalItems)} of {totalItems} items
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ResourceDetailModal
        resource={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => {
          setSelectedResource(null);
          setSearchParams({});
        }}
        onDeleted={() => {
          setSelectedResource(null);
          queryClient.invalidateQueries({ queryKey: ['knowledgeList'] });
          refetch();
        }}
      />

      <ResourceUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['knowledgeList'] });
          refetch();
        }}
      />
    </div>
  );
};
