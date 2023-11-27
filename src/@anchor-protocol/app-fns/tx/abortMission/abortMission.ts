import { AnchorContractAddress } from "@anchor-protocol/app-provider";
import { LSDLiquidationBidsResponse } from "@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser";
import {
  formatAUSTWithPostfixUnits,
  formatUSTWithPostfixUnits,
} from "@anchor-protocol/notation";
import {
  aUST,
  UST,
  Gas,
  HumanAddr,
  Rate,
  u,
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
import { demicrofy, formatFluidDecimalPoints } from "@libs/formatter";
import { QueryClient } from "@libs/query-client";
import { pipe } from "@rx-stream/pipe";
import {
  Coin,
  Coins,
  CreateTxOptions,
  Fee,
  MsgExecuteContract,
  TxResult
} from "@terra-money/feather.js";
import { NetworkInfo } from "utils/consts";
import big, { BigSource } from "big.js";
import { CollateralInfo } from "pages/borrow/components/useCollaterals";
import { Observable } from "rxjs";
import { getLiquidationWithdrawCollateralMsg } from "../liquidate/collateral";
import _ from "lodash";
import { Big } from "big.js";
import { WithdrawableBids } from "pages/liquidation/components/useWithdrawDefaultedCollateral";
import { PostResponse } from "@terra-money/wallet-kit";

export interface AbortMissionCollaterals {
  allWithdrawableDefaultedCollaterals: ({
    collateral: CollateralInfo | undefined;
  } & WithdrawableBids)[];
  collateralsWithdrawAmount: {
    collateral: CollateralInfo | undefined;
    amount: u<Token<Big>>;
  }[];
}

export type AbortMissionMessagesParams = {
  walletAddr: HumanAddr;
  totalAUST: u<aUST>;
  contractAddress: AnchorContractAddress;
  allLiquidationBids: LSDLiquidationBidsResponse;

  borrowedValue: u<UST<Big>>;
  uaUST: u<aUST<string>>;
} & AbortMissionCollaterals;

export function getAbortMissionMessages({
  walletAddr,
  totalAUST,
  contractAddress,
  allLiquidationBids,
  allWithdrawableDefaultedCollaterals,
  collateralsWithdrawAmount,
  borrowedValue,
  uaUST,
}: AbortMissionMessagesParams) {
  const redeemMsg =
    totalAUST && totalAUST != "0"
      ? [
          new MsgExecuteContract(walletAddr, contractAddress.cw20.aUST, {
            send: {
              contract: contractAddress.moneyMarket.market,
              amount: uaUST,
              msg: createHookMsg({
                redeem_stable: {},
              }),
            },
          }),
        ]
      : [];

  const liquidationMsgs = allLiquidationBids
    .map((liq) => {
      return (
        liq?.bids?.bidByUser.bids.map((bid) => {
          return new MsgExecuteContract(
            walletAddr,
            contractAddress.liquidation.liquidationQueueContract,
            {
              retract_bid: {
                bid_idx: bid.idx,
              },
            }
          );
        }) ?? []
      );
    })
    .flat();

  const collateralLiquidationMsgs = allWithdrawableDefaultedCollaterals
    .map(({ collateral, withdrawableLSD, withdrawableUnderlying }) =>
      getLiquidationWithdrawCollateralMsg({
        walletAddr,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        collateral,
        withdrawLpAssets: true,
        withdrawableLSD,
        withdrawableUnderlying,
      })
    )
    .flat();

  const repayMsg =
    borrowedValue && borrowedValue.gt("0")
      ? [
          new MsgExecuteContract(
            walletAddr,
            contractAddress.moneyMarket.market,
            {
              repay_stable: {},
            },
            new Coins([
              new Coin(contractAddress.native.usd, borrowedValue.toString()),
            ])
          ),
        ]
      : [];

  const unlockCollateralMsgs = new MsgExecuteContract(
    walletAddr,
    contractAddress.moneyMarket.overseer,
    {
      // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/overseer/src/msg.rs#L78
      unlock_collateral: {
        collaterals: collateralsWithdrawAmount.map(({ collateral }) => [
          collateral?.collateral.collateral_token,
          collateral?.rawLockedAmount,
        ]),
      },
    }
  );

  const withdrawCollateralMsgs = collateralsWithdrawAmount
    .map(({ collateral }) => {
      if (!collateral?.rawLockedAmount || collateral?.rawLockedAmount == "0") {
        return [];
      }
      return _.compact([
        // withdraw from custody
        new MsgExecuteContract(
          walletAddr,
          collateral.collateral.custody_contract,
          {
            // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/custody/src/msg.rs#L69
            withdraw_collateral: {
              amount: collateral.rawLockedAmount,
            },
          }
        ),
        "info" in collateral.collateral
          ? // Burn the tokens to get back the underlying token
            new MsgExecuteContract(
              walletAddr,
              collateral.collateral.info.token,
              {
                // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/custody/src/msg.rs#L69
                burn_all: {},
              }
            )
          : undefined,
      ]);
    })
    .flat();

  return _.compact(
    // 1. We start by withdrawing all funds in earn
    redeemMsg
      // 2. We then withdraw all deposits in the liquidation queue
      .concat(liquidationMsgs)
      // 3. Withdraw all collaterals in the liquidation queue
      .concat(collateralLiquidationMsgs)
      // 4. Repay all the debts you incurred in the borrow Tab (using the funds you have just withdrawn + your wallet content)
      .concat(repayMsg)
      // 5. Unlock all collaterals
      .concat(unlockCollateralMsgs)
      // 6. Withdraw all collaterals you deposited on the borrow Tab (this will not unwrap aLuna collaterals)
      .concat(withdrawCollateralMsgs)
  );
}

export function abortMissionTx(
  $: {
    walletAddr: HumanAddr;
    totalAUST: u<aUST>;
    contractAddress: AnchorContractAddress;
    allLiquidationBids: LSDLiquidationBidsResponse;
    borrowedValue: u<UST<Big>>;
    uaUST: u<aUST<string>>;

    gasFee: Gas;
    gasAdjustment: Rate<number>;
    txFee: u<UST>;
    network: NetworkInfo;
    queryClient: QueryClient;
    post: (tx: CreateTxOptions) => Promise<PostResponse>;
    txErrorReporter?: (error: unknown) => string;
    onTxSucceed?: () => void;
  } & AbortMissionCollaterals
): Observable<TxResultRendering> {
  const helper = new TxHelper($);

  return pipe(
    _createTxOptions({
      msgs: getAbortMissionMessages({
        walletAddr: $.walletAddr,
        totalAUST: $.totalAUST,
        contractAddress: $.contractAddress,
        allLiquidationBids: $.allLiquidationBids,
        allWithdrawableDefaultedCollaterals:
          $.allWithdrawableDefaultedCollaterals,
        collateralsWithdrawAmount: $.collateralsWithdrawAmount,
        borrowedValue: $.borrowedValue,
        uaUST: $.uaUST,
      }),
      fee: new Fee($.gasFee, floor($.txFee) + "uluna"),
      gasAdjustment: $.gasAdjustment,
      chainID: $.network.chainID
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
        const depositAmount = pickAttributeValue<u<UST>>(fromContract, 4);

        const receivedAmount = pickAttributeValue<u<aUST>>(fromContract, 3);

        const exchangeRate =
          depositAmount &&
          receivedAmount &&
          (big(depositAmount).div(receivedAmount) as
            | Rate<BigSource>
            | undefined);

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            depositAmount && {
              name: "Deposit Amount",
              value:
                formatUSTWithPostfixUnits(demicrofy(depositAmount)) +
                " axlUSDC",
            },
            receivedAmount && {
              name: "Received Amount",
              value:
                formatAUSTWithPostfixUnits(demicrofy(receivedAmount)) +
                " aUSDC",
            },
            exchangeRate && {
              name: "Exchange Rate",
              value: formatFluidDecimalPoints(exchangeRate, 6),
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
