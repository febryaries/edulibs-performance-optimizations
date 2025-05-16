"use client";
import { useMemo } from 'react';
import { ForeignKeyRelationMap, PaginationParams, QueryController, TableNames } from '@/lib/query-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { useCrud } from './use-crud';
import { Database } from '@/utils/database.types';


export type UseControllerHook<T extends TableNames, Map extends ForeignKeyRelationMap<T> = {}> = () => QueryController<T, Map>

// Class
export const classRelationMap = {
  'classes_level_id_fkey': { alias: 'educational_level', referencedTable: 'educational_levels', isOneToMany: false }
} as const;

export class ClassController extends QueryController<'classes', typeof classRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'classes', {
      fields: ['*'],
      relationMap: classRelationMap,
    });
  }
}

export type Class = Awaited<ReturnType<ClassController['getById']>>;
export type ClassInsert = Parameters<ClassController['create']>[0];
export type ClassUpdate = Parameters<ClassController['update']>[1];



export const useClassesController: UseControllerHook<'classes', typeof classRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new ClassController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useClassesCrud() {
  const controller = useClassesController()
  return useCrud(controller, "classes")
}

// Comment
export const commentRelationMap = {
  'comments_resource_id_fkey': { alias: 'resource', referencedTable: 'resources', isOneToMany: false },
  'comments_user_id_fkey': { alias: 'user', referencedTable: 'users', isOneToMany: false }
} as const;

export class CommentController extends QueryController<'comments', typeof commentRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'comments', {
      fields: ['*'],
      relationMap: commentRelationMap,
    });
  }
}

export type Comment = Awaited<ReturnType<CommentController['getById']>>;
export type CommentInsert = Parameters<CommentController['create']>[0];
export type CommentUpdate = Parameters<CommentController['update']>[1];

export const useCommentsController: UseControllerHook<'comments', typeof commentRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new CommentController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useCommentsCrud() {
  const controller = useCommentsController()
  return useCrud(controller, "comments")
}

// Curricular Area
export const curricularAreaRelationMap = {
  // 'curricular_areas_domain_id_fkey': {alias:'domain', referencedTable: 'domains'}
} as const;

export class CurricularAreaController extends QueryController<'curricular_areas', typeof curricularAreaRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'curricular_areas', {
      fields: ['*'],
      relationMap: curricularAreaRelationMap,
    });
  }
}

export type CurricularArea = Awaited<ReturnType<CurricularAreaController['getById']>>;
export type CurricularAreaInsert = Parameters<CurricularAreaController['create']>[0];
export type CurricularAreaUpdate = Parameters<CurricularAreaController['update']>[1];

export const useCurricularAreasController: UseControllerHook<'curricular_areas', typeof curricularAreaRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new CurricularAreaController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useCurricularAreasCrud() {
  const controller = useCurricularAreasController()
  return useCrud(controller, "curricular_areas")
}

// Discipline Class
export const disciplineClassRelationMap = {
  'discipline_class_area_id_fkey': { alias: 'curricular_area', referencedTable: 'curricular_areas', isOneToMany: false },
  'discipline_class_class_id_fkey': { alias: 'class', referencedTable: 'classes', isOneToMany: false },
  'discipline_class_discipline_id_fkey': { alias: 'discipline', referencedTable: 'disciplines', isOneToMany: false }
} as const;

export class DisciplineClassController extends QueryController<'discipline_class', typeof disciplineClassRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'discipline_class', {
      fields: ['*'],
      relationMap: disciplineClassRelationMap,
    });
  }
}

export type DisciplineClass = Awaited<ReturnType<DisciplineClassController['getById']>>;
export type DisciplineClassInsert = Parameters<DisciplineClassController['create']>[0];
export type DisciplineClassUpdate = Parameters<DisciplineClassController['update']>[1];

export const useDisciplineClassController: UseControllerHook<'discipline_class', typeof disciplineClassRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new DisciplineClassController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useDisciplineClassCrud() {
  const controller = useDisciplineClassController()
  return useCrud(controller, "discipline_class")
}

// Discipline
export const disciplineRelationMap = {
  'disciplines_domain_id_fkey': { alias: 'domain', referencedTable: 'domains', isOneToMany: false }
} as const;

export class DisciplineController extends QueryController<'disciplines', typeof disciplineRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'disciplines', {
      fields: ['*'],
      relationMap: disciplineRelationMap,
    });
  }
}

export type Discipline = Awaited<ReturnType<DisciplineController['getById']>>;
export type DisciplineInsert = Parameters<DisciplineController['create']>[0];
export type DisciplineUpdate = Parameters<DisciplineController['update']>[1];

export const useDisciplinesController: UseControllerHook<'disciplines', typeof disciplineRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new DisciplineController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useDisciplinesCrud() {
  const controller = useDisciplinesController()
  return useCrud(controller, "disciplines")
}

// Domain
export const domainRelationMap = {
  // 'domains_parent_id_fkey': {alias:'parent', referencedTable: 'domains'}
} as const;

export class DomainController extends QueryController<'domains', typeof domainRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'domains', {
      fields: ['*'],
      relationMap: domainRelationMap,
    });
  }
}

export type Domain = Awaited<ReturnType<DomainController['getById']>>;
export type DomainInsert = Parameters<DomainController['create']>[0];
export type DomainUpdate = Parameters<DomainController['update']>[1];

export const useDomainsController: UseControllerHook<'domains', typeof domainRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new DomainController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useDomainsCrud() {
  const controller = useDomainsController()
  return useCrud(controller, "domains")
}

// Educational Level
export const educationalLevelRelationMap = {
  // 'educational_levels_parent_id_fkey': {alias:'parent', referencedTable: 'educational_levels'}
} as const;

export class EducationalLevelController extends QueryController<'educational_levels', typeof educationalLevelRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'educational_levels', {
      fields: ['*'],
      relationMap: educationalLevelRelationMap,
    });
  }
}

export type EducationLevel = Awaited<ReturnType<EducationalLevelController['getById']>>;
export type EducationLevelInsert = Parameters<EducationalLevelController['create']>[0];
export type EducationLevelUpdate = Parameters<EducationalLevelController['update']>[1];

export const useEducationLevelsController: UseControllerHook<'educational_levels', typeof educationalLevelRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new EducationalLevelController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useEducationLevelsCrud() {
  const controller = useEducationLevelsController()
  return useCrud(controller, "educational_levels")
}

// General Competency
export const generalCompetencyRelationMap = {
  'general_competencies_discipline_id_fkey': { alias: 'discipline', referencedTable: 'disciplines', isOneToMany: false },
  'general_competencies_level_id_fkey': { alias: 'educational_level', referencedTable: 'educational_levels', isOneToMany: false }
} as const;

export class GeneralCompetencyController extends QueryController<'general_competencies', typeof generalCompetencyRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'general_competencies', {
      fields: ['*'],
      relationMap: generalCompetencyRelationMap,
    });
  }
}

export type GeneralCompetency = Awaited<ReturnType<GeneralCompetencyController['getById']>>;
export type GeneralCompetencyInsert = Parameters<GeneralCompetencyController['create']>[0];
export type GeneralCompetencyUpdate = Parameters<GeneralCompetencyController['update']>[1];

export const useGeneralCompetenciesController: UseControllerHook<'general_competencies', typeof generalCompetencyRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new GeneralCompetencyController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useGeneralCompetenciesCrud() {
  const controller = useGeneralCompetenciesController()
  return useCrud(controller, "general_competencies")
}


// Group Member
export const groupMemberRelationMap = {
  'group_members_group_id_fkey': { alias: 'group', referencedTable: 'groups', isOneToMany: false },
  'group_members_user_id_fkey': { alias: 'user', referencedTable: 'users', isOneToMany: false }
} as const;

export class GroupMemberController extends QueryController<'group_members', typeof groupMemberRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'group_members', {
      fields: ['id', 'group_id', 'user_id', 'role', 'created_at', 'updated_at'],
      relationMap: groupMemberRelationMap,
    });
  }
}

export type GroupMember = Awaited<ReturnType<GroupMemberController['getById']>>;
export type GroupMemberInsert = Parameters<GroupMemberController['create']>[0];
export type GroupMemberUpdate = Parameters<GroupMemberController['update']>[1];

export const useGroupMembersController: UseControllerHook<'group_members', typeof groupMemberRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  return useMemo(() => {
    return new GroupMemberController(supabase);
  }, [supabase]);
}

export function useGroupMembersCrud() {
  const controller = useGroupMembersController()
  return useCrud(controller, "group_members")
}

// Group Resource
export const groupResourceRelationMap = {
  'group_resources_group_id_fkey': { alias: 'group', referencedTable: 'groups', isOneToMany: false },
  'group_resources_resource_id_fkey': { alias: 'resource', referencedTable: 'resources', isOneToMany: false }
} as const;

export class GroupResourceController extends QueryController<'group_resources', typeof groupResourceRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'group_resources', {
      fields: ['*'],
      relationMap: groupResourceRelationMap,
    });
  }
}

export type GroupResource = Awaited<ReturnType<GroupResourceController['getById']>>;
export type GroupResourceInsert = Parameters<GroupResourceController['create']>[0];
export type GroupResourceUpdate = Parameters<GroupResourceController['update']>[1];

export const useGroupResourcesController: UseControllerHook<'group_resources', typeof groupResourceRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new GroupResourceController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useGroupResourcesCrud() {
  const controller = useGroupResourcesController()
  return useCrud(controller, "group_resources")
}

// Group
export const groupRelationMap = {
  'groups_created_by_fkey': { alias: 'created_by', referencedTable: 'users', isOneToMany: false }
} as const;

export class GroupController extends QueryController<'groups', typeof groupRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'groups', {
      fields: ['*'],
      relationMap: groupRelationMap,
    });
  }
}

export type Group = Awaited<ReturnType<GroupController['getById']>>;
export type GroupInsert = Parameters<GroupController['create']>[0];
export type GroupUpdate = Parameters<GroupController['update']>[1];

export const useGroupsController: UseControllerHook<'groups', typeof groupRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new GroupController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useGroupsCrud() {
  const controller = useGroupsController()
  return useCrud(controller, "groups")
}

// Resource Competency
export const resourceCompetencyRelationMap: ForeignKeyRelationMap<'resource_competencies'> = {
  'resource_competencies_resource_id_fkey': { alias: 'resource', referencedTable: 'resources', isOneToMany: false },
  'resource_competencies_specific_competency_id_fkey': { alias: 'specific_competency', referencedTable: 'specific_competencies', isOneToMany: false }
} as const;

export class ResourceCompetencyController extends QueryController<'resource_competencies', typeof resourceCompetencyRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'resource_competencies', {
      fields: ['*'],
      relationMap: resourceCompetencyRelationMap,
    });
  }
}

export type ResourceCompetency = Awaited<ReturnType<ResourceCompetencyController['getById']>>;
export type ResourceCompetencyInsert = Parameters<ResourceCompetencyController['create']>[0];
export type ResourceCompetencyUpdate = Parameters<ResourceCompetencyController['update']>[1];

export const useResourceCompetenciesController: UseControllerHook<'resource_competencies', typeof resourceCompetencyRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new ResourceCompetencyController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export function useResourceCompetenciesCrud() {
  const controller = useResourceCompetenciesController()
  return useCrud(controller, "resource_competencies")
}

// Resource Evaluation
export const resourceEvaluationRelationMap: ForeignKeyRelationMap<'resource_evaluations'> = {
  'resource_evaluations_evaluator_id_fkey': { alias: 'evaluator', referencedTable: 'users', isOneToMany: false },
  'resource_evaluations_resource_id_fkey': { alias: 'resource', referencedTable: 'resources', isOneToMany: false },
  'resource_evaluations_user_id_fkey': { alias: 'user', referencedTable: 'users', isOneToMany: false }
} as const;

export class ResourceEvaluationController extends QueryController<'resource_evaluations', typeof resourceEvaluationRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'resource_evaluations', {
      fields: ['*'],
      relationMap: resourceEvaluationRelationMap,
    });
  }
}

export type ResourceEvaluation = Awaited<ReturnType<ResourceEvaluationController['getById']>>;
export type ResourceEvaluationInsert = Parameters<ResourceEvaluationController['create']>[0] & { status: "CONFORMABLE" | "UNCONFORMABLE" | "IN_PROGRESS" | null }
export type ResourceEvaluationUpdate = Parameters<ResourceEvaluationController['update']>[1] & { status: "CONFORMABLE" | "UNCONFORMABLE" | "IN_PROGRESS" | null };

export const useResourceEvaluationsController: UseControllerHook<'resource_evaluations', typeof resourceEvaluationRelationMap> = (params?: PaginationParams) => {
  const supabase = useSupabaseBrowser();
  const controller = new ResourceEvaluationController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export const useResourceEvaluationsCrud = () => {
  const controller = useResourceEvaluationsController()
  return useCrud(controller, "resource_evaluations")
}

// Resource 
export const resourceRelationMap = {
  'resources_author_id_fkey': { alias: 'author', referencedTable: 'users', isOneToMany: false },
  'resources_mentor_id_fkey': { alias: 'mentor', referencedTable: 'users', isOneToMany: false },
  'resources_evaluator_id_fkey': { alias: 'evaluator', referencedTable: 'users', isOneToMany: false },
  'resources_class_id_fkey': { alias: 'class', referencedTable: 'classes', isOneToMany: false },
  'resources_discipline_id_fkey': { alias: 'discipline', referencedTable: 'disciplines', isOneToMany: false },
  'resource_competency_resource_id_fkey': { 
    alias: 'specific_competencies', 
    referencedTable: 'resource_competency', 
    isOneToMany: true,
    nested: 'competency:specific_competencies(*)'
  },
} as const;

export class ResourceController extends QueryController<'resources', typeof resourceRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'resources', {
      fields: ['*'],
      relationMap: resourceRelationMap,
    });
  }
}

export type Resource = Awaited<ReturnType<QueryController<'resources', typeof resourceRelationMap>['getById']>>;
export type ResourceInsert = Parameters<QueryController<'resources', typeof resourceRelationMap>['create']>[0];
export type ResourceUpdate = Parameters<QueryController<'resources', typeof resourceRelationMap>['update']>[1];

export const useResourcesController: UseControllerHook<'resources', typeof resourceRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new ResourceController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export const useResourcesCrud = () => {
  const controller = useResourcesController()
  return useCrud<'resources', typeof resourceRelationMap>(controller, "resources")
}

// Specific Competency

export const specificCompetencyRelationMap = {
  'specific_competencies_class_id_fkey': { alias: 'class', referencedTable: 'classes', isOneToMany: false },
  'specific_competencies_competency_id_fkey': { alias: 'competency', referencedTable: 'general_competencies', isOneToMany: false, nested: 'discipline:disciplines(*)' },
} as const;

export class SpecificCompetencyController extends QueryController<'specific_competencies', typeof specificCompetencyRelationMap> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'specific_competencies', {
      fields: ['*'],
      relationMap: specificCompetencyRelationMap,
    });
  }
}

export type SpecificCompetency = Awaited<ReturnType<SpecificCompetencyController['getById']>>;
export type SpecificCompetencyInsert = Parameters<SpecificCompetencyController['create']>[0];
export type SpecificCompetencyUpdate = Parameters<SpecificCompetencyController['update']>[1];

export const useSpecificCompetenciesController: UseControllerHook<'specific_competencies', typeof specificCompetencyRelationMap> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new SpecificCompetencyController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export const useSpecificCompetenciesCrud = () => {
  const controller = useSpecificCompetenciesController()
  return useCrud(controller, "specific_competencies")
}

export type Profile = Awaited<ReturnType<QueryController<'users'>['getById']>>;
export type ProfileInsert = Parameters<QueryController<'users'>['create']>[0];
export type ProfileUpdate = Parameters<QueryController<'users'>['update']>[1];
export type UserRole = Database['public']['Enums']['user_role'];

export class UserController extends QueryController<'users'> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'users', {
      fields: ['*'],
    });
  }
}

export const useUsersController: UseControllerHook<'users'> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new UserController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export const useUsersCrud = () => {
  const controller = useUsersController()
  return useCrud(controller, "users")
}



export type ResourceSpecificCompetency = Awaited<ReturnType<ResourceSpecificCompetencyController['getById']>>;
export type ResourceSpecificCompetencyInsert = Parameters<ResourceSpecificCompetencyController['create']>[0];
export type ResourceSpecificCompetencyUpdate = Parameters<ResourceSpecificCompetencyController['update']>[1];

export const resourceSpecificCompetencyRelationMap: ForeignKeyRelationMap<'resource_competency'> = {
 resource_competency_competency_id_fkey: { alias: 'competency', referencedTable: 'specific_competencies', isOneToMany: false },
 resource_competency_resource_id_fkey: { alias: 'resource', referencedTable: 'resources', isOneToMany: false },
}

export class ResourceSpecificCompetencyController extends QueryController<'resource_competency'> {
  constructor(client: TypedSupabaseClient) {
    super(client, 'resource_competency', {
      fields: ['*'],
      relationMap: resourceSpecificCompetencyRelationMap,
    });
  }
}


export const useResourceSpecificCompetenciesController: UseControllerHook<'resource_competency'> = () => {
  const supabase = useSupabaseBrowser();
  const controller = new ResourceSpecificCompetencyController(supabase);
  return useMemo(() => controller, [supabase, controller]);
}

export const useResourceSpecificCompetenciesCrud = () => {
  const controller = useResourceSpecificCompetenciesController()
  return useCrud(controller, "resource_competency")
}

