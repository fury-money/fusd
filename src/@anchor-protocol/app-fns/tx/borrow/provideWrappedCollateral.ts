import {
  computeBorrowedAmount,
  computeBorrowLimit,
  computeLtv,
} from "@anchor-protocol/app-fns";
import {
  formatInput,
  formatOutput,
  microfy,
  demicrofy,
} from "@anchor-protocol/formatter";
import {
  bAsset,
  aLuna,
  Gas,
  HumanAddr,
  Rate,
  u,
  UST,
  Token,
  CW20Addr,
} from "@anchor-protocol/types";
import {
  pickAttributeValue,
  pickAttributeValueByKey,
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
  createHookMsg,
  TxHelper,
} from "@libs/app-fns/tx/internal";
import { floor } from "@libs/big-math";
import { formatRate } from "@libs/formatter";
import { QueryClient } from "@libs/query-client";
import { pipe } from "@rx-stream/pipe";
import {
  CreateTxOptions,
  Fee,
  MsgExecuteContract,
} from "@terra-money/terra.js";
import { NetworkInfo, TxResult } from "@terra-money/wallet-provider";
import { WhitelistWrappedCollateral } from "queries";
import { QueryObserverResult } from "react-query";
import { Observable } from "rxjs";
import { BorrowBorrower } from "../../queries/borrow/borrower";
import { BorrowMarket } from "../../queries/borrow/market";
import { _fetchBorrowData } from "./_fetchBorrowData";
import big from "big.js";

export function getWrappedCollateralMessages(
  walletAddr: HumanAddr,
  depositAmount: bAsset,
  lunaAmount: u<bAsset>,
  underlyingToken: CW20Addr,
  collateralToken: CW20Addr,
  custodyContract: HumanAddr,
  overseerAddr: HumanAddr,
  decimals: number
) {
  return [
    // Raise allowance on the actual token
    new MsgExecuteContract(walletAddr, underlyingToken, {
      increase_allowance: {
        spender: collateralToken,
        amount: formatInput(microfy(depositAmount, decimals), decimals),
      },
    }),
    // Wrap the tokens
    new MsgExecuteContract(walletAddr, collateralToken, {
      mint_with: {
        recipient: walletAddr,
        lsd_amount: formatInput(microfy(depositAmount, decimals), decimals),
      },
    }),
    // provide_collateral call
    new MsgExecuteContract(walletAddr, collateralToken, {
      send: {
        contract: custodyContract,
        amount: formatInput(lunaAmount, decimals),
        msg: createHookMsg({
          deposit_collateral: {},
        }),
      },
    }),
    // lock_collateral call
    new MsgExecuteContract(walletAddr, overseerAddr, {
      // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/overseer/src/msg.rs#L75
      lock_collateral: {
        collaterals: [[collateralToken, formatInput(lunaAmount, decimals)]],
      },
    }),
  ];
}

export function borrowProvideWrappedCollateralTx($: {
  collateral: WhitelistWrappedCollateral;
  walletAddr: HumanAddr;
  depositAmount: bAsset;
  lunaAmount: u<bAsset>;
  exchangeRate: Rate;
  overseerAddr: HumanAddr;
  gasFee: Gas;
  gasAdjustment: Rate<number>;
  fixedGas: u<UST>;
  network: NetworkInfo;
  queryClient: QueryClient;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  txErrorReporter?: (error: unknown) => string;
  borrowMarketQuery: () => Promise<
    QueryObserverResult<BorrowMarket | undefined>
  >;
  borrowBorrowerQuery: () => Promise<
    QueryObserverResult<BorrowBorrower | undefined>
  >;
  onTxSucceed?: () => void;
}): Observable<TxResultRendering> {
  const helper = new TxHelper({ ...$, txFee: $.fixedGas });

  return pipe(
    _createTxOptions({
      msgs: getWrappedCollateralMessages(
        $.walletAddr,
        $.depositAmount,
        $.lunaAmount,
        $.collateral.info.info.tokenAddress as CW20Addr,
        $.collateral.collateral_token,
        $.collateral.custody_contract,
        $.overseerAddr,
        $.collateral.decimals
      ),
      fee: new Fee($.gasFee, floor($.fixedGas) + "uluna"),
      gasAdjustment: $.gasAdjustment,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    _fetchBorrowData({ helper, ...$ }),
    ({ value: { txInfo, borrowMarket, borrowBorrower } }) => {
      if (!borrowMarket || !borrowBorrower) {
        return helper.failedToCreateReceipt(
          new Error("Failed to load borrow data")
        );
      }

      const rawLog = pickRawLog(txInfo, 3);

      if (!rawLog) {
        return helper.failedToFindRawLog();
      }

      const fromContract = pickEvent(rawLog, "from_contract");

      if (!fromContract) {
        return helper.failedToFindEvents("from_contract");
      }

      try {
        const collateralizedAmount = pickAttributeValueByKey<u<aLuna>>(
          fromContract,
          "amount"
        );
        const depositedAmount = big(collateralizedAmount ?? "0")
          .div($.exchangeRate)
          .toString() as u<aLuna>;

        const ltv = computeLtv(
          computeBorrowLimit(
            borrowBorrower.overseerCollaterals,
            borrowMarket.oraclePrices,
            borrowMarket.bAssetLtvs
          ),
          computeBorrowedAmount(borrowBorrower.marketBorrowerInfo)
        );

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            depositedAmount && {
              name: "Deposited Amount",
              value: `${formatOutput(
                demicrofy(depositedAmount, $.collateral.decimals),
                { decimals: $.collateral.decimals }
              )} ${$.collateral.info.info.symbol}`,
            },
            collateralizedAmount && {
              name: "Collateralized Amount",
              value: `${formatOutput(
                demicrofy(collateralizedAmount, $.collateral.decimals),
                { decimals: $.collateral.decimals }
              )} ${$.collateral.symbol}`,
            },
            ltv && {
              name: "New Borrow Usage",
              value: formatRate(ltv) + " %",
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
