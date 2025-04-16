import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type CommentRow = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];
type CommentUpdate = Database['public']['Tables']['comments']['Update'];

export interface CommentWithRelations extends CommentRow {
  users: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  resources: {
    id: string;
    title: string;
  } | null;
}

export class CommentsController extends QueryController<CommentWithRelations, 'comments'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      content,
      resource_id,
      user_id,
      created_at,
      updated_at,
      users (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      ),
      resources (
        id,
        title
      )
    `;
    
    super(client, 'comments', selectQuery);
  }

  /**
   * Get comments with pagination, filtering, and sorting
   */
  async getComments(params: PaginationParams): Promise<PaginatedResult<CommentWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(id: string): Promise<CommentWithRelations | null> {
    const { data, error } = await this.client
      .from('comments')
      .select(`
        id,
        content,
        resource_id,
        user_id,
        created_at,
        updated_at,
        users (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        resources (
          id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as CommentWithRelations;
  }

  /**
   * Get comments by resource ID
   */
  async getCommentsByResourceId(resourceId: string, params: PaginationParams): Promise<PaginatedResult<CommentWithRelations>> {
    const resourceFilter = {
      column: 'resource_id',
      operator: 'eq' as const,
      value: resourceId
    };

    const filters = params.filters ? [...params.filters, resourceFilter] : [resourceFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Get comments by user ID
   */
  async getCommentsByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<CommentWithRelations>> {
    const userFilter = {
      column: 'user_id',
      operator: 'eq' as const,
      value: userId
    };

    const filters = params.filters ? [...params.filters, userFilter] : [userFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Create a new comment
   */
  async createComment(data: CommentInsert): Promise<CommentWithRelations> {
    const { data: newComment, error } = await this.client
      .from('comments')
      .insert(data)
      .select(`
        id,
        content,
        resource_id,
        user_id,
        created_at,
        updated_at,
        users (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        resources (
          id,
          title
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newComment as CommentWithRelations;
  }

  /**
   * Update an existing comment
   */
  async updateComment(id: string, data: CommentUpdate): Promise<CommentWithRelations> {
    const { data: updatedComment, error } = await this.client
      .from('comments')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        content,
        resource_id,
        user_id,
        created_at,
        updated_at,
        users (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        resources (
          id,
          title
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedComment as CommentWithRelations;
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string): Promise<void> {
    const { error } = await this.client
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
