-- Migration: Add TO authenticated to resource_competency policies to avoid anon evaluation cost
-- Date: 2025-08-14

DO $$
BEGIN
  -- Admin full access policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Admin Full Access on Resource Competency'
  ) THEN
    EXECUTE 'ALTER POLICY "Admin Full Access on Resource Competency" ON public.resource_competency TO authenticated';
  END IF;

  -- Main SELECT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Allow Select Resource Competency if Can Access Resource'
  ) THEN
    EXECUTE 'ALTER POLICY "Allow Select Resource Competency if Can Access Resource" ON public.resource_competency TO authenticated';
  END IF;

  -- Student Insert policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Student Insert Owned Resource Competency'
  ) THEN
    EXECUTE 'ALTER POLICY "Student Insert Owned Resource Competency" ON public.resource_competency TO authenticated';
  END IF;

  -- Student Update policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Student Update Owned Resource Competency'
  ) THEN
    EXECUTE 'ALTER POLICY "Student Update Owned Resource Competency" ON public.resource_competency TO authenticated';
  END IF;

  -- Student Delete policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Student Delete Owned Resource Competency'
  ) THEN
    EXECUTE 'ALTER POLICY "Student Delete Owned Resource Competency" ON public.resource_competency TO authenticated';
  END IF;
END $$;
