import { formatUSTWithPostfixUnits } from '@anchor-protocol/notation';
import {
  aUST,
  UST,
  Gas,
  HumanAddr,
  Rate,
  u,
  CW20Addr,
  NativeDenom,
  Token,
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
import { floor } from '@libs/big-math';
import { demicrofy, formatTokenInput } from '@libs/formatter';
import { QueryClient } from '@libs/query-client';
import { pipe } from '@rx-stream/pipe';
import {
  Coin,
  Coins,
  CreateTxOptions,
  Fee,
  MsgExecuteContract,
} from '@terra-money/terra.js';
import { NetworkInfo, TxResult } from '@terra-money/wallet-provider';
import { Observable } from 'rxjs';
import big, { BigSource } from 'big.js';

export function placeLiquidationBidTx($: {
  walletAddr: HumanAddr;
  liquidationQueueAddr: HumanAddr;
  depositAmount: UST;
  premium: number;
  bLunaAddr: CW20Addr;
  stableDenom: NativeDenom;

  gasFee: Gas;
  gasAdjustment: Rate<number>;
  txFee: u<UST>;
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
        new MsgExecuteContract(
          $.walletAddr,
          $.liquidationQueueAddr,
          {
            // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L65
            submit_bid: {
              collateral_token: $.bLunaAddr,
              premium_slot: $.premium,
            },
          },

          // coins
          new Coins([
            new Coin(
              $.stableDenom,
              formatTokenInput(big($.depositAmount) as Token<BigSource>),
            ),
          ]),
        ),
      ],
      fee: new Fee($.gasFee, floor($.txFee) + 'uluna'),
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
        const depositAmount = pickAttributeValue<u<UST>>(fromContract, 3);

        const bidIdx = pickAttributeValue<u<aUST>>(fromContract, 2);

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            depositAmount && {
              name: 'Deposit Amount',
              value:
                formatUSTWithPostfixUnits(demicrofy(depositAmount)) +
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
