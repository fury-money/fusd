import { formatUSTWithPostfixUnits } from "@anchor-protocol/notation";
import {
  UST,
  Gas,
  HumanAddr,
  Rate,
  u,
  CW20Addr,
  Luna,
  Token,
} from "@anchor-protocol/types";
import {
  pickAttributeValue,
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
  createHookMsg,
} from "@libs/app-fns/tx/internal";
import { floor } from "@libs/big-math";
import { demicrofy } from "@libs/formatter";
import { QueryClient } from "@libs/query-client";
import { pipe } from "@rx-stream/pipe";
import {
  CreateTxOptions,
  Fee,
  MsgExecuteContract,
} from "@terra-money/terra.js";
import { NetworkInfo, TxResult } from "@terra-money/wallet-provider";
import { Observable } from "rxjs";
import _ from "lodash";
import { CollateralInfo } from "pages/borrow/components/useCollaterals";
import Big from "big.js";

export interface LiquidationWithdrawCollateralMsgArgs {
  walletAddr: HumanAddr;
  liquidationQueueAddr: HumanAddr;
  collateral: CollateralInfo | undefined;
  withdrawLpAssets: boolean;
  withdrawableLSD: u<Token<Big>>;
  withdrawableUnderlying: u<Token<Big>>;
}

export function getLiquidationWithdrawCollateralMsg({
  walletAddr,
  liquidationQueueAddr,
  collateral,
  withdrawLpAssets,
  withdrawableLSD,
  withdrawableUnderlying,
}: LiquidationWithdrawCollateralMsgArgs) {
  const tokenWrapperAddr =
    collateral && "info" in collateral.collateral
      ? collateral.collateral.collateral_token
      : undefined;
  const collateralToken = collateral?.collateral.collateral_token;

  /// In case we want to withdraw LP assets, we need to add the following message :
  let withdrawLpMsgs;
  if (
    withdrawLpAssets &&
    collateral &&
    "info" in collateral.collateral &&
    collateral.collateral.info.info.spectrum_lp
  ) {
    // In the case of a spectrum LP
    withdrawLpMsgs = [
      new MsgExecuteContract(
        walletAddr,
        collateral.collateral.info.info.spectrum_lp.token,
        {
          unbond: {
            amount: withdrawableUnderlying.toString(),
          },
        }
      ),
      new MsgExecuteContract(
        walletAddr,
        collateral.collateral.info.info.spectrum_lp.underlyingToken,
        {
          send: {
            contract:
              collateral.collateral.info.info.spectrum_lp.underlyingPair,
            amount: withdrawableUnderlying.toString(),
            msg: createHookMsg({
              withdraw_liquidity: { assets: [] },
            }),
          },
        }
      ),
    ];
  } else if (
    withdrawLpAssets &&
    collateral &&
    "info" in collateral.collateral &&
    collateral.collateral.info.info.amp_lp
  ) {
    // In the case of a spectrum LP
    withdrawLpMsgs = [
      new MsgExecuteContract(
        walletAddr,
        collateral.collateral.info.info.amp_lp.token,
        {
          send: {
            contract: collateral.collateral.info.info.amp_lp.hub,
            amount: withdrawableLSD.toString(),
            msg: createHookMsg({
              unbond: {},
            }),
          },
        }
      ),
      new MsgExecuteContract(
        walletAddr,
        collateral.collateral.info.info.amp_lp.underlyingToken,
        {
          send: {
            contract: collateral.collateral.info.info.amp_lp.underlyingPair,
            amount: withdrawableUnderlying.toString(),
            msg: createHookMsg({
              withdraw_liquidity: { assets: [] },
            }),
          },
        }
      ),
    ];
  }
  return _.compact(
    [
      // First message to withdraw the token from the liquidation queue
      new MsgExecuteContract(walletAddr, liquidationQueueAddr, {
        // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L65
        claim_liquidations: {
          collateral_token: collateralToken,
        },
      }),
      // Second message to swap back to the LSD token
      tokenWrapperAddr
        ? new MsgExecuteContract(walletAddr, tokenWrapperAddr, {
            burn_all: {},
          })
        : undefined,
    ].concat(withdrawLpMsgs)
  );
}

export function liquidationWithdrawCollateralTx($: {
  walletAddr: HumanAddr;
  liquidationQueueAddr: HumanAddr;

  collateral: CollateralInfo | undefined;
  withdrawableLSD: u<Token<Big>>;
  withdrawableUnderlying: u<Token<Big>>;

  withdrawLpAssets: boolean;

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
        liquidationQueueAddr: $.liquidationQueueAddr,
        withdrawLpAssets: $.withdrawLpAssets,
        collateral: $.collateral,
        withdrawableLSD: $.withdrawableLSD,
        withdrawableUnderlying: $.withdrawableUnderlying,
      }),
      fee: new Fee($.gasFee, floor($.txFee) + "uluna"),
      gasAdjustment: $.gasAdjustment,
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
        const claimAmount = pickAttributeValue<u<UST>>(fromContract, 3);

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            claimAmount && {
              name: "Claim Amount",
              value:
                formatUSTWithPostfixUnits(demicrofy(claimAmount)) + " aLuna",
            },
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
