import { GasPrice } from '@libs/app-fns';
import {
  defaultHiveFetcher,
  defaultLcdFetcher,
  HiveQueryClient,
  LcdQueryClient,
} from '@libs/query-client';
import { NetworkInfo } from '@terra-money/wallet-provider';
import { UseQueryResult } from 'react-query';

export function DEFAULT_HIVE_WASM_CLIENT(
  network: NetworkInfo,
): HiveQueryClient {
  if (network.chainID.startsWith('pisco')) {
    return {
      hiveEndpoint: '',
      hiveFetcher: defaultHiveFetcher,
    };
  } else {
    return {
      hiveEndpoint: '',
      hiveFetcher: defaultHiveFetcher,
    };
  }
}

export function DEFAULT_LCD_WASM_CLIENT(network: NetworkInfo): LcdQueryClient {
  return {
    lcdEndpoint: network.lcd,
    lcdFetcher: defaultLcdFetcher,
  };
}

export function DEFAULT_GAS_PRICE_ENDPOINTS(network: NetworkInfo): string {
  const fcd = network.lcd.replace(/lcd/, 'fcd');
  return `${fcd}/v1/txs/gas_prices`;
}

const FALLBACK_GAS_PRICE_PHOENIX = {
  uluna: '0.015',
};

const FALLBACK_GAS_PRICE_PISCO = {
  uluna: '0.015',
};

export function DEFAULT_FALLBACK_GAS_PRICE(network: NetworkInfo): GasPrice {
  if (network.chainID.startsWith('pisco')) {
    return FALLBACK_GAS_PRICE_PISCO as GasPrice;
  } else {
    return FALLBACK_GAS_PRICE_PHOENIX as GasPrice;
  }
}

export const EMPTY_QUERY_RESULT: UseQueryResult<undefined> = {
  data: undefined,
  dataUpdatedAt: 0,
  error: null,
  errorUpdatedAt: 0,
  failureCount: 0,
  isError: false,
  isFetched: false,
  isFetchedAfterMount: false,
  isIdle: false,
  isLoading: false,
  isLoadingError: false,
  isPlaceholderData: false,
  isPreviousData: false,
  isFetching: false,
  isRefetching: false,
  isRefetchError: false,
  isSuccess: true,
  isStale: false,
  status: 'success',
  errorUpdateCount: 0,
  remove: () => {},
  refetch: () => Promise.resolve(EMPTY_QUERY_RESULT),
};

export enum TERRA_TX_KEYS {
  CW20_BUY = 'NEBULA_TX_CW20_BUY',
  CW20_SELL = 'NEBULA_TX_CW20_SELL',
  SEND = 'NEBULA_TX_SEND',
}

export enum TERRA_QUERY_KEY {
  TOKEN_BALANCES = 'TERRA_QUERY_TOKEN_BALANCES',
  CW20_BALANCE = 'TERRA_QUERY_CW20_BALANCE',
  CW20_TOKEN_DISPLAY_INFOS = 'TERRA_QUERY_CW20_TOKEN_DISPLAY_INFOS',
  TERRA_TOKEN_DISPLAY_INFOS = 'TERRA_QUERY_TERRA_TOKEN_DISPLAY_INFOS',
  CW20_TOKEN_INFO = 'NEBULA_QUERY_CW20_TOKEN_INFO',
  STAKING_POOL_INFO = 'NEBULA_QUERY_STAKING_CLUSTER_POOL_INFO_LIST',
  TERRASWAP_PAIR = 'NEBULA_QUERY_TERRASWAP_PAIR',
  TERRASWAP_POOL = 'NEBULA_QUERY_TERRASWAP_POOL',
  TERRA_BALANCES = 'NEBULA_QUERY_TERRA_BALANCES',
  TERRA_BALANCES_WITH_TOKEN_INFO = 'NEBULA_QUERY_TERRA_BALANCES_WITH_TOKEN_INFO',
  TERRA_NATIVE_BALANCES = 'NEBULA_QUERY_TERRA_NATIVE_BALANCES',
  TERRA_TOKEN_INFO = 'NEBULA_QUERY_TERRA_TOKEN_INFO',
  TERRA_TREASURY_TAX_CAP = 'TERRA_QUERY_TERRA_TREASURY_TAX_CAP',
  TERRA_TREASURY_TAX_RATE = 'TERRA_QUERY_TERRA_TREASURY_TAX_RATE',
  TERRA_GAS_PRICE = 'TERRA_QUERY_GAS_PRICE',
  ASTROPORT_DEPOSIT = 'ASTROPORT_QUERY_DEPOSIT',
}

export enum EVM_QUERY_KEY {
  EVM_NATIVE_BALANCES = 'EVM_NATIVE_BALANCES',
  ERC20_BALANCE = 'EVM_ERC20_BALANCE',
  ERC20_TOKEN = 'EVM_ERC20_TOKEN',
}

export const REFETCH_INTERVAL = 1000 * 60 * 5;
