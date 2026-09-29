import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { KnowledgePage } from './features/knowledge/KnowledgePage';
import { LearningPathsPage } from './features/learning_paths/LearningPathsPage';
import { PathDetailPage } from './features/learning_paths/PathDetailPage';
import { LearningJournalPage } from './features/learning/LearningJournalPage';
import { SubmissionsPage } from './features/submissions/SubmissionsPage';
import { MentorReviewsPage } from './features/reviews/MentorReviewsPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { ProjectDetailPage } from './features/projects/ProjectDetailPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { AdminPage } from './features/admin/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Application Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/knowledge" element={<KnowledgePage />} />
                    <Route path="/knowledge/:id" element={<KnowledgePage />} />
                    <Route path="/learning-paths" element={<LearningPathsPage />} />
                    <Route path="/learning-paths/:id" element={<PathDetailPage />} />
                    <Route path="/learning-journal" element={<LearningJournalPage />} />
                    <Route path="/submissions" element={<SubmissionsPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Mentor & Admin Protected Routes */}
                    <Route
                      path="/reviews"
                      element={<MentorReviewsPage />}
                    />
                    <Route
                      path="/admin"
                      element={<AdminPage />}
                    />
                  </Route>
                </Route>

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
