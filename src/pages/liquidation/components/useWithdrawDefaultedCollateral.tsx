import { useBidByUserByCollateralQuery } from "@anchor-protocol/app-provider";
import { useMemo } from "react";
import big, {Big} from "big.js";
import { demicrofy, formatOutput } from "@anchor-protocol/formatter";
import { Token, u } from "@libs/types";
import { liquidation } from "@anchor-protocol/types";
import { useAllBidByUserByCollateralQuery } from "@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser";
import { CollateralInfo, useCollaterals } from "pages/borrow/components/useCollaterals";

const FIXED_DECIMALS = 6;


export interface WithdrawableBids{
  withdrawableWrapper: u<Token<Big>>,
  withdrawableLSD: u<Token<Big>>,
  withdrawableUnderlying: u<Token<Big>>,
  withdrawableText: string
}

function formatWithdrawableBids(bidByUser: liquidation.liquidationQueueContract.BidsByUserResponse | undefined, collateral: CollateralInfo | undefined): WithdrawableBids{
  const withdrawableWrapper = (bidByUser?.bids ?? []).reduce(
      (filledSum, bid) =>
        filledSum.plus(big(bid.pending_liquidated_collateral)),
      big(0),
    ) as u<Token<Big>>;

    const withdrawableLSD = withdrawableWrapper.div(collateral?.priceInfo?.hubState?.exchange_rate ?? "1").round() as u<Token<Big>>
    const withdrawableUnderlying = withdrawableLSD.mul(collateral?.priceInfo?.lsdExchangeRate ?? "1").round() as u<Token<Big>>

    let parsedWithdrawal = formatOutput(
      demicrofy(withdrawableLSD, FIXED_DECIMALS),
    );
    if (parsedWithdrawal === '0') {
      parsedWithdrawal = '0.000000';
    }
    const withdrawableText = `${parsedWithdrawal} ${collateral && "info" in collateral.collateral ? collateral?.collateral.info.info.symbol : collateral?.collateral.symbol}`;
    return {
      withdrawableWrapper,
      withdrawableLSD,
      withdrawableUnderlying,
      withdrawableText
    };
}

export function useWithdrawDefaultedCollateral(collateral: CollateralInfo | undefined){

  const { data: { bidByUser } = {} } = useBidByUserByCollateralQuery(
    collateral?.collateral.collateral_token
  );

  return useMemo(() => {
    return formatWithdrawableBids(bidByUser, collateral)
  }, [bidByUser, collateral]);

}

export function useAllWithdrawDefaultedCollateral(){

  const collateralBids = useAllBidByUserByCollateralQuery();

  const collaterals = useCollaterals();

  return useMemo(() => 
    collateralBids.map((bids)=> {
      // FIrst we match the collateral to get all the necessary info
      const collateral = collaterals.find(({collateral}) => collateral.collateral_token == bids.info.token)

      // Then we get the bids information and format before returning
      return ({
        collateral,
        ...formatWithdrawableBids(bids.bids?.bidByUser, collateral)
      })
    }), [collateralBids, collaterals]);
}