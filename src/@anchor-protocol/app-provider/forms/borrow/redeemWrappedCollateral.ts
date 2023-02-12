import {
  BorrowBorrower,
  borrowRedeemWrappedCollateralForm,
} from "@anchor-protocol/app-fns";
import { useBorrowBorrowerQuery } from "@anchor-protocol/app-provider/queries/borrow/borrower";
import { useBorrowMarketQuery } from "@anchor-protocol/app-provider/queries/borrow/market";
import {
  BorrowMarketWithDisplay,
  useAnchorBank,
} from "@anchor-protocol/app-provider";
import { bAsset } from "@anchor-protocol/types";
import { useFixedFee } from "@libs/app-provider";
import { Rate, u } from "@libs/types";
import { useForm } from "@libs/use-form";
import { useAccount } from "contexts/account";
import { WhitelistCollateral, WhitelistWrappedCollateral } from "queries";
import { useWrappedTokenDetails } from "@anchor-protocol/app-provider/queries/basset/wrappedLSDTokenDetails";

export function useBorrowRedeemWrappedCollateralForm(
  collateral: WhitelistWrappedCollateral,
  balance: u<bAsset>,
  fallbackBorrowMarket: BorrowMarketWithDisplay,
  fallbackBorrowBorrower: BorrowBorrower
) {
  const { connected } = useAccount();

  const fixedFee = useFixedFee();

  const {
    tokenBalances: { uUST, uLuna },
  } = useAnchorBank();

  const { data: { oraclePrices, bAssetLtvs } = fallbackBorrowMarket } =
    useBorrowMarketQuery();

  const {
    data: { marketBorrowerInfo, overseerCollaterals } = fallbackBorrowBorrower,
  } = useBorrowBorrowerQuery();

  const { data: details } = useWrappedTokenDetails(collateral.info);

  return useForm(
    borrowRedeemWrappedCollateralForm,
    {
      collateral,
      exchangeRate: details?.hubState.exchange_rate ?? ("0" as Rate),
      userBAssetBalance: balance,
      userUSTBalance: uUST,
      userLunaBalance: uLuna,
      connected,
      oraclePrices,
      overseerCollaterals,
      marketBorrowerInfo,
      fixedFee,
      bAssetLtvs,
    },
    () => ({ redeemAmount: "" as bAsset })
  );
}
