-- Migration to add 'IN_PROGRESS' to evaluation_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluation_status') THEN
    CREATE TYPE public.evaluation_status AS ENUM ('CONFORMABLE', 'UNCONFORMABLE', 'IN_PROGRESS');
  ELSE
    -- Add 'IN_PROGRESS' value if not already present
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'IN_PROGRESS' AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'evaluation_status'
      )
    ) THEN
      ALTER TYPE public.evaluation_status ADD VALUE 'IN_PROGRESS';
    END IF;
  END IF;
END$$;
