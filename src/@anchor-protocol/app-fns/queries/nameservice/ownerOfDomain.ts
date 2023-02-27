import { nameservice } from "@anchor-protocol/types/contracts/nameservice";
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from "@libs/query-client";
import { HumanAddr } from "@libs/types";

interface OwnerOfWasmQuery {
  owner: WasmQuery<
    nameservice.nameserviceContract.OwnerOf,
    nameservice.nameserviceContract.OwnerOfResponse
  >;
}

export type OwnerOf = WasmQueryData<OwnerOfWasmQuery>;

export async function ownerOfDomainQuery(
  queryClient: QueryClient,
  nameServiceAddress: HumanAddr,
  tokenId: string
): Promise<OwnerOf> {
  return wasmFetch<OwnerOfWasmQuery>({
    ...queryClient,
    id: `nameservice--domain-info`,
    wasmQuery: {
      owner: {
        contractAddress: nameServiceAddress,
        query: {
          owner_of: {
            token_id: tokenId,
          },
        },
      },
    },
  });
}
