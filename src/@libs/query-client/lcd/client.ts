import { LcdFault } from '../errors';
import { WasmFetchBaseParams, WasmQueryData } from '../interface';
import { defaultLcdFetcher, LcdFetcher, LcdResult } from './fetch';

export interface LcdFetchParams<WasmQueries>
  extends WasmFetchBaseParams<WasmQueries> {
  lcdFetcher?: LcdFetcher;
  lcdEndpoint: string;
  requestInit?: Omit<RequestInit, 'method' | 'body'>;
}

export async function lcdFetch<WasmQueries>({
  id,
  wasmQuery,
  lcdEndpoint,
  lcdFetcher = defaultLcdFetcher,
  requestInit,
}: LcdFetchParams<WasmQueries>): Promise<WasmQueryData<WasmQueries>> {
  const wasmKeys: Array<keyof WasmQueries> = Object.keys(wasmQuery) as Array<
    keyof WasmQueries
  >;

  const { block } = await lcdFetcher<any>(`${lcdEndpoint}/blocks/latest`);

  let height = +block.header.height;

  const rawData = await Promise.all(
    wasmKeys.map((key) => {
      const { query, contractAddress } = wasmQuery[key];
      const endpoint = `${lcdEndpoint}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${Buffer.from(
        JSON.stringify(query),
        'utf8',
      ).toString('base64')}?height=${height}${id ? '&' + id : ''}`;

      return lcdFetcher<LcdResult<any>>(endpoint, requestInit);
    }),
  );

  const result = wasmKeys.reduce((resultObject, key, i) => {
    const lcdResult = rawData[i];

    if ('error' in lcdResult) {
      throw new LcdFault('Unknown error: ' + String(lcdResult));
    }

    //@ts-ignore
    resultObject[key] = lcdResult.data;

    if (
      typeof resultObject.$blockHeight !== 'number' ||
      height < resultObject.$blockHeight
    ) {
      resultObject.$blockHeight = height;
    }

    return resultObject;
  }, {} as WasmQueryData<WasmQueries>);

  return result;
}
