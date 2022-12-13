import {
  BorrowBorrower,
  borrowRedeemCollateralForm,
} from '@anchor-protocol/app-fns';
import { useBorrowBorrowerQuery } from '@anchor-protocol/app-provider/queries/borrow/borrower';
import { useBorrowMarketQuery } from '@anchor-protocol/app-provider/queries/borrow/market';
import {
  BorrowMarketWithDisplay,
  useAnchorBank,
} from '@anchor-protocol/app-provider';
import { bAsset } from '@anchor-protocol/types';
import { useFixedFee } from '@libs/app-provider';
import { u } from '@libs/types';
import { useForm } from '@libs/use-form';
import { useAccount } from 'contexts/account';
import { WhitelistCollateral } from 'queries';

export function useBorrowRedeemCollateralForm(
  collateral: WhitelistCollateral,
  balance: u<bAsset>,
  fallbackBorrowMarket: BorrowMarketWithDisplay,
  fallbackBorrowBorrower: BorrowBorrower,
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

  return useForm(
    borrowRedeemCollateralForm,
    {
      collateral,
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
    () => ({ redeemAmount: '' as bAsset }),
  );
}
