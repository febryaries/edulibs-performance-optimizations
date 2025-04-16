import { ResourcesController } from './resources-controller';
import { QueryFunctionContext } from '@tanstack/react-query';

export const getResourceByIdQuery = (controller: ResourcesController, id: string) => ({
  queryKey: ['resource', id],
  queryFn: async ({ queryKey }: QueryFunctionContext) => {
    const [, resourceId] = queryKey;
    return controller.getResourceById(resourceId as string);
  },
});
