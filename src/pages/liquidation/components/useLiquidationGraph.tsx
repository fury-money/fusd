import {
    LSDContracts,
    useAnchorWebapp,
    useBidByUserByCollateralQuery,
    useBidPoolsByCollateralQuery,
    useMarketBAssetQuery,
    useNetwork
} from '@anchor-protocol/app-provider';
import { useExlicitWrappedTokenDetails, useWrappedTokenDetails } from '@anchor-protocol/app-provider/queries/basset/wrappedLSDTokenDetails';
import { useTotalCollateralsQuery } from '@anchor-protocol/app-provider/queries/liquidate/totalLiquidations';
import { formatBAsset, formatUST } from '@anchor-protocol/notation';
import { bAsset, aLuna, CW20Addr, HumanAddr, liquidation, u, UST } from '@anchor-protocol/types/';
import { demicrofy } from '@libs/formatter';
import { RegisteredLSDs } from 'env';
import { useWhitelistCollateralQuery, WhitelistCollateral } from 'queries';
import { useMemo } from 'react';
import big, { Big } from "big.js";

export const useLiquidationGraph = (contractAddress: CW20Addr | undefined) => {
  const labels = useMemo(() => [...Array(31).keys()], []);

  const { data: { bidPoolsByCollateral } = {} } = useBidPoolsByCollateralQuery(
    contractAddress,
    undefined,
    31,
  );


  const data = useMemo(
    () =>
      labels.map((label) => {
        const data = bidPoolsByCollateral?.bid_pools.find(
          (element) => parseFloat(element.premium_rate) === label / 100,
        );
        return parseInt(data?.total_bid_amount ?? '0') / 1000000; // Decimals
      }),
    [labels, bidPoolsByCollateral?.bid_pools],
  );

  return useMemo(() => {
    return {
      labels,
      data,
    };
  }, [labels, data]);
};

export type LiquidationStats = {
  ratio: number,
  otherStats: 
    {
      id: string;
      title: string;
      value: number;
      format_func: (v: any) => string;
    }[]
}

export const useMyLiquidationStats = (tokenAddress?: CW20Addr, symbol?:string, hubAddress?: HumanAddr): LiquidationStats => {
  const network = useNetwork();


  const { data: { bidPoolsByCollateral } = {} } = useBidPoolsByCollateralQuery(
    tokenAddress,
    undefined,
    31,
  );
  const { data: { bidByUser } = {} } = useBidByUserByCollateralQuery(
    tokenAddress,
  );

  const { data: { oraclePrices } = {} } = useMarketBAssetQuery();

  const poolValue = useMemo(
    () =>
      bidPoolsByCollateral?.bid_pools.reduce(
        (acc, b: liquidation.liquidationQueueContract.BidPoolResponse) =>
          acc + parseInt(b.total_bid_amount),
        0,
      ),
    [bidPoolsByCollateral],
  );

  const { data: lockedCollaterals } = useTotalCollateralsQuery();

  const thisLockedCollateral = useMemo(
    () =>
      lockedCollaterals?.find((col) => col.token === tokenAddress)
        ?.computed_total_collateral,
    [lockedCollaterals, tokenAddress],
  );

  const activeBids = useMemo(
    () =>
      bidByUser?.bids.reduce(
        (acc, b: liquidation.liquidationQueueContract.BidResponse) =>
          acc + parseInt(b.amount),
        0,
      ),
    [bidByUser],
  );

  const collateralPrice = useMemo(
    () => oraclePrices?.prices.find((price) => price.asset == tokenAddress)?.price, 
  [oraclePrices, tokenAddress]);

  // Echange rate for assets not 1-1
  const {data: wrappedTokenDetails} = useExlicitWrappedTokenDetails(hubAddress);

  return useMemo(() => {
    let lockedCollateralUSD =
      (thisLockedCollateral ?? 0) * parseFloat(collateralPrice ?? '1');
    let ratio = lockedCollateralUSD ? (poolValue ?? 0) / lockedCollateralUSD : 0;
    let lsdExchangeRate = wrappedTokenDetails?.hubState.exchange_rate ?? "1";

    return {
      ratio,
      otherStats: [
        {
          id: "locked_collateral_stable",
          title: 'Total locked Collateral Value (axlUSDC)',
          value: lockedCollateralUSD,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
        {
          id: "pool_value_stable",
          title: 'Total Pool Value (axlUSDC)',
          value: poolValue ?? 0,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
        {
          id: "locked_collateral_raw",
          title: `Total locked Collateral (${symbol})`,
          value: thisLockedCollateral ?? 0,
          format_func: (v: any) =>
            formatBAsset(big(demicrofy(v.toString() as u<aLuna>)).div(lsdExchangeRate) as bAsset<Big>),
        },
        {
          id: "my_bids_stable",
          title: 'My Total active Bids (axlUSDC)',
          value: activeBids ?? 0,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
        {
          id: "price",
          title: `${symbol} Price`,
          value: parseFloat(collateralPrice ?? "0")*parseFloat(lsdExchangeRate),
          format_func: (v: any) => formatUST(v.toString() as UST),
        },
      ],
    };
  }, [poolValue, activeBids, collateralPrice, thisLockedCollateral, symbol, wrappedTokenDetails?.hubState.exchange_rate]);
};


export type LiquidationStatsResponse = {
  name: RegisteredLSDs | "aLuna"
  info: Partial<LSDContracts>,
  liquidationStats: LiquidationStats | undefined,
}[]

export const useAllLiquidationStats = () : LiquidationStatsResponse => {

  const {contractAddress} = useAnchorWebapp();

  const {data: collaterals} = useWhitelistCollateralQuery();

  // First aLuna    
  let aLunaStats = useMyLiquidationStats(contractAddress.cw20.aLuna, "aLuna");

  // Then LSDs
  let lsdStats = Object.entries(contractAddress.lsds).map(([key, contracts] ) => {
        const liquidationStats = useMyLiquidationStats(contracts.token as CW20Addr, contracts.info.symbol);
        return {
          name: key as RegisteredLSDs,
          liquidationStats,
          info: contracts
        }
    })

  return [...lsdStats, {
    name: "aLuna", 
    liquidationStats: aLunaStats,
    info: {
      token: contractAddress.cw20.aLuna
    }
  }]

}