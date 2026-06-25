-- ============================================================================
-- DataHarvest Initial Schema
-- Migration: 001_initial_schema
-- Description: Creates all custom types, tables, indexes, triggers, RLS policies,
--              and storage buckets for the DataHarvest application.
-- ============================================================================

-- ############################################################################
-- 1. CUSTOM TYPES / ENUMS
-- ############################################################################
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('active', 'archived', 'deleted');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_type') THEN
    CREATE TYPE data_type AS ENUM ('product', 'article', 'business', 'custom');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'rejected');
  END IF;
END;
$$;

-- ############################################################################
-- 2. TABLES
-- ############################################################################

-- 2.1 profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 user_consents
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_text TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data_type data_type NOT NULL,
  status project_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 project_urls
CREATE TABLE IF NOT EXISTS project_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  robots_allowed BOOLEAN,
  robots_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 scrape_jobs
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status job_status NOT NULL DEFAULT 'queued',
  total_urls INTEGER DEFAULT 0,
  processed_urls INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 scraped_items
CREATE TABLE IF NOT EXISTS scraped_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scrape_job_id UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  title TEXT,
  price TEXT,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  published_date TEXT,
  raw_data JSONB,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 export_logs
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  total_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  domain TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 domain_blocklist
CREATE TABLE IF NOT EXISTS domain_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 error_logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT,
  error_code TEXT,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- 3. INDEXES
-- ############################################################################

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_data_type ON projects(data_type);

-- project_urls
CREATE INDEX IF NOT EXISTS idx_project_urls_project_id ON project_urls(project_id);
CREATE INDEX IF NOT EXISTS idx_project_urls_domain ON project_urls(domain);
CREATE INDEX IF NOT EXISTS idx_project_urls_is_active ON project_urls(is_active);

-- scrape_jobs
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_project_id ON scrape_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user_id ON scrape_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);

-- scraped_items
CREATE INDEX IF NOT EXISTS idx_scraped_items_project_id ON scraped_items(project_id);
CREATE INDEX IF NOT EXISTS idx_scraped_items_scrape_job_id ON scraped_items(scrape_job_id);

-- export_logs
CREATE INDEX IF NOT EXISTS idx_export_logs_project_id ON export_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON export_logs(user_id);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_scrape_job_id ON error_logs(scrape_job_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_project_id ON error_logs(project_id);

-- domain_blocklist
CREATE INDEX IF NOT EXISTS idx_domain_blocklist_domain ON domain_blocklist(domain);
CREATE INDEX IF NOT EXISTS idx_domain_blocklist_is_active ON domain_blocklist(is_active);

-- ############################################################################
-- 4. TRIGGER FUNCTION & TRIGGERS FOR updated_at
-- ############################################################################

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
  tables_with_updated_at TEXT[] := ARRAY['profiles', 'projects', 'project_urls', 'scrape_jobs', 'domain_blocklist'];
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || tbl || '_updated_at'
        AND tgrelid = tbl::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%1$I_updated_at
           BEFORE UPDATE ON %1$I
           FOR EACH ROW
           EXECUTE FUNCTION update_updated_at_column();',
        tbl
      );
    END IF;
  END LOOP;
END;
$$;

-- ############################################################################
-- 5. ROW LEVEL SECURITY
-- ############################################################################

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- ############################################################################
-- 6. RLS POLICIES
-- ############################################################################

-- Helper: drop existing policies to make migration idempotent
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','user_consents','projects','project_urls',
                        'scrape_jobs','scraped_items','export_logs',
                        'audit_logs','domain_blocklist','error_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6.1 profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_read_all_admins"
  ON profiles FOR SELECT
  USING (auth.role() = 'admin' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 6.2 user_consents
-- ---------------------------------------------------------------------------
CREATE POLICY "user_consents_read_own"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_consents_read_all_admins"
  ON user_consents FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "user_consents_insert_own"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6.3 projects
-- ---------------------------------------------------------------------------
CREATE POLICY "projects_read_own"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_read_all_admins"
  ON projects FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "projects_insert_own"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6.4 project_urls
-- ---------------------------------------------------------------------------
CREATE POLICY "project_urls_read_own"
  ON project_urls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_urls.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "project_urls_read_all_admins"
  ON project_urls FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "project_urls_insert_own"
  ON project_urls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_urls.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "project_urls_update_own"
  ON project_urls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_urls.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_urls.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "project_urls_delete_own"
  ON project_urls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_urls.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6.5 scrape_jobs
-- ---------------------------------------------------------------------------
CREATE POLICY "scrape_jobs_read_own"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "scrape_jobs_read_all_admins"
  ON scrape_jobs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "scrape_jobs_insert_service"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "scrape_jobs_update_service"
  ON scrape_jobs FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 6.6 scraped_items
-- ---------------------------------------------------------------------------
CREATE POLICY "scraped_items_read_own"
  ON scraped_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = scraped_items.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "scraped_items_read_all_admins"
  ON scraped_items FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "scraped_items_insert_service"
  ON scraped_items FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 6.7 export_logs
-- ---------------------------------------------------------------------------
CREATE POLICY "export_logs_read_own"
  ON export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "export_logs_read_all_admins"
  ON export_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ---------------------------------------------------------------------------
-- 6.8 audit_logs
-- ---------------------------------------------------------------------------
CREATE POLICY "audit_logs_read_all_admins"
  ON audit_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "audit_logs_insert_service"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 6.9 domain_blocklist
-- ---------------------------------------------------------------------------
CREATE POLICY "domain_blocklist_read_all"
  ON domain_blocklist FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "domain_blocklist_manage_admins"
  ON domain_blocklist FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ---------------------------------------------------------------------------
-- 6.10 error_logs
-- ---------------------------------------------------------------------------
CREATE POLICY "error_logs_read_all_admins"
  ON error_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "error_logs_read_own"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scrape_jobs
      WHERE scrape_jobs.id = error_logs.scrape_job_id
        AND scrape_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "error_logs_insert_service"
  ON error_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ############################################################################
-- 7. STORAGE: exports BUCKET
-- ############################################################################

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  false,
  52428800, -- 50 MB
  ARRAY['text/csv', 'text/comma-separated-values', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies on the storage.objects for the exports bucket to avoid duplicates
DROP POLICY IF EXISTS "exports_read_own" ON storage.objects;
DROP POLICY IF EXISTS "exports_read_all_admins" ON storage.objects;
DROP POLICY IF EXISTS "exports_insert_auth" ON storage.objects;

CREATE POLICY "exports_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports'
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "exports_read_all_admins"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports'
      AND auth.role() = 'authenticated'
      AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "exports_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports'
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
  );
