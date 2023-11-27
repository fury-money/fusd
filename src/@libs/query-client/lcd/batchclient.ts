import { GasPrice } from "@cosmjs/stargate";
import { Account, LCDClient, Msg } from "@terra-money/feather.js";
import {
  BatchQueryClient,
  GasInfoParams,
  QueryClient,
  SimulateFetchQuery,
} from "..";
import { LcdFault } from "../errors";
import { WasmFetchBaseParams, WasmQueryData } from "../interface";
import { BatchQuery } from "./batchfetch";
import { defaultLcdFetcher, LcdFetcher, LcdResult } from "./fetch";

export interface LcdFetchParams<WasmQueries>
  extends WasmFetchBaseParams<WasmQueries> {
  batchFetcher?: BatchQuery;
  requestInit?: Omit<RequestInit, "method" | "body">;
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

      return batchFetcher?.wasm.queryContractSmart(contractAddress, query);
    })
  );

  const result = wasmKeys.reduce((resultObject, key, i) => {
    const lcdResult = rawData[i];
    //@ts-ignore
    resultObject[key] = lcdResult;

    return resultObject;
  }, {} as WasmQueryData<WasmQueries>);

  return result;
}

export type SimulateParams = BatchQueryClient &
  SimulateFetchQuery & {
    lcdClient?: LCDClient;
  } & GasInfoParams;

export async function batchSimulate({
  msgs,
  batchFetcher,
  address,
  gasInfo: { gasAdjustment },
}: SimulateParams): Promise<number | undefined> {
  const distantAccount = await batchFetcher?.auth.account(address);
  if (!distantAccount) {
    throw "Account not found when simulating the transaction";
  }

  const account = Account.fromProto(distantAccount);
  let txSimulateResponse = await batchFetcher?.tx.simulate(
    msgs.map((msg) => msg.packAny()),
    undefined,
    account.getPublicKey()?.toAmino()!,
    account.getSequenceNumber()
  );

  const gasPrice = txSimulateResponse?.gasInfo?.gasUsed;
  if (!gasPrice) {
    throw "Error estimating the gas fee, gasPrice not parsed";
  }

  return Number(gasPrice) * gasAdjustment;
}
