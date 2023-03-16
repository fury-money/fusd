import { Gas, Rate, u, UST } from "@anchor-protocol/types";
import {
  TxResultRendering,
  TxStreamPhase,
} from "@libs/app-fns";
import {
  _catchTxError,
  _createTxOptions,
  _pollTxInfo,
  _postTx,
  TxHelper,
} from "@libs/app-fns/tx/internal";
import { floor } from "@libs/big-math";
import { QueryClient } from "@libs/query-client";
import { pipe } from "@rx-stream/pipe";
import {
  CreateTxOptions,
  Fee,
  MsgExecuteContract,
} from "@terra-money/terra.js";
import { NetworkInfo, TxResult } from "@terra-money/wallet-provider";
import { Observable } from "rxjs";

export function genericTx($: {

  msgs: MsgExecuteContract[],

  gasFee: Gas;
  gasAdjustment: Rate<number>;
  txFee: u<UST>;
  queryClient: QueryClient;
  network: NetworkInfo;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  txErrorReporter?: (error: unknown) => string;
  onTxSucceed?: () => void;
}): Observable<TxResultRendering> {
  const helper = new TxHelper($);

  return pipe(
    _createTxOptions({
      msgs:$.msgs,
      // FIXME borrow's txFee is fixed_gas
      fee: new Fee($.gasFee, floor($.txFee) + "uluna"),
      gasAdjustment: $.gasAdjustment,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    () => {

      try {
        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts:[
            helper.txHashReceipt(),
            helper.txFeeReceipt(),
          ],
        } as TxResultRendering;
      } catch (error) {
        return helper.failedToParseTxResult();
      }
    }
  )().pipe(_catchTxError({ helper, ...$ }));
}
