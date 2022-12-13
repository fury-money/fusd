import {
  BorrowBorrower,
  borrowProvideCollateralForm,
} from '@anchor-protocol/app-fns';
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
import { useBorrowBorrowerQuery } from '../../queries/borrow/borrower';
import { useBorrowMarketQuery } from '../../queries/borrow/market';

export function useBorrowProvideCollateralForm(
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
    borrowProvideCollateralForm,
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
    () => ({ depositAmount: '' as bAsset }),
  );
}
