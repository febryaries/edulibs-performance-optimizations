import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type DomainInsert = Database['public']['Tables']['domains']['Insert'];
type DomainUpdate = Database['public']['Tables']['domains']['Update'];

export interface Domain {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export class DomainsController extends QueryController<Domain, 'domains'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query
    const selectQuery = `
      id,
      name,
      created_at,
      updated_at
    `;
    
    super(client, 'domains', selectQuery);
  }

  /**
   * Get domains with pagination, filtering, and sorting
   */
  async getDomains(params: PaginationParams): Promise<PaginatedResult<Domain>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single domain by ID
   */
  async getDomainById(id: number): Promise<Domain | null> {
    const { data, error } = await this.client
      .from('domains')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Create a new domain
   */
  async createDomain(data: DomainInsert): Promise<Domain> {
    const { data: newDomain, error } = await this.client
      .from('domains')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newDomain as Domain;
  }

  /**
   * Update an existing domain
   */
  async updateDomain(id: number, data: DomainUpdate): Promise<Domain> {
    const { data: updatedDomain, error } = await this.client
      .from('domains')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updatedDomain as Domain;
  }

  /**
   * Delete a domain
   */
  async deleteDomain(id: number): Promise<void> {
    const { error } = await this.client
      .from('domains')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
