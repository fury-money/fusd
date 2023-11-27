import { txTimeout } from "@libs/tx-helpers";
import { CreateTxOptions } from "@terra-money/feather.js";
import { TxResultRendering, TxStreamPhase } from "../../models/tx";
import { TxHelper } from "./TxHelper";
import { PostResponse } from "@terra-money/wallet-kit";

interface Params {
  helper: TxHelper;
  post: (tx: CreateTxOptions) => Promise<PostResponse>;
}

export function _postTx({ helper, post }: Params) {
  return ({ value: tx }: TxResultRendering<CreateTxOptions>) => {
    helper.saveTx(tx);

    return Promise.race<PostResponse>([
      //post({ ...tx, isClassic: true } as CreateTxOptions),
      post(tx),
      txTimeout<PostResponse>(),
    ]).then((txResult) => {
      helper.saveTxResult(txResult);
      return {
        value: txResult,

        phase: TxStreamPhase.BROADCAST,
        receipts: [helper.txHashReceipt()],
      } as TxResultRendering<PostResponse>;
    });
  };
}
