import { formatUSTWithPostfixUnits } from '@anchor-protocol/notation';
import {
  aUST,
  UST,
  Gas,
  HumanAddr,
  Rate,
  u,
  CW20Addr,
  Luna,
} from '@anchor-protocol/types';
import {
  pickAttributeValue,
  pickEvent,
  pickRawLog,
  TxResultRendering,
  TxStreamPhase,
} from '@libs/app-fns';
import {
  _catchTxError,
  _createTxOptions,
  _pollTxInfo,
  _postTx,
  TxHelper,
} from '@libs/app-fns/tx/internal';
import { demicrofy } from '@libs/formatter';
import { QueryClient } from '@libs/query-client';
import { pipe } from '@rx-stream/pipe';
import { CreateTxOptions, MsgExecuteContract } from '@terra-money/terra.js';
import { NetworkInfo, TxResult } from '@terra-money/wallet-provider';
import { Observable } from 'rxjs';

export function withdrawLiquidationBidTx($: {
  walletAddr: HumanAddr;
  liquidationQueueAddr: HumanAddr;
  bid_idx: string;
  bLunaAddr: CW20Addr;

  txFee: u<Luna>;
  gasFee: Gas;
  gasAdjustment: Rate<number>;
  network: NetworkInfo;
  queryClient: QueryClient;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  txErrorReporter?: (error: unknown) => string;
  onTxSucceed?: () => void;
}): Observable<TxResultRendering> {
  const helper = new TxHelper($);

  return pipe(
    _createTxOptions({
      msgs: [
        new MsgExecuteContract($.walletAddr, $.liquidationQueueAddr, {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L65
          retract_bid: {
            bid_idx: $.bid_idx,
          },
        }),
      ],
      gasAdjustment: $.gasAdjustment,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    ({ value: txInfo }) => {
      const rawLog = pickRawLog(txInfo, 0);

      if (!rawLog) {
        return helper.failedToFindRawLog();
      }

      const fromContract = pickEvent(rawLog, 'from_contract');

      if (!fromContract) {
        return helper.failedToFindEvents('from_contract');
      }

      try {
        const withdrawAmount = pickAttributeValue<u<UST>>(fromContract, 3);

        const bidIdx = pickAttributeValue<u<aUST>>(fromContract, 2);

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            withdrawAmount && {
              name: 'Withdraw Amount',
              value:
                formatUSTWithPostfixUnits(demicrofy(withdrawAmount)) +
                ' axlUSDC',
            },
            bidIdx && {
              name: 'Bid Id',
              value: bidIdx,
            },
            helper.txHashReceipt(),
            helper.txFeeReceipt(),
          ],
        } as TxResultRendering;
      } catch (error) {
        return helper.failedToParseTxResult();
      }
    },
  )().pipe(_catchTxError({ helper, ...$ }));
}
