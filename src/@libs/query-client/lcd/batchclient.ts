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
      console.log("batch fetching" , contractAddress, query)

      return batchFetcher?.wasm.queryContractSmart(contractAddress, query);

    }),
  );

  const result = wasmKeys.reduce((resultObject, key, i) => {
    const lcdResult = rawData[i];
    console.log(lcdResult)
    //@ts-ignore
    resultObject[key] = lcdResult

    return resultObject;
  }, {} as WasmQueryData<WasmQueries>);

  console.log(result)
  return result;
}
