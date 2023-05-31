import {
  ANCHOR_QUERY_KEY,
  useAnchorWebapp,
} from "@anchor-protocol/app-provider";
import { Token, u } from "@libs/types";
import { Coin } from "@terra-money/terra.js";
import debounce from "lodash.debounce";
import { useQuery, UseQueryResult } from "react-query";

export async function simpleQuery<T>(queryUrl: string): Promise<T> {
  console.log(queryUrl);
  return fetch(queryUrl).then((res) => res.json());
}

export function useSimpleQuery<T>(queryUrl: string): UseQueryResult<T> {
  const { queryErrorReporter } = useAnchorWebapp();

  return useQuery(
    [ANCHOR_QUERY_KEY.TFM_AVAILABLE_TOKENS, queryUrl],
    () => simpleQuery(queryUrl),
    {
      refetchInterval: 1000 * 60 * 2,
      keepPreviousData: true,
      onError: queryErrorReporter,
    }
  );
}

const TFM_API = "https://api-terra2.tfm.com";

export interface TFMToken {
  contract_addr: string;
  decimals: number;
  id: number;
  is_token_liquid: boolean;
  name: string;
  symbol: string;
}

export function useTFMTokensQuery() {
  return useSimpleQuery<TFMToken[]>(`${TFM_API}/tokens`);
}

export function useTFMQuoteQuery({
  tokenIn,
  tokenOut,
  amount,
}: SimulationParameters) {
  return useSimpleQuery<TFMToken[]>(
    tfmSwapQuoteURL({
      tokenIn,
      tokenOut,
      amount,
    })
  );
}

export interface SimulationParameters {
  tokenIn: string;
  tokenOut: string;
  amount: u<Token>;
  useSplit?: boolean;
}
export interface SwapSimulationResponse {
  alternatives: any;
  input_amount: number;
  price_impact: number;
  return_amount: number;
  routes: any;
}

export function tfmSwapQuoteURL({
  tokenIn,
  tokenOut,
  amount,
  useSplit,
}: SimulationParameters) {
  return `${TFM_API}/route?amount=${amount}&token0=${tokenIn}&token1=${tokenOut}&use_split=${
    useSplit ?? true
  }`;
}

export interface SwapParameters {
  tokenIn: string;
  tokenOut: string;
  amount: u<Token>;
  slippage: number;
  useSplit?: boolean;
}

export interface SwapResponse {
  type: string;
  value: {
    coins: Coin[];
    contract: "REPLACE_ROUTER";
    execute_msg: any;
    sender: "REPLACE_SENDER";
  };
}

export function tfmSwapURL({
  tokenIn,
  tokenOut,
  amount,
  slippage,
  useSplit,
}: SwapParameters) {
  return `${TFM_API}/swap?amount=${amount}&token0=${tokenIn}&token1=${tokenOut}&use_split=${
    useSplit ?? true
  }&slippage=${slippage}`;
}

export interface SwapSimulationAndSwapResponse {
  quote: SwapSimulationResponse;
  swap: SwapResponse;
}

export async function tfmEstimation({
  tokenIn,
  tokenOut,
  amount,
  slippage,
  useSplit,
}: SwapParameters): Promise<SwapSimulationAndSwapResponse> {
  const [swapSimulation, swapOperation] = await Promise.all([
    simpleQuery<SwapSimulationResponse>(
      tfmSwapQuoteURL({ tokenIn, tokenOut, amount, useSplit })
    ),
    simpleQuery<SwapResponse>(
      tfmSwapURL({ tokenIn, tokenOut, amount, slippage, useSplit })
    ),
  ]);

  return {
    quote: swapSimulation,
    swap: swapOperation,
  };
}
