import { Gas, HumanAddr, Rate, u, UST } from "@anchor-protocol/types";
import {
  pickEvent,
  pickRawLog,
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
} from "@terra-money/feather.js";
import { TxResult } from "@terra-money/feather.js";
import { NetworkInfo } from "utils/consts";
import { SwapResponse } from "pages/swap/queries/tfmQueries";
import { Observable } from "rxjs";
import { PostResponse } from "@terra-money/wallet-kit";

const TFM_ROUTER_ADDRESS =
  "terra19hz374h6ruwtzrnm8ytkae782uv79h9yt9tuytgvt94t26c4793qnfg7vn";

export function getTFMSwapMsg(simulation: SwapResponse, walletAddr: HumanAddr) {
  if (simulation?.value.coins[0]) {
    return new MsgExecuteContract(
      walletAddr,
      TFM_ROUTER_ADDRESS,
      simulation?.value.execute_msg,
      `${simulation?.value.coins[0].amount}${simulation?.value.coins[0].denom}`
    );
  } else {
    return new MsgExecuteContract(walletAddr, simulation.value.contract, {
      ...simulation?.value.execute_msg,
      send: {
        ...simulation?.value.execute_msg.send,
        contract: TFM_ROUTER_ADDRESS,
      },
    });
  }
}

export function tfmSwapTx($: {
  walletAddr: HumanAddr;

  simulation: SwapResponse;

  gasFee: Gas;
  gasAdjustment: Rate<number>;
  fixedGas: u<UST>;
  network: NetworkInfo;
  queryClient: QueryClient;
  post: (tx: CreateTxOptions) => Promise<PostResponse>;
  txErrorReporter?: (error: unknown) => string;
  onTxSucceed?: () => void;
}): Observable<TxResultRendering> {
  const helper = new TxHelper({ ...$, txFee: $.fixedGas });

  return pipe(
    _createTxOptions({
      msgs: [getTFMSwapMsg($.simulation, $.walletAddr)],
      fee: new Fee($.gasFee, floor($.fixedGas) + "uluna"),
      gasAdjustment: $.gasAdjustment,
      chainID: $.network.chainID,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    ({ value: txInfo }) => {
      const rawLog = pickRawLog(txInfo, 0);

      if (!rawLog) {
        return helper.failedToFindRawLog();
      }

      const fromContract = pickEvent(rawLog, "from_contract");

      if (!fromContract) {
        return helper.failedToFindEvents("from_contract");
      }

      try {
        return {
          value: null,
          phase: TxStreamPhase.SUCCEED,
          receipts: [helper.txHashReceipt(), helper.txFeeReceipt()],
        } as TxResultRendering;
      } catch (error) {
        return helper.failedToParseTxResult();
      }
    }
  )().pipe(_catchTxError({ helper, ...$ }));
}
