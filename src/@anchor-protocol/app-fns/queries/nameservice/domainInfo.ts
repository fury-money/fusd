import { nameservice } from "@anchor-protocol/types/contracts/nameservice";
import { QueryClient, wasmFetch, WasmQuery, WasmQueryData } from "@libs/query-client";
import { HumanAddr } from "@libs/types";

interface DomainInfoWasmQuery {
  domainInfo: WasmQuery<
    nameservice.nameserviceContract.NftInfo,
    nameservice.nameserviceContract.NftInfoResponse
  >;
}

export type DomainInfo = WasmQueryData<DomainInfoWasmQuery>;


export async function domainInfoQuery(
  	queryClient: QueryClient,
  	nameServiceAddress: HumanAddr,
	tokenId: string
): Promise<DomainInfo> {
	console.log(tokenId)

	return wasmFetch<DomainInfoWasmQuery>({
	    ...queryClient,
	    id: `nameservice--domain-info`,
	    wasmQuery: {
	      domainInfo: {
	        contractAddress: nameServiceAddress,
	        query: {
	          nft_info: {
	            token_id: tokenId
	          },
	        },
	      },
	    },
	});
}