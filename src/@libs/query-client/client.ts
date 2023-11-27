import { GasPrice } from "@cosmjs/stargate";
import { Rate } from "@libs/types";
import { LCDClient } from "@terra-money/feather.js";
import { hiveFetch } from "./hive/client";
import { HiveFetcher } from "./hive/fetch";
import { WasmFetchBaseParams, WasmQueryData } from "./interface";
import { batchFetch, batchSimulate } from "./lcd/batchclient";
import { BatchQuery } from "./lcd/batchfetch";
import { lcdFetch, lcdSimulate } from "./lcd/client";
import { LcdFetcher } from "./lcd/fetch";

export class BatchQueryClient {
  batchEndpoint: string | undefined;
  batchFetcher: BatchQuery | undefined;
  requestInit?: Omit<RequestInit, "method" | "body">;
}

export type LcdQueryClient = {
  lcdEndpoint: string;
  lcdFetcher: LcdFetcher;
  requestInit?: Omit<RequestInit, "method" | "body">;
};

export type HiveQueryClient = {
  hiveEndpoint: string;
  hiveFetcher: HiveFetcher;
  requestInit?: Omit<RequestInit, "method" | "body">;
};

export type QueryClient = LcdQueryClient | HiveQueryClient | BatchQueryClient;

export type WasmFetchParams<WasmQueries> = QueryClient &
  WasmFetchBaseParams<WasmQueries>;

export async function wasmFetch<WasmQueries>(
  params: WasmFetchParams<WasmQueries>
): Promise<WasmQueryData<WasmQueries>> {
  if ("lcdEndpoint" in params) {
    return lcdFetch<WasmQueries>(params);
  } else if ("hiveEndpoint" in params) {
    return hiveFetch<WasmQueries>({ ...params, variables: {} });
  } else {
    return batchFetch<WasmQueries>(params);
  }
}

export type SimulateFetchQuery = {
  msgs: any[];
  address: string;
};

export type GasInfoParams = {
  gasInfo: {
    gasAdjustment: Rate<number>;
    gasPrice: GasPrice;
  };
};

export type SimulateFetchParams = QueryClient &
  SimulateFetchQuery & {
    lcdClient: LCDClient;
  } & GasInfoParams;

export async function simulateFetch(
  params: SimulateFetchParams
): Promise<number | undefined> {
  if ("lcdEndpoint" in params) {
    if (params.lcdClient && params.gasInfo) {
      return lcdSimulate(params);
    }
    throw "Error when computing the Fee, app not configured properly";
  } else if ("hiveEndpoint" in params) {
    throw "Hive not defined for simulate query";
  } else {
    return batchSimulate(params);
  }
}
