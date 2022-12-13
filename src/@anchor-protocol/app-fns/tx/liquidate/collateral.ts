import {
  formatUSTWithPostfixUnits,
} from '@anchor-protocol/notation';
import {
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
import { floor } from '@libs/big-math';
import {
  demicrofy,
} from '@libs/formatter';
import { QueryClient } from '@libs/query-client';
import { pipe } from '@rx-stream/pipe';
import {
  CreateTxOptions,
  Fee,
  MsgExecuteContract,
} from '@terra-money/terra.js';
import { NetworkInfo, TxResult } from '@terra-money/wallet-provider';
import { Observable } from 'rxjs';


export interface LiquidationWithdrawCollateralMsgArgs {
  walletAddr: HumanAddr,
  liquidationQueueAddr: HumanAddr,
  collateralToken: CW20Addr,
}


export function getLiquidationWithdrawCollateralMsg({walletAddr, liquidationQueueAddr, collateralToken}: LiquidationWithdrawCollateralMsgArgs){
   return [new MsgExecuteContract(
      walletAddr,
      liquidationQueueAddr,
      {
        // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L65
        claim_liquidations : {
          collateral_token : collateralToken,
        }
      },
    )];
}

export function liquidationWithdrawCollateralTx($: {
  walletAddr: HumanAddr;
  liquidationQueueAddr: HumanAddr;

  bLunaAddr: CW20Addr;

  gasFee: Gas;
  gasAdjustment: Rate<number>;
  txFee: u<Luna>;
  network: NetworkInfo;
  queryClient: QueryClient;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  txErrorReporter?: (error: unknown) => string;
  onTxSucceed?: () => void;
}): Observable<TxResultRendering> {
  const helper = new TxHelper($);
  return pipe(
    _createTxOptions({
      msgs: getLiquidationWithdrawCollateralMsg({
        walletAddr: $.walletAddr,
        liquidationQueueAddr : $.liquidationQueueAddr ,
        collateralToken : $.bLunaAddr
      }),
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
        const claimAmount = pickAttributeValue<u<UST>>(fromContract, 3);

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            claimAmount && {
              name: 'Claim Amount',
              value:
                formatUSTWithPostfixUnits(demicrofy(claimAmount)) +
                ' aLuna',
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
