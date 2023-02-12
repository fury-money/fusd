import { aluna, HumanAddr } from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface WithdrawableAmountWasmQuery {
  withdrawableUnbonded: WasmQuery<
    aluna.hub.WithdrawableUnbonded,
    aluna.hub.WithdrawableUnbondedResponse
  >;
  unbondedRequests: WasmQuery<
    aluna.hub.UnbondRequests,
    aluna.hub.UnbondRequestsResponse
  >;
}

interface WithdrawableHistoryWasmQuery {
  allHistory: WasmQuery<aluna.hub.AllHistory, aluna.hub.AllHistoryResponse>;
  parameters: WasmQuery<aluna.hub.Parameters, aluna.hub.ParametersResponse>;
}

type BLunaWithdrawableAmountWasmQuery = WithdrawableAmountWasmQuery &
  WithdrawableHistoryWasmQuery;

export type BLunaWithdrawableAmount = Omit<
  WasmQueryData<BLunaWithdrawableAmountWasmQuery>,
  'parameters'
> & {
  unbondedRequestsStartFrom: number;
  parameters?: aluna.hub.ParametersResponse;
};

export async function aLunaWithdrawableAmountQuery(
  queryClient: QueryClient,
  walletAddr: HumanAddr | undefined,
  aLunaHubContract: HumanAddr,
): Promise<BLunaWithdrawableAmount | undefined> {
  if (!walletAddr) {
    return undefined;
  }

  const { withdrawableUnbonded, unbondedRequests } =
    await wasmFetch<WithdrawableAmountWasmQuery>({
      ...queryClient,
      id: `bond--withdrawable-requests`,
      wasmQuery: {
        withdrawableUnbonded: {
          contractAddress: aLunaHubContract,
          query: {
            withdrawable_unbonded: {
              block_time: Math.floor(Date.now() / 1000),
              address: walletAddr,
            },
          },
        },
        unbondedRequests: {
          contractAddress: aLunaHubContract,
          query: {
            unbond_requests: {
              address: walletAddr,
            },
          },
        },
      },
    });

  const unbondedRequestsStartFrom: number =
    unbondedRequests.requests.length > 0
      ? Math.max(
          0,
          Math.min(...unbondedRequests.requests.map(([index]) => index)) - 1,
        )
      : 0;

  if (unbondedRequestsStartFrom > 0) {
    const { allHistory, parameters } =
      await wasmFetch<WithdrawableHistoryWasmQuery>({
        ...queryClient,
        id: `bond--withdraw-history`,
        wasmQuery: {
          allHistory: {
            contractAddress: aLunaHubContract,
            query: {
              all_history: {
                start_from: unbondedRequestsStartFrom,
                limit: 100,
              },
            },
          },
          parameters: {
            contractAddress: aLunaHubContract,
            query: {
              parameters: {},
            },
          },
        },
      });

    return {
      withdrawableUnbonded,
      unbondedRequests,
      unbondedRequestsStartFrom,
      allHistory,
      parameters,
    };
  } else {
    return {
      withdrawableUnbonded,
      unbondedRequests,
      unbondedRequestsStartFrom,
      allHistory: {
        history: [],
      },
    };
  }
}
