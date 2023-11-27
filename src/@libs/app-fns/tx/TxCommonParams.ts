import { QueryClient } from "@libs/query-client";
import { Gas, Rate, u, UST } from "@libs/types";
import { 
  TxResult
} from "@terra-money/feather.js";
import { NetworkInfo } from "utils/consts";
import { CreateTxOptions } from "@terra-money/feather.js";
import { PostResponse } from "@terra-money/wallet-kit";

export interface TxCommonParams {
  // tx
  txFee: u<UST>;
  gasWanted: Gas;
  gasAdjustment: Rate<number>;
  fixedFee: u<UST<string | number>>;
  // network
  network: NetworkInfo;
  queryClient: QueryClient;
  post: (tx: CreateTxOptions) => Promise<PostResponse>;
  // error handle
  txErrorReporter?: (error: unknown) => string;
}
