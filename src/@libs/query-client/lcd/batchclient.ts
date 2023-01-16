import { LcdFault } from '../errors';
import { WasmFetchBaseParams, WasmQueryData } from '../interface';
import { BatchQuery } from './batchfetch';
import { defaultLcdFetcher, LcdFetcher, LcdResult } from './fetch';

export interface LcdFetchParams<WasmQueries>
  extends WasmFetchBaseParams<WasmQueries> {
  batchFetcher?: BatchQuery,
  requestInit?: Omit<RequestInit, 'method' | 'body'>;
}

export async function batchFetch<WasmQueries>({
  id,
  wasmQuery,
  batchFetcher,
  requestInit,
}: LcdFetchParams<WasmQueries>): Promise<WasmQueryData<WasmQueries>> {
  const wasmKeys: Array<keyof WasmQueries> = Object.keys(wasmQuery) as Array<
    keyof WasmQueries
  >;

  // Here we want to map that 
  const rawData = await Promise.all(
    wasmKeys.map((key) => {
      const { query, contractAddress } = wasmQuery[key];
      console.log("batch fetching" , query)

      return batchFetcher?.wasm.queryContractSmart(contractAddress, query);

    }),
  );
  console.log(rawData)

  const result = wasmKeys.reduce((resultObject, key, i) => {
    const lcdResult = rawData[i];

    if ('error' in lcdResult) {
      throw new LcdFault('Unknown error: ' + String(lcdResult));
    }

    //@ts-ignore
    resultObject[key] = lcdResult.data;

    return resultObject;
  }, {} as WasmQueryData<WasmQueries>);

  return result;
}
