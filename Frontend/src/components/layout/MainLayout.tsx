import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Search, FileText, Compass, FolderGit2, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { knowledgeApi } from '../../api/endpoints';
import { ResourceTypeBadge } from '../common/Badge';

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: searchResults } = useQuery({
    queryKey: ['globalSearch', searchQuery],
    queryFn: () => knowledgeApi.list({ search: searchQuery, page_size: 5 }),
    enabled: searchQuery.length >= 2,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors relative selection:bg-indigo-500 selection:text-white">
      {/* Subtle Background Pattern & Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Global Command / Search Modal */}
      <Modal
        isOpen={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        size="lg"
        hideCloseButton
      >
        <div className="space-y-4">
          <Input
            autoFocus
            placeholder="Search resources, architecture docs, roadmaps, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-base py-3"
          />

          {searchQuery.length < 2 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Quick Navigation:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    navigate('/knowledge');
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Knowledge Library</span>
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    navigate('/learning-paths');
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-left"
                >
                  <Compass className="w-4 h-4 text-purple-500" />
                  <span>Learning Paths</span>
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    navigate('/projects');
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-left"
                >
                  <FolderGit2 className="w-4 h-4 text-cyan-500" />
                  <span>Company Projects</span>
                </button>
              </div>
            </div>
          )}

          {searchQuery.length >= 2 && searchResults?.data.data.items && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {searchResults.data.data.items.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No matching resources found for "{searchQuery}"
                </div>
              ) : (
                searchResults.data.data.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/knowledge?selected=${item.id}`);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors group"
                  >
                    <div className="space-y-1 truncate pr-4">
                      <div className="flex items-center gap-2">
                        <ResourceTypeBadge type={item.resource_type} size="sm" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
