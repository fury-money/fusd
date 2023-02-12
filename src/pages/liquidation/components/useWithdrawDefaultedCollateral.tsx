import { useBidByUserByCollateralQuery } from "@anchor-protocol/app-provider";
import { WhitelistCollateral } from "queries";
import { useMemo } from "react";
import big, {Big} from "big.js";
import { useFormatters } from "@anchor-protocol/formatter";
import { u } from "@libs/types";
import { aLuna } from "@anchor-protocol/types";
import { useAllBidByUserByCollateralQuery } from "@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser";


export function useWithdrawDefaultedCollateral(collateral: WhitelistCollateral | undefined){

  const {
    aLuna: aluna,
  } = useFormatters();

  const { data: { bidByUser } = {} } = useBidByUserByCollateralQuery(
    collateral?.collateral_token
  );

  const [withdrawable_number, withdrawable_balance] = useMemo(() => {
    const withdrawable_number = (bidByUser?.bids ?? []).reduce(
      (filledSum, bid) =>
        filledSum.plus(big(bid.pending_liquidated_collateral)),
      big(0),
    ) as u<aLuna<Big>>;
    let parsedWithdrawal = aluna?.formatOutput(
      aluna.demicrofy(withdrawable_number),
    );
    if (parsedWithdrawal === '0') {
      parsedWithdrawal = '0.000000';
    }
    const withdrawable = `${parsedWithdrawal} ${collateral && "info" in collateral ? collateral?.info.info.symbol : collateral?.symbol}`;
    return [withdrawable_number, withdrawable];
  }, [bidByUser, aluna]);

  return {
    withdrawable_number,
    withdrawable_balance
  }
}

export function useAllWithdrawDefaultedCollateral(){

  const {
    aLuna: aluna,
  } = useFormatters();

  const collateralBids = useAllBidByUserByCollateralQuery();

  return useMemo(() => 

    collateralBids.map((bids)=> ({
      collateral: bids.info,
      withdrawable_number: (bids.bids?.bidByUser?.bids ?? []).reduce(
        (filledSum, bid) =>
          filledSum.plus(big(bid.pending_liquidated_collateral)),
        big(0),
      ) as u<aLuna<Big>>
    })), [collateralBids, aluna]);
}