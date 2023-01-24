import { BidByUser, bidsByUserQuery } from '@anchor-protocol/app-fns';
import { ANCHOR_QUERY_KEY, useAnchorWebapp } from '@anchor-protocol/app-provider';
import { 
  QueryClient, wasmFetch, WasmQuery, WasmQueryData } from '@libs/query-client';
import { createQueryFn } from '@libs/react-query-utils';
import { CW20Addr, HumanAddr } from '@libs/types';
import { useAccount } from 'contexts/account';
import { useQuery, UseQueryResult } from 'react-query';

export interface NFTInfo {
  nft_info: {
   token_id: string
  };
}

/**
 * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidsbyuserresponse
 */
export interface NFTInfoResponse {
  token_uri: string,
  extension: {
    image: string | null,
    image_data: string | null,
    external_url: string | null,
    description: string | null,
    name: string | null,
    attributes: null,
    background_color: string | null,
    animattion_url: string | null,
    youtube_url: string | null,
  }
}

interface NftInfoWasmQuery {
  nftInfo: WasmQuery<
    NFTInfo,
    NFTInfoResponse
  >;
}

export type NftInfo = WasmQueryData<NftInfoWasmQuery>;

export async function whitePaperQuery(
  queryClient: QueryClient,
  nftAddress: string,
  tokenId: string,
): Promise<NftInfo> {
  return wasmFetch<NftInfoWasmQuery>({
    ...queryClient,
    id: `white-paper`,
    wasmQuery: {
      nftInfo: {
        contractAddress: nftAddress,
        query: {
          nft_info: {
           token_id: tokenId
          },
        },
      },
    },
  });
}


export function useWhitePaperQuery(): UseQueryResult<NftInfo | undefined> {
  const { queryClient, queryErrorReporter, contractAddress } =
    useAnchorWebapp();


  const whitePaperInfo = useQuery(
    [
      ANCHOR_QUERY_KEY.WHITEPAPER_QUERY,
      contractAddress.documents.mainAddress,
      contractAddress.documents.tokens.whitepaper,
    ],
    createQueryFn(whitePaperQuery, queryClient),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    },
  );

  return whitePaperInfo;
}
