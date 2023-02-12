import { QueryClient } from "@libs/query-client";
import { QueryFunctionContext } from "react-query";

export function createQueryFn<T extends any[], R>(
  fn: (b: QueryClient, ...args: T) => Promise<R>,
  client: QueryClient
): (ctx: QueryFunctionContext<[string, ...T]>) => Promise<R> {
  return ({ queryKey: [, ...args] }) => {
    return fn(client, ...(args as T));
  };
}

export function createSimpleQueryFn<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (ctx: QueryFunctionContext<[string, ...T]>) => Promise<R> {
  return ({ queryKey: [, ...args] }) => {
    return fn(...(args as T));
  };
}
