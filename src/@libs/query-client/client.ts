import { hiveFetch } from './hive/client';
import { HiveFetcher } from './hive/fetch';
import { WasmFetchBaseParams, WasmQueryData } from './interface';
import { batchFetch } from './lcd/batchclient';
import { BatchQuery } from './lcd/batchfetch';
import { lcdFetch } from './lcd/client';
import { LcdFetcher } from './lcd/fetch';

export class BatchQueryClient {
  batchFetcher: BatchQuery | undefined;
  requestInit?: Omit<RequestInit, 'method' | 'body'>;
};

BatchQueryClient.prototype.toString = function() {
  return `BatchQueryClient`;
}

export type LcdQueryClient = {
  lcdEndpoint: string;
  lcdFetcher: LcdFetcher;
  requestInit?: Omit<RequestInit, 'method' | 'body'>;
};

export type HiveQueryClient = {
  hiveEndpoint: string;
  hiveFetcher: HiveFetcher;
  requestInit?: Omit<RequestInit, 'method' | 'body'>;
};

export type QueryClient = LcdQueryClient | HiveQueryClient | BatchQueryClient;

export type WasmFetchParams<WasmQueries> = QueryClient &
  WasmFetchBaseParams<WasmQueries>;

export async function wasmFetch<WasmQueries>(
  params: WasmFetchParams<WasmQueries>,
): Promise<WasmQueryData<WasmQueries>> {

  if('lcdEndpoint' in params){
    return lcdFetch<WasmQueries>(params)
  }else if ("hiveEndpoint" in params){
    return hiveFetch<WasmQueries>({ ...params, variables: {} });
  }else{
    return batchFetch<WasmQueries>(params);
  }
}
