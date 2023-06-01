import {
  useBorrowBorrowerQuery,
  useBorrowMarketQuery,
} from '@anchor-protocol/app-provider';
import {
  useFormatters,
  formatOutput,
  demicrofy,
} from '@anchor-protocol/formatter';
import { PossibleLpIcon, TokenIcon } from '@anchor-protocol/token-icons';
import { bAsset, u, UST } from '@anchor-protocol/types';
import { BorderButton } from '@libs/neumorphism-ui/components/BorderButton';
import { HorizontalScrollTable } from '@libs/neumorphism-ui/components/HorizontalScrollTable';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { Section } from '@libs/neumorphism-ui/components/Section';
import { UIElementProps } from '@libs/ui';
import { Launch } from '@mui/icons-material';
import big, { Big, BigSource } from 'big.js';
import { BuyLink } from 'components/BuyButton';
import { useAccount } from 'contexts/account';
import { useWhitelistCollateralQuery, WhitelistCollateral } from 'queries';
import React, { useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { microfyPrice } from 'utils/microfyPrice';
import { useCollaterals } from './useCollaterals';
import { useProvideCollateralDialog } from './useProvideCollateralDialog';
import { useRedeemCollateralDialog } from './useRedeemCollateralDialog';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function CollateralList(props: UIElementProps) {
  const { className } = props;

  const { connected } = useAccount();

  const { data: borrowMarket } = useBorrowMarketQuery();

  const { data: borrowBorrower } = useBorrowBorrowerQuery();

  // For aLuna and usual collateral tokens that suffice for providing
  const [openProvideCollateralDialog, provideCollateralDialogElement] =
    useProvideCollateralDialog();

  const [openRedeemCollateralDialog, redeemCollateralDialogElement] =
    useRedeemCollateralDialog();


  const {
    ust: { formatOutput: formatUSTOutput, demicrofy: demicrofyUST },
  } = useFormatters();

  const collaterals = useCollaterals();

  // If a user wants to open the provide dialog directly, they need to use
  //  ?provide=${collateral_address}

  const query = useQuery(); // If the provide argument is there, we open the provide dialog
  const [searchParams, setSearchParams] = useSearchParams(); 

  useEffect(() => {
    // For providing collateral directly
    const collateralProvideAddress = query.get("provide");
    const collateralProvide = collaterals.find((c) => c.collateral.collateral_token == collateralProvideAddress)
    if(collateralProvide && !provideCollateralDialogElement && borrowMarket && borrowBorrower){
      openProvideCollateralDialog({
          collateral: collateralProvide.collateral,
          fallbackBorrowMarket: borrowMarket,
          fallbackBorrowBorrower: borrowBorrower,
        })
        setSearchParams()
    }

    // For redeeming collateral directly
    const collateralRedeemAddress = query.get("redeem");
    const collateralRedeem = collaterals.find((c) => c.collateral.collateral_token == collateralRedeemAddress)
    if(collateralRedeem && !provideCollateralDialogElement && borrowMarket && borrowBorrower){
      openRedeemCollateralDialog({
          collateral: collateralRedeem.collateral,
          fallbackBorrowMarket: borrowMarket,
          fallbackBorrowBorrower: borrowBorrower,
        })
        setSearchParams()
    }

  }, [collaterals, query, borrowMarket, borrowBorrower, provideCollateralDialogElement, openProvideCollateralDialog])



  // ---------------------------------------------
  // presentation
  // ---------------------------------------------
  return (
    <Section className={className}>
      <HorizontalScrollTable minWidth={850}>
        <colgroup>
          <col style={{ width: 200 }} />
          <col style={{ width: 200 }} />
          <col style={{ width: 200 }} />
          <col style={{ width: 250 }} />
        </colgroup>
        <thead>
          <tr>
            <th>COLLATERAL LIST</th>
            <th>
              <IconSpan>
                Price{' '}
                <InfoTooltip>
                  Current price of aAsset / Price of aAsset that will trigger
                  liquidation of current loan
                </InfoTooltip>
              </IconSpan>
            </th>
            <th>
              <IconSpan>
                Provided{' '}
                <InfoTooltip>
                  Value of aAsset collateral deposited by user / Amount of
                  aAsset collateral deposited by user
                </InfoTooltip>
              </IconSpan>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {collaterals.map(
            ({
              collateral,
              price,
              liquidationPrice,
              lockedAmount,
              lockedAmountInUST,
            }) => (
              <tr key={collateral.collateral_token}>
                <td>
                  <i>
                  <PossibleLpIcon icon={collateral.icon} />
                  </i>
                  <div>
                    <div className="coin">
                      {collateral.symbol}
                    </div>
                    <p className="name">{collateral.name}</p>
                  </div>
                </td>
                <td>
                  <div className="value">{formatUSTOutput(price)} axlUSDC</div>
                  <p className="volatility">
                    {Boolean(Number(liquidationPrice)) &&
                      formatUSTOutput(liquidationPrice!) + ' axlUSDC'}
                  </p>
                </td>
                <td>
                  <div className="value">
                    {formatOutput(
                      demicrofy(lockedAmount, collateral.decimals),
                      {
                        decimals: 3,
                      },
                    )}{' '}
                    {collateral.symbol}
                  </div>
                  <p className="volatility">
                    {formatUSTOutput(demicrofyUST(lockedAmountInUST))} axlUSDC
                  </p>
                </td>
                <td>
                  <BorderButton
                    disabled={!connected || !borrowMarket}
                    onClick={() =>
                      borrowMarket &&
                      borrowBorrower &&
                        openProvideCollateralDialog({
                          collateral,
                          fallbackBorrowMarket: borrowMarket,
                          fallbackBorrowBorrower: borrowBorrower,
                        })
                    }
                  >
                    Provide
                  </BorderButton>
                  <BorderButton
                    disabled={
                      !connected ||
                      !borrowMarket ||
                      !borrowBorrower ||
                      big(lockedAmount).lte(0)
                    }
                    onClick={() =>
                      borrowMarket &&
                      borrowBorrower &&
                      openRedeemCollateralDialog({
                        collateral,
                        fallbackBorrowMarket: borrowMarket,
                        fallbackBorrowBorrower: borrowBorrower,
                      })
                    }
                  >
                    Withdraw
                  </BorderButton>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </HorizontalScrollTable>

      {provideCollateralDialogElement}
      {redeemCollateralDialogElement}
    </Section>
  );
}
