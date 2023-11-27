import { QueryClient } from "@libs/query-client";
import { TxResultRendering, TxStreamPhase } from "../../models/tx";
import { pollTxInfo, TxInfoData } from "../../queries/txInfo";
import { TxHelper } from "./TxHelper";
import { PostResponse } from "@terra-money/wallet-kit";

interface Params {
  helper: TxHelper;
  queryClient: QueryClient;
  onTxSucceed?: () => void;
}

export function _pollTxInfo({ helper, queryClient, onTxSucceed }: Params) {
  return ({ value: txResult }: TxResultRendering<PostResponse>) => {
    return pollTxInfo({
      queryClient,
      tx: helper.savedTx,
      txhash: txResult.txhash,
    }).then((txInfo) => {
      onTxSucceed?.();

      return {
        value: txInfo,

        phase: TxStreamPhase.SUCCEED,
        receipts: [helper.txHashReceipt(), helper.txFeeReceipt()],
      } as TxResultRendering<TxInfoData>;
    });
  };
}
