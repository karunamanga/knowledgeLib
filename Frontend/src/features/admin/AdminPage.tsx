import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, categoriesApi, auditApi } from '../../api/endpoints';
import { User, Role, Category, Tag, AuditLog } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  Shield,
  Users,
  FolderTree,
  ScrollText,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  ShieldCheck,
  Tag as TagIcon,
  Activity,
  Trash2,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'audit'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<number | undefined>(undefined);

  // Modals state
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editingUserRoles, setEditingUserRoles] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState<number>(3); // default employee

  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsersList', userSearch, selectedRoleFilter],
    queryFn: () =>
      usersApi.list({
        search: userSearch || undefined,
        role_id: selectedRoleFilter,
        page_size: 50,
      }),
    enabled: activeTab === 'users',
  });

  const { data: rolesData } = useQuery({
    queryKey: ['adminRolesList'],
    queryFn: () => usersApi.listRoles(),
  });

  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['adminCategoriesList'],
    queryFn: () => categoriesApi.listCategories(),
    enabled: activeTab === 'categories',
  });

  const { data: tagsData, refetch: refetchTags } = useQuery({
    queryKey: ['adminTagsList'],
    queryFn: () => categoriesApi.listTags(),
    enabled: activeTab === 'categories',
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['adminAuditLogs', auditSearch],
    queryFn: () => auditApi.list({ page_size: 50 }),
    enabled: activeTab === 'audit',
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      success('User provisioned with credentials and roles!', 'User Created');
      setCreateUserModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewDesignation('');
      setNewDepartment('');
      refetchUsers();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to create user.', 'Error');
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      usersApi.updateRoles(userId, roleIds),
    onSuccess: () => {
      success('User roles updated successfully.', 'Roles Updated');
      setEditingUserRoles(null);
      refetchUsers();
    },
    onError: () => {
      error('Failed to update roles.', 'Error');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => categoriesApi.createCategory(data),
    onSuccess: () => {
      success('Category created!', 'Category Added');
      setCreateCategoryModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      refetchCategories();
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to create category.', 'Error');
    },
  });

  const users = usersData?.data.data.items || [];
  const roles = rolesData?.data.data || [];
  const categories = categoriesData?.data.data || [];
  const tags = tagsData?.data.data || [];
  const auditLogs = auditData?.data.data.items || [];

  const handleOpenRoleEdit = (user: User) => {
    setEditingUserRoles(user);
    setSelectedRoleIds(user.roles.map((r) => r.id));
  };

  const handleToggleRoleSelection = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      full_name: newFullName,
      email: newEmail,
      password: newPassword,
      designation: newDesignation || undefined,
      department: newDepartment || undefined,
      role_ids: [newUserRoleId],
    });
  };

  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate({
      name: newCatName,
      description: newCatDesc,
      color: newCatColor,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Admin & Governance Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage user accounts, database-driven RBAC permissions, taxonomies, and audit security events.
          </p>
        </div>

        {activeTab === 'users' && (
          <Button
            variant="gradient"
            onClick={() => setCreateUserModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Provision User
          </Button>
        )}

        {activeTab === 'categories' && (
          <Button
            variant="gradient"
            onClick={() => setCreateCategoryModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Category
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & RBAC ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Categories & Tags</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Audit & Security Logs</span>
        </button>
      </div>

      {/* TAB 1: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <select
              value={selectedRoleFilter || ''}
              onChange={(e) =>
                setSelectedRoleFilter(e.target.value ? Number(e.target.value) : undefined)
              }
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {usersLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Assigned Roles</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-4 flex items-center gap-3">
                          <img
                            src={
                              u.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                u.full_name
                              )}&background=6366f1&color=fff`
                            }
                            alt={u.full_name}
                            className="w-8 h-8 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {u.full_name}
                            </p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {u.department || 'Engineering'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {u.designation || 'Engineer'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles.map((r) => (
                              <span
                                key={r.id}
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  r.name === 'ADMIN'
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                    : r.name === 'MENTOR'
                                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                }`}
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              u.is_active ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRoleEdit(u)}
                            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                          >
                            Manage Roles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORIES & TAGS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-500" /> Taxonomy Categories ({categories.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-1 rounded-xl text-xs font-bold"
                      style={{
                        backgroundColor: `${cat.color || '#6366f1'}20`,
                        color: cat.color || '#6366f1',
                      }}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400">/{cat.slug}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-purple-500" /> Topic Tags ({tags.length})
            </h3>
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Action Event</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Details</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 dark:text-slate-200 font-medium">
                        {log.user_email || 'System'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {log.details || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Provision User */}
      <Modal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Provision New Corporate User"
        description="Add a new employee, mentor, or administrator account."
        size="md"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-left">
          <Input
            label="Full Name *"
            placeholder="e.g. Maya Lin"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="maya.lin@company.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <Input
            label="Initial Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Designation"
              placeholder="Software Engineer"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
            />

            <Input
              label="Department"
              placeholder="Backend Core"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned System Role
            </label>
            <select
              value={newUserRoleId}
              onChange={(e) => setNewUserRoleId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.description}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              isLoading={createUserMutation.isPending}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User Roles */}
      {editingUserRoles && (
        <Modal
          isOpen={!!editingUserRoles}
          onClose={() => setEditingUserRoles(null)}
          title={`Manage Roles for ${editingUserRoles.full_name}`}
          description="Grant or revoke database-driven roles and permission scopes."
          size="md"
        >
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => handleToggleRoleSelection(role.id)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {role.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {role.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUserRoles(null)}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={() =>
                  updateRolesMutation.mutate({
                    userId: editingUserRoles.id,
                    roleIds: selectedRoleIds,
                  })
                }
                isLoading={updateRolesMutation.isPending}
              >
                Save Roles
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Create Category */}
      <Modal
        isOpen={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        title="Add Knowledge Category"
        size="md"
      >
        <form onSubmit={handleCreateCategorySubmit} className="space-y-4 text-left">
          <Input
            label="Category Name *"
            placeholder="e.g. AI & Machine Learning"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm"
              placeholder="Scope of this knowledge category..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              isLoading={createCategoryMutation.isPending}
            >
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
