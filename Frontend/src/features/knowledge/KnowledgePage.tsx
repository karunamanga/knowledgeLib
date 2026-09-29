import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Download,
  Eye,
  Calendar,
  BookOpen,
  Tag as TagIcon,
} from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
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

  // Query single resource if routeId/selectedParam provided and not in cache
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

  // Check if direct resource selected via URL or fetch
  useEffect(() => {
    if (directResourceData?.data.data) {
      setSelectedResource(directResourceData.data.data);
    } else if (selectedParam && resources.length > 0) {
      const found = resources.find((r) => r.id === Number(selectedParam));
      if (found) setSelectedResource(found);
    }
  }, [selectedParam, resources, directResourceData]);

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
              <option value="">All Resource Types</option>
              <option value="DOCUMENT">Documents</option>
              <option value="PDF">PDF Guides</option>
              <option value="PRESENTATION">Presentations</option>
              <option value="ARCHITECTURE">Architecture Blueprints</option>
              <option value="DIAGRAM">Diagrams</option>
              <option value="VIDEO">Videos</option>
              <option value="LINK">External Links</option>
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
          {resources.map((res) => (
            <div
              key={res.id}
              onClick={() => setSelectedResource(res)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <ResourceTypeBadge type={res.resource_type} size="sm" />
                  {res.category && (
                    <span className="text-[11px] font-medium text-slate-400 truncate max-w-[130px]">
                      {res.category.name}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
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

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={res.author?.full_name || 'User'}
                    avatarUrl={res.author?.avatar_url}
                    size="xs"
                  />
                  <span className="truncate max-w-[100px] text-slate-600 dark:text-slate-300 font-medium">
                    {res.author?.full_name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {res.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> {res.download_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {resources.map((res) => (
            <div
              key={res.id}
              onClick={() => setSelectedResource(res)}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <ResourceTypeBadge type={res.resource_type} size="sm" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {res.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{res.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                <span>By {res.author?.full_name}</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {res.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> {res.download_count}
                </span>
              </div>
            </div>
          ))}
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
          refetch();
        }}
      />

      <ResourceUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
