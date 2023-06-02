import { MarketCollateralsHistory } from '@anchor-protocol/app-fns';
import { LSDCollateralResponse } from '@anchor-protocol/app-provider/queries/borrow/useLSDCollateralQuery';
import {
  formatUST,
  formatUSTWithPostfixUnits,
  formatBAssetWithPostfixUnits,
} from '@anchor-protocol/notation';
import { PossibleLpIcon, TokenIcon } from '@anchor-protocol/token-icons';
import { bAsset } from '@anchor-protocol/types';
import { demicrofy } from '@libs/formatter';
import { HorizontalScrollTable } from '@libs/neumorphism-ui/components/HorizontalScrollTable';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { u, UST } from '@libs/types';
import { AnimateNumber } from '@libs/ui';
import Big from 'big.js';
import { UIElementProps } from 'components/layouts/UIElementProps';
import { WhitelistCollateral } from 'queries';
import React, { useMemo } from 'react';
import { useCollaterals } from 'pages/borrow/components/useCollaterals';

interface CollateralMarketTableProps extends UIElementProps {
  whitelistCollateral: WhitelistCollateral[];
  marketData: MarketCollateralsHistory | undefined;
  additionalLSDInfo: LSDCollateralResponse | undefined;
}

export const CollateralMarketTable = (props: CollateralMarketTableProps) => {
  const { className, additionalLSDInfo } = props;

  const queriedCollaterals = useCollaterals();

  const collaterals = useMemo(() => {
    const array = queriedCollaterals.map((collateral) => {
      
      const additionalInfo = additionalLSDInfo?.find(
        (c) => c.info?.token === collateral.collateral.collateral_token
      );

      // We exchange the token values with the one in memory for LSD
      if(additionalInfo?.info?.info?.symbol){
        collateral.collateral.symbol = additionalInfo?.info?.info?.symbol;
      }
      if(additionalInfo?.info?.info?.name){
        collateral.collateral.name = additionalInfo?.info?.info?.name;
      }
      const type = additionalInfo?.info?.type ?? "aLuna";

      const exchangeRate = parseFloat(additionalInfo?.priceInfo?.hubState?.exchange_rate ?? "1");

      const price = parseFloat(collateral.price) as UST<number>;

      const value = demicrofy(collateral.lockedAmount).div(exchangeRate) as bAsset<Big>;

      const tvl = demicrofy(Big(collateral.lockedAmount).mul(price) as u<UST<Big>>);
      console.log(tvl)
      return {
        ...collateral,
        price,
        value,
        tvl,
        type
      };
    });
    return array.sort((a, b) => {
      return Big(b.tvl).minus(Big(a.tvl)).toNumber();
    });
  }, [queriedCollaterals]);

  console.log(collaterals)
  function printCollaterals(type: string){
    return collaterals.filter((collateral) => collateral.type == type).map((collateral) => {
      return (
        <tr key={collateral.collateral.symbol}>
          <td>
            <div>
              <i>
                <PossibleLpIcon
                  icon={collateral.collateral.icon}
                />
              </i>
              <div>
                <div className="coin">{collateral.collateral.symbol}</div>
                <p className="name">{collateral.collateral.name}</p>
              </div>
            </div>
          </td>
          <td>
            <div className="value">
              ${' '}
              <AnimateNumber format={formatUST}>
                {collateral.price}
              </AnimateNumber>
            </div>
          </td>
          <td>
            <div className="value">
              <AnimateNumber format={formatBAssetWithPostfixUnits}>
                {collateral.value}
              </AnimateNumber>
            </div>
          </td>
          <td>
            <div className="value">
              ${' '}
              <AnimateNumber
                format={formatUSTWithPostfixUnits}
                id="collateral-value"
              >
                {collateral.tvl}
              </AnimateNumber>
            </div>
          </td>
        </tr>
      );
    })
  }


  return (
    <HorizontalScrollTable minWidth={800} className={className}>
      <colgroup>
        <col style={{ width: 300 }} />
        <col style={{ width: 300 }} />
        <col style={{ width: 300 }} />
        <col style={{ width: 300 }} />
      </colgroup>
      <thead>
        <tr>
          <th>COLLATERAL MARKET</th>
          <th>
            <IconSpan>
              Price <InfoTooltip>Oracle price of collateral</InfoTooltip>
            </IconSpan>
          </th>
          <th>
            <IconSpan>
              Total Collateral <InfoTooltip>Total collateral value</InfoTooltip>
            </IconSpan>
          </th>
          <th>
            <IconSpan>
              Total Collateral Value{' '}
              <InfoTooltip>Total collateral value in USD</InfoTooltip>
            </IconSpan>
          </th>
        </tr>
      </thead>
      <tbody>
        {printCollaterals("whale")}
        {printCollaterals("luna")}
        {printCollaterals("spectrum_lp")}
        {printCollaterals("amp_lp")}
        {printCollaterals("aLuna")}
      </tbody>
    </HorizontalScrollTable>
  );
};
