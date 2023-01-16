import {
  BankExtension,
  QueryClient,
  setupBankExtension,
  createProtobufRpcClient,
  TxExtension,
  setupTxExtension,
} from "@cosmjs/stargate";
import { setupWasmExtension, WasmExtension } from "@cosmjs/cosmwasm-stargate";
import { HttpBatchClient, Tendermint34Client } from "@cosmjs/tendermint-rpc";

// Tendermint extension
import { ServiceClientImpl as TenderMintServiceClientImpl } from "cosmjs-types/cosmos/base/tendermint/v1beta1/query";
import { NetworkInfo } from "@terra-money/wallet-provider";
import { useCallback, useEffect, useState } from "react";

export interface TenderMintExtension {
  readonly tendermint: {
    readonly latestBlock: () => Promise<any>;
  };
}

export function setupTendermintExtension(base: QueryClient): TenderMintExtension {
  const rpc = createProtobufRpcClient(base);
  // Use this service to get easy typed access to query methods
  // This cannot be used for proof verification
  const queryService = new TenderMintServiceClientImpl(rpc);

  return {
    tendermint: {
      latestBlock: async () => {
        const test = await queryService.GetLatestBlock({});
        return test;
      },
    },
  };
}

export type BatchQuery = QueryClient &
    WasmExtension &
    BankExtension &
    TxExtension &
    TenderMintExtension;


export function useBatchQuery(rpc: string): BatchQueryClient {

  const [batchQuery, setBatchQuery] = useState<BatchQuery | undefined>();

  useEffect(() => {
    const createBatchQuery = async () => {
      if(rpc){
        const httpBatch = new HttpBatchClient(rpc, {
          dispatchInterval: 500,
          batchSizeLimit: 100,
        });
        const tendermint = await Tendermint34Client.create(httpBatch);
        console.log("client created")
        // We create the query client
        setBatchQuery(
          QueryClient.withExtensions(
            tendermint,
            setupWasmExtension,
            setupBankExtension,
            setupTxExtension,
            setupTendermintExtension,
          )
        );
      }else{
        console.log("No rpc set for network", rpc)
      }
    }
    createBatchQuery();
  }, [rpc])

  return {
    batchFetcher: batchQuery,
  }
}



import { LcdFetchError } from '../errors';
import { BatchQueryClient } from "..";

export type LcdResult<Data> =
  | Data
  | {
      txhash: string;
      code: number;
      raw_log: string;
    };

export type LcdFetcher = <Data>(
  endpoint: string,
  requestInit?: Omit<RequestInit, 'method' | 'body'>,
) => Promise<Data>;

export async function defaultLcdFetcher<Data>(
  endpoint: string,
  requestInit?: RequestInit,
): Promise<Data> {
  return fetch(endpoint, { ...requestInit, cache: 'no-store' })
    .then((res) => res.json())
    .then((data) => {
      if ('code' in data && data.code > 0) {
        throw new LcdFetchError(data.code, data.txhash, data.raw_log);
      }
      return data;
    });
}
