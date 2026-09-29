-- ==============================================================================
-- ORGANISATION LEARNING & KNOWLEDGE PORTAL - SUPABASE POSTGRESQL SCHEMA
-- Execute this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Roles and Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id BIGINT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 3. Profiles table (linked directly to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Categories & Tags
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Knowledge Resources
CREATE TABLE IF NOT EXISTS public.resources (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL DEFAULT 'DOCUMENT',
    category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_key VARCHAR(500),
    original_filename VARCHAR(255),
    external_url TEXT,
    file_size BIGINT,
    content_type VARCHAR(100),
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resource_tags (
    resource_id BIGINT REFERENCES public.resources(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, tag_id)
);

-- 6. Learning Paths & Modules
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    level VARCHAR(50) DEFAULT 'INTERMEDIATE',
    estimated_hours INT DEFAULT 10,
    is_published BOOLEAN DEFAULT TRUE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_modules (
    id BIGSERIAL PRIMARY KEY,
    path_id BIGINT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.module_resources (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES public.resources(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_path_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    path_id BIGINT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    progress_percentage INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS public.user_module_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id BIGINT REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, module_id)
);

-- 7. Daily Learning Journal
CREATE TABLE IF NOT EXISTS public.learning_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    work_completed TEXT,
    learning_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_entry_resources (
    entry_id BIGINT REFERENCES public.learning_entries(id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES public.resources(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, resource_id)
);

-- 8. Project Submissions & Peer Reviews
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    learning_entry_id BIGINT REFERENCES public.learning_entries(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.submission_history (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT REFERENCES public.submissions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Projects & Knowledge Repositories
CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    problem_statement TEXT,
    description TEXT NOT NULL,
    technologies TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    architecture_summary TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_resources (
    project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES public.resources(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, resource_id)
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. AUTOMATIC PROFILE CREATION TRIGGER ON SUPABASE AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id BIGINT;
BEGIN
    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        designation,
        department,
        employee_id,
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'designation', 'Software Engineer'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Engineering'),
        COALESCE(NEW.raw_user_meta_data->>'employee_id', NULL),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );

    -- Assign default EMPLOYEE role
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'EMPLOYEE' LIMIT 1;
    IF default_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, default_role_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. INITIAL SEED DATA FOR ROLES & CATEGORIES
-- ==============================================================================
INSERT INTO public.roles (name, description) VALUES
('ADMIN', 'Full administrative access across all portal modules'),
('MENTOR', 'Reviews code capstones, guides trainees, publishes paths'),
('EMPLOYEE', 'Standard employee with read/write access to knowledge & learning')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, slug, description, icon, color) VALUES
('Backend Architecture', 'backend-architecture', 'Distributed systems, microservices, databases, caching & queues', 'Server', 'indigo'),
('Frontend Systems', 'frontend-systems', 'React, TypeScript, state management, design systems & performance', 'Layout', 'cyan'),
('DevOps & Cloud', 'devops-cloud', 'Kubernetes, Docker, CI/CD pipelines, Terraform & AWS/GCP', 'Cloud', 'blue'),
('Security & Compliance', 'security-compliance', 'Zero trust architecture, OWASP top 10, JWT, encryption & RBAC', 'Shield', 'rose'),
('Engineering Guides', 'engineering-guides', 'Coding standards, git workflows, testing conventions & onboarding', 'BookOpen', 'purple')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES
('fastapi', 'fastapi'),
('react', 'react'),
('typescript', 'typescript'),
('postgresql', 'postgresql'),
('redis', 'redis'),
('supabase', 'supabase'),
('docker', 'docker'),
('architecture', 'architecture')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 13. SUPABASE STORAGE BUCKET FOR PORTAL FILES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-files', 'portal-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage public access policy
CREATE POLICY "Public Read Portal Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'portal-files');

CREATE POLICY "Authenticated Upload Portal Files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portal-files' AND auth.role() = 'authenticated');
