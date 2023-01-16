import { QueryClient } from '@libs/query-client';
import { QueryFunctionContext } from 'react-query';

export function createQueryFn<T extends any[], R>(
  fn: (client: QueryClient, ...args: T) => Promise<R>,
  client: QueryClient
): (ctx: QueryFunctionContext<[string, ...T]>) => Promise<R> {
  return ({ queryKey: [, ...args] }) => {
    return fn(client,...(args as T));
  };
}

