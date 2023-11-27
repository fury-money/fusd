
import { useNetwork } from '@anchor-protocol/app-provider';
import { GasPrice, lastSyncedHeightQuery } from '@libs/app-fns';
import {
  BatchQueryClient,
  HiveQueryClient,
  LcdQueryClient,
  QueryClient,
} from '@libs/query-client';
import { useBatchQuery } from '@libs/query-client/lcd/batchfetch';
import React, {
  Consumer,
  Context,
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from 'react';
import {
  DEFAULT_FALLBACK_GAS_PRICE,
  DEFAULT_GAS_PRICE_ENDPOINTS,
  DEFAULT_HIVE_WASM_CLIENT,
  DEFAULT_LCD_WASM_CLIENT,
} from '../env';
import { useGasPriceQuery } from '../queries/gasPrice';
import { AppConstants, AppContractAddress, TxRefetchMap } from '../types';
import { WalletStatus, useWallet } from '@terra-money/wallet-kit';
import { NetworkInfo } from 'utils/consts';

export interface AppProviderProps<
  ContractAddress extends AppContractAddress,
  Constants extends AppConstants,
> {
  children: ReactNode;

  contractAddress: (network: NetworkInfo) => ContractAddress;
  constants: (network: NetworkInfo) => Constants;

  defaultQueryClient?:
  | 'lcd'
  | 'hive'
  | 'batch'
  | ((network: NetworkInfo) => 'lcd' | 'hive' | 'batch');
  lcdQueryClient?: (network: NetworkInfo) => LcdQueryClient;
  hiveQueryClient?: (network: NetworkInfo) => HiveQueryClient;

  // gas
  gasPriceEndpoint?: (network: NetworkInfo) => string;
  fallbackGasPrice?: (network: NetworkInfo) => GasPrice;

  // refetch map
  refetchMap: TxRefetchMap;

  // sentry captureException()
  txErrorReporter?: (error: unknown) => string;

  // sentry captureException()
  queryErrorReporter?: (error: unknown) => void;
}

export interface App<
  ContractAddress extends AppContractAddress,
  Constants extends AppConstants,
> {
  contractAddress: ContractAddress;
  constants: Constants;

  // functions
  lastSyncedHeight: () => Promise<number>;

  // wasm
  batchQueryClient: BatchQueryClient | undefined;
  queryClient: QueryClient | undefined;
  lcdQueryClient: LcdQueryClient;
  hiveQueryClient: HiveQueryClient;

  // gas
  gasPrice: GasPrice;

  // refetch map
  refetchMap: TxRefetchMap;

  // sentry captureException()
  txErrorReporter?: (error: unknown) => string;

  // sentry captureException()
  queryErrorReporter?: (error: unknown) => void;
}

const AppContext: Context<App<any, any>> = createContext<App<any, any>>(null!);

export function AppProvider<
  ContractAddress extends AppContractAddress,
  Constants extends AppConstants,
>({
  children,
  contractAddress,
  constants,
  defaultQueryClient = 'hive',
  lcdQueryClient: _lcdQueryClient = DEFAULT_LCD_WASM_CLIENT,
  hiveQueryClient: _hiveQueryClient = DEFAULT_HIVE_WASM_CLIENT,
  gasPriceEndpoint = DEFAULT_GAS_PRICE_ENDPOINTS,
  fallbackGasPrice = DEFAULT_FALLBACK_GAS_PRICE,
  queryErrorReporter,
  txErrorReporter,
  refetchMap,
}: AppProviderProps<ContractAddress, Constants>) {
  const { network, rpcClient } = useNetwork();

  const wallet = useWallet();

  // We wait for wallet init before querying stuff
  const batchQueryClient = useBatchQuery(wallet.status == WalletStatus.INITIALIZING ? undefined : rpcClient);

  const networkBoundStates = useMemo<
    Pick<
      App<any, any>,
      | 'contractAddress'
      | 'constants'
      | 'queryClient'
      | 'lcdQueryClient'
      | 'hiveQueryClient'
    >
  >(() => {
    const lcdQueryClient = _lcdQueryClient(network);
    const hiveQueryClient = _hiveQueryClient(network);
    const queryClientType =
      typeof defaultQueryClient === 'function'
        ? defaultQueryClient(network)
        : defaultQueryClient;


    let queryClient;
    switch (queryClientType) {
      case 'lcd':
        queryClient = lcdQueryClient;
        break;
      case "hive":
        queryClient = hiveQueryClient;
        break;
      case "batch":
        queryClient = batchQueryClient
        break;
    }

    return {
      contractAddress: contractAddress(network),
      constants: constants(network),
      queryClient,
      lcdQueryClient,
      hiveQueryClient,
    };
  }, [
    _hiveQueryClient,
    _lcdQueryClient,
    constants,
    contractAddress,
    defaultQueryClient,
    network,
    batchQueryClient
  ]);

  const lastSyncedHeight = useMemo(() => {
    if (!networkBoundStates.queryClient) {
      return async () => 0;
    }
    return () => lastSyncedHeightQuery(networkBoundStates.queryClient!);
  }, [networkBoundStates.queryClient]);

  const {
    data: gasPrice = fallbackGasPrice(network) ?? fallbackGasPrice(network),
  } = useGasPriceQuery(
    gasPriceEndpoint(network) ?? gasPriceEndpoint(network),
    queryErrorReporter,
  );

  const states = useMemo<App<any, any>>(() => {
    return {
      ...networkBoundStates,
      lastSyncedHeight,
      txErrorReporter,
      queryErrorReporter,
      gasPrice,
      refetchMap,
      batchQueryClient
    };
  }, [
    gasPrice,
    lastSyncedHeight,
    networkBoundStates,
    queryErrorReporter,
    refetchMap,
    txErrorReporter,
    batchQueryClient
  ]);

  return <AppContext.Provider value={states}>{children}</AppContext.Provider>;
}

export function useApp<
  ContractAddress extends AppContractAddress = AppContractAddress,
  Constants extends AppConstants = AppConstants,
>(): App<ContractAddress, Constants> {
  return useContext(AppContext);
}

export const AppConsumer: Consumer<App<any, any>> = AppContext.Consumer;
