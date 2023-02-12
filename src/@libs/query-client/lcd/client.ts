import { GasPrice } from "@cosmjs/stargate";
import { Rate } from "@libs/types";
import { LCDClient } from "@terra-money/terra.js";
import { LcdQueryClient, SimulateFetchParams, SimulateFetchQuery } from "..";
import { LcdFault } from "../errors";
import { WasmFetchBaseParams, WasmQueryData } from "../interface";
import { defaultLcdFetcher, LcdFetcher, LcdResult } from "./fetch";

export interface LcdFetchParams<WasmQueries>
  extends WasmFetchBaseParams<WasmQueries> {
  lcdFetcher?: LcdFetcher;
  lcdEndpoint: string;
  requestInit?: Omit<RequestInit, "method" | "body">;
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

  // Here we want to map that

  const rawData = await Promise.all(
    wasmKeys.map((key) => {
      const { query, contractAddress } = wasmQuery[key];
      const endpoint = `${lcdEndpoint}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${Buffer.from(
        JSON.stringify(query),
        "utf8"
      ).toString("base64")}${id ? "?" + id : ""}`;

      return lcdFetcher<LcdResult<any>>(endpoint, requestInit);
    })
  );

  const result = wasmKeys.reduce((resultObject, key, i) => {
    const lcdResult = rawData[i];

    if ("error" in lcdResult) {
      throw new LcdFault("Unknown error: " + String(lcdResult));
    }

    //@ts-ignore
    resultObject[key] = lcdResult.data;

    return resultObject;
  }, {} as WasmQueryData<WasmQueries>);

  return result;
}

export type LCDSimulateFetchParams = LcdQueryClient &
  SimulateFetchQuery & {
    lcdClient: LCDClient;
    gasInfo: {
      gasAdjustment: Rate<number>;
      gasPrice: GasPrice;
    };
  };

export async function lcdSimulate({
  msgs,
  lcdClient,
  address,
  gasInfo,
}: LCDSimulateFetchParams): Promise<number> {
  const { auth_info } = await lcdClient.tx.create([{ address: address }], {
    msgs,
    gasAdjustment: gasInfo.gasAdjustment,
    //@ts-ignore
    gasPrices: gasInfo.gasPrice,
  });

  return auth_info.fee.gas_limit;
}
