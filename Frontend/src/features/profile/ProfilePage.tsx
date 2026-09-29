import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersApi, learningApi, submissionsApi, knowledgeApi } from '../../api/endpoints';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { UserAvatar } from '../../components/common/UserAvatar';
import { ResourceTypeBadge, SubmissionStatusBadge, LearningStatusBadge } from '../../components/common/Badge';
import {
  User as UserIcon,
  Mail,
  Briefcase,
  Building,
  Calendar,
  Shield,
  BookOpen,
  Send,
  CheckCircle2,
  TrendingUp,
  Layers,
  Upload,
  Camera,
  Trash2,
  Edit3,
  BadgePercent,
  Check,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'submissions' | 'resources'>('overview');
  
  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const userId = user?.id || 0;

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => usersApi.getStats(userId),
    enabled: !!userId,
  });

  const { data: myLearningData } = useQuery({
    queryKey: ['myLearningEntries', userId],
    queryFn: () => learningApi.list({ user_id: userId, page_size: 15 }),
    enabled: activeTab === 'learning' || activeTab === 'overview',
  });

  const { data: mySubmissionsData } = useQuery({
    queryKey: ['mySubmissions', userId],
    queryFn: () => submissionsApi.list({ page_size: 15 }),
    enabled: activeTab === 'submissions' || activeTab === 'overview',
  });

  const { data: myResourcesData } = useQuery({
    queryKey: ['myResources', userId],
    queryFn: () => knowledgeApi.list({ author_id: userId, page_size: 15 }),
    enabled: activeTab === 'resources',
  });

  const stats = statsData?.data.data;
  const learningEntries = myLearningData?.data.data.items || [];
  const submissions = mySubmissionsData?.data.data.items || [];
  const resources = myResourcesData?.data.data.items || [];

  const handleOpenEdit = () => {
    if (user) {
      setEditFullName(user.full_name || '');
      setEditDepartment(user.department || '');
      setEditDesignation(user.designation || '');
      setEditEmployeeId(user.employee_id || '');
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      error('Full Name is required.', 'Validation');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: editFullName.trim(),
        department: editDepartment.trim() || undefined,
        designation: editDesignation.trim() || undefined,
        employee_id: editEmployeeId.trim() || undefined,
      });
      success('Profile details updated successfully.', 'Profile Updated');
      setIsEditModalOpen(false);
      refetchStats();
    } catch (err: any) {
      error(err.message || 'Failed to update profile.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingAvatar(true);
      try {
        await uploadAvatar(file);
        success('Avatar picture updated!', 'Success');
      } catch (err: any) {
        error(err.message || 'Failed to upload avatar.', 'Error');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile image?')) return;
    try {
      await removeAvatar();
      success('Avatar removed. Using letter initial fallback.', 'Avatar Removed');
    } catch (err: any) {
      error(err.message || 'Failed to remove avatar.', 'Error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Profile Header Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar with Overlay Upload Picker */}
            <div className="relative group">
              <UserAvatar
                name={user?.full_name || 'User'}
                avatarUrl={user?.avatar_url}
                size="xl"
                className="w-24 h-24 text-3xl"
              />
              <label
                className="absolute inset-0 rounded-full bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-medium"
                title="Change Avatar Image"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Change</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.full_name}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {user?.roles[0]?.name || 'EMPLOYEE'}
                </span>
                {user?.employee_id && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    ID: {user.employee_id}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {user?.designation || 'Software Engineer'} • {user?.department || 'Engineering'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
                </span>
                {user?.joining_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since {new Date(user.joining_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
            {user?.avatar_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Remove Picture
              </Button>
            )}
          </div>
        </div>

        {/* 5 Key Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Journal Logs
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {stats?.learning_entries_count || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Completed Logs
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats?.completed_learning_count || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Submissions
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {stats?.submissions_count || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Approved Work
            </p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats?.approved_submissions_count || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Uploads
            </p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {stats?.resources_uploaded_count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Overview & Activity
        </button>
        <button
          onClick={() => setActiveTab('learning')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'learning'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Learning Logs ({learningEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'submissions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          My Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'resources'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          My Uploads ({resources.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Learning Entries */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Recent Journal Logs
            </h3>
            {learningEntries.length > 0 ? (
              learningEntries.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {entry.title}
                    </span>
                    <LearningStatusBadge status={entry.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{entry.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No recent journal entries logged.</p>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Recent Submissions
            </h3>
            {submissions.length > 0 ? (
              submissions.slice(0, 4).map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {sub.title}
                    </span>
                    <SubmissionStatusBadge status={sub.status} size="sm" />
                  </div>
                  {sub.feedback && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 line-clamp-1 font-medium">
                      Feedback: {sub.feedback}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No project submissions yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'learning' && (
        <div className="space-y-4">
          {learningEntries.length > 0 ? (
            learningEntries.map((e) => (
              <div
                key={e.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{e.title}</h4>
                  <LearningStatusBadge status={e.status} size="sm" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {e.description}
                </p>
                {e.work_completed && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    Deliverables: {e.work_completed}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400">
              No learning logs recorded yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{sub.title}</h4>
                  <SubmissionStatusBadge status={sub.status} size="sm" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{sub.description}</p>
                {sub.feedback && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold block mb-1">Mentor Feedback:</span>
                    {sub.feedback}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400">
              No capstone or milestone submissions yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.length > 0 ? (
            resources.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <ResourceTypeBadge type={r.resource_type} size="sm" />
                  <span className="text-xs text-slate-400">{r.view_count} views</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400">
              No resources uploaded by you yet.
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Details"
        description="Update your corporate details and personal display settings."
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
          <Input
            label="Full Name *"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label="Department"
            value={editDepartment}
            onChange={(e) => setEditDepartment(e.target.value)}
            leftIcon={<Building className="w-4 h-4" />}
          />

          <Input
            label="Designation"
            value={editDesignation}
            onChange={(e) => setEditDesignation(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4" />}
          />

          <Input
            label="Employee ID"
            value={editEmployeeId}
            onChange={(e) => setEditEmployeeId(e.target.value)}
            leftIcon={<BadgePercent className="w-4 h-4" />}
          />

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              isLoading={isSaving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
