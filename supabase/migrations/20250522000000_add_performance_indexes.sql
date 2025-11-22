-- Performance Indexes for EDU APPS Platform
-- Created: 2025-05-22
-- Purpose: Improve query performance for frequently accessed columns

-- ============================================
-- RESOURCES TABLE INDEXES
-- ============================================

-- Index for filtering by status (DRAFT, SUBMITTED, IN_REVIEW, etc.)
-- Used in: Dashboard filters, resource lists
CREATE INDEX IF NOT EXISTS idx_resources_status
ON resources(status);

-- Index for filtering by author
-- Used in: "My resources", author filters
CREATE INDEX IF NOT EXISTS idx_resources_author_id
ON resources(author_id);

-- Index for filtering by discipline
-- Used in: Discipline filters, subject-based queries
CREATE INDEX IF NOT EXISTS idx_resources_discipline_id
ON resources(discipline_id);

-- Index for sorting by creation date (DESC for newest first)
-- Used in: Default sorting, timeline views
CREATE INDEX IF NOT EXISTS idx_resources_created_at
ON resources(created_at DESC);

-- Index for filtering by user (resource owner)
-- Used in: User-specific queries, permissions
CREATE INDEX IF NOT EXISTS idx_resources_user_id
ON resources(user_id);

-- Index for filtering by evaluator
-- Used in: Evaluator dashboard, review assignments
CREATE INDEX IF NOT EXISTS idx_resources_evaluator_id
ON resources(evaluator_id);

-- Composite index for common query pattern: status + created_at
-- Used in: Dashboard main view (e.g., "Show all SUBMITTED resources, newest first")
CREATE INDEX IF NOT EXISTS idx_resources_status_created
ON resources(status, created_at DESC);

-- Composite index for user's resources by status
-- Used in: "My resources" filtered by status
CREATE INDEX IF NOT EXISTS idx_resources_user_status
ON resources(user_id, status);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for filtering by role (ADMINISTRATOR, MODERATOR, etc.)
-- Used in: User management, role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- Index for filtering by status (ACTIVE, INACTIVE, etc.)
-- Used in: Active users list, status filters
CREATE INDEX IF NOT EXISTS idx_users_status
ON users(status);

-- Index for filtering by education level
-- Used in: Level-based user queries
CREATE INDEX IF NOT EXISTS idx_users_education_level
ON users(education_level_id);

-- Composite index for role + status
-- Used in: "Show all ACTIVE ADMINISTRATORS"
CREATE INDEX IF NOT EXISTS idx_users_role_status
ON users(role, status);

-- ============================================
-- GROUPS TABLE INDEXES
-- ============================================

-- Index for filtering by creator
-- Used in: "My groups", creator-based queries
CREATE INDEX IF NOT EXISTS idx_groups_created_by
ON groups(created_by);

-- Index for sorting by creation date
-- Used in: Groups list, timeline views
CREATE INDEX IF NOT EXISTS idx_groups_created_at
ON groups(created_at DESC);

-- ============================================
-- RESOURCE_COMPETENCIES TABLE INDEXES
-- ============================================

-- Index for resource-competency lookups
-- Used in: Loading competencies for a resource
CREATE INDEX IF NOT EXISTS idx_resource_competencies_resource_id
ON resource_competency(resource_id);

-- Index for competency-resource lookups
-- Used in: Finding resources by competency
CREATE INDEX IF NOT EXISTS idx_resource_competencies_competency_id
ON resource_competency(competency_id);

-- ============================================
-- COMMENTS TABLE INDEXES
-- ============================================

-- Index for loading comments for a resource
-- Used in: Resource viewer, comments section
CREATE INDEX IF NOT EXISTS idx_comments_resource_id
ON comments(resource_id);

-- Index for user's comments
-- Used in: User activity, comment history
CREATE INDEX IF NOT EXISTS idx_comments_user_id
ON comments(user_id);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

-- Index for user's notifications
-- Used in: Notification center, unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

-- Index for notification status (READ/UNREAD)
-- Used in: Notification badge count
CREATE INDEX IF NOT EXISTS idx_notifications_status
ON notifications(status);

-- Composite index for user's notifications by status
-- Used in: "Show my unread notifications"
CREATE INDEX IF NOT EXISTS idx_notifications_user_status
ON notifications(user_id, status);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify indexes were created
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Total indexes created: 23';
END $$;
