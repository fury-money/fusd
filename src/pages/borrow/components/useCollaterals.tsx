import { computeLiquidationPrice } from "@anchor-protocol/app-fns";
import { useBorrowBorrowerQuery, useBorrowMarketQuery } from "@anchor-protocol/app-provider";
import { useLSDCollateralQuery } from "@anchor-protocol/app-provider/queries/borrow/useLSDCollateralQuery";
import { bAsset } from "@anchor-protocol/types";
import { u, UST } from "@libs/types";
import big, {Big, BigSource} from "big.js";
import { useWhitelistCollateralQuery, WhitelistCollateral } from "queries";
import { useMemo } from "react";
import { microfyPrice } from "utils/microfyPrice";

export interface CollateralInfo {
  collateral: WhitelistCollateral;
  price: UST;
  liquidationPrice: UST | undefined;
  rawLockedAmount:  u<bAsset>;
  lockedAmount: u<bAsset>;
  lockedAmountInUST: u<UST<BigSource>>;
}

export function useCollaterals(){
  const { data: borrowMarket } = useBorrowMarketQuery();

  const { data: borrowBorrower } = useBorrowBorrowerQuery();

  const { data: whitelist } = useWhitelistCollateralQuery();

  const additionalLSDInfo = useLSDCollateralQuery(); 


  return useMemo<CollateralInfo[]>(() => {
    if (!borrowMarket || !whitelist) {
      return [];
    }

    return whitelist
      .filter((collateral) => collateral.bridgedAddress !== undefined)
      .map((collateral) => {
        console.log(borrowMarket.oraclePrices)
        const oracle = borrowMarket.oraclePrices.prices.find(
          ({ asset }) => collateral.collateral_token === asset,
        );
        const collateralAmount =
          borrowBorrower?.overseerCollaterals.collaterals.find(
            ([collateralToken]) =>
              collateral.collateral_token === collateralToken,
          );

        const additionalInfo = additionalLSDInfo?.find(
          (c) => c.info?.token === collateral.collateral_token
        );
      const exchangeRate = parseFloat(additionalInfo?.additionalInfo?.hubState?.exchange_rate ?? "1");

      // We exchange the token values with the one in memory for LSD
      if(additionalInfo?.info?.info?.symbol){
        collateral.symbol = additionalInfo?.info?.info?.symbol;
      }
      if(additionalInfo?.info?.info?.name){
        collateral.name = additionalInfo?.info?.info?.name;
      }
        return {
          collateral,
          price: big(microfyPrice(oracle?.price, collateral.decimals)).mul(exchangeRate).toString() as UST,
          liquidationPrice:
            borrowBorrower &&
            borrowBorrower.overseerCollaterals.collaterals.length === 1 &&
            collateral
              ? big(microfyPrice(
                  computeLiquidationPrice(
                    collateral.collateral_token,
                    borrowBorrower.marketBorrowerInfo,
                    borrowBorrower.overseerBorrowLimit,
                    borrowBorrower.overseerCollaterals,
                    borrowMarket.overseerWhitelist,
                    borrowMarket.oraclePrices,
                  ),
                  collateral.decimals,
                )).mul(exchangeRate).toString() as UST
              : undefined,
          rawLockedAmount: collateralAmount?.[1] ?? "0" as u<bAsset>,
          lockedAmount: big(collateralAmount?.[1] ?? ('0' as u<bAsset>)).div(exchangeRate).toString() as u<bAsset>,
          lockedAmountInUST: big(collateralAmount?.[1] ?? 0).mul(
            oracle?.price ?? 1,
          ) as u<UST<Big>>,
        };
      })
      .sort((a, b) =>
        big(a.lockedAmountInUST).gte(big(b.lockedAmountInUST)) ? -1 : 1,
      )
      .filter((collateral) => Number(collateral.price) !== 0);
  }, [borrowBorrower, borrowMarket, whitelist]);
}