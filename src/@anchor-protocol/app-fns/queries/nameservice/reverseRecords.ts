import { nameservice } from "@anchor-protocol/types/contracts/nameservice";
import { QueryClient, wasmFetch, WasmQuery, WasmQueryData } from "@libs/query-client";
import { HumanAddr } from "@libs/types";

interface ReverseRecordsWasmQuery {
  reverseRecords: WasmQuery<
    nameservice.nameserviceContract.ReverseRecords,
    nameservice.nameserviceContract.ReverseRecordsResponse
  >;
}

export type ReverseRecords = WasmQueryData<ReverseRecordsWasmQuery>;


export async function reverseRecordsQuery(
  	queryClient: QueryClient,
  	nameServiceAddress: HumanAddr,
		addresses: string[]
): Promise<ReverseRecords> {

	return wasmFetch<ReverseRecordsWasmQuery>({
	    ...queryClient,
	    id: `nameservice--reverse-records`,
	    wasmQuery: {
	      reverseRecords: {
	        contractAddress: nameServiceAddress,
	        query: {
	          reverse_records: {
	            addresses
	          },
	        },
	      },
	    },
	});
}