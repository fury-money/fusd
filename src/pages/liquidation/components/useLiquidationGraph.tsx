import { useMemo } from 'react';
import {
  useAnchorWebapp,
  useBidByUserByCollateralQuery,
  useBidPoolsByCollateralQuery,
  useMarketBAssetQuery,
  useNetwork,
} from '@anchor-protocol/app-provider';
import { ANCHOR_CONTRACT_ADDRESS } from 'env';
import { UST, bLuna, liquidation, u } from '@anchor-protocol/types/';
import { demicrofy } from '@libs/formatter';
import { formatUST, formatBAsset } from '@anchor-protocol/notation';
import { useTotalCollateralsQuery } from '@anchor-protocol/app-provider/queries/liquidate/totalLiquidations';

export const useLiquidationGraph = () => {
  const labels = useMemo(() => [...Array(30).keys()], []);

  const network = useNetwork();
  const { data: { bidPoolsByCollateral } = {} } = useBidPoolsByCollateralQuery(
    ANCHOR_CONTRACT_ADDRESS(network.network).cw20.bLuna,
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

export const useMyLiquidationStats = () => {
  const network = useNetwork();
  const { contractAddress } = useAnchorWebapp();
  const { data: { bidPoolsByCollateral } = {} } = useBidPoolsByCollateralQuery(
    ANCHOR_CONTRACT_ADDRESS(network.network).cw20.bLuna,
    undefined,
    31,
  );
  const { data: { bidByUser } = {} } = useBidByUserByCollateralQuery(
    contractAddress.cw20.bLuna,
  );

  const { data: { oraclePrice } = {} } = useMarketBAssetQuery();

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

  const lockedCollateralLUNA = useMemo(
    () =>
      lockedCollaterals?.find((col) => col.token === contractAddress.cw20.bLuna)
        ?.computed_total_collateral,
    [lockedCollaterals, contractAddress.cw20.bLuna],
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

  const lunaPrice = useMemo(() => oraclePrice?.rate, [oraclePrice]);

  return useMemo(() => {
    let lockedCollateralUSD =
      (lockedCollateralLUNA ?? 1) * parseFloat(lunaPrice ?? '1');
    if (lockedCollateralUSD === 0) {
      lockedCollateralUSD = 1;
    }
    let ratio = (poolValue ?? 0) / lockedCollateralUSD;

    return {
      ratio,
      otherStats: [
        {
          title: 'Total locked Collateral Value (axlUSDC)',
          value: lockedCollateralUSD,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
        {
          title: 'Total Pool Value (axlUSDC)',
          value: poolValue ?? 0,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
        {
          title: 'Total locked Collateral (LUNA)',
          value: lockedCollateralLUNA ?? 0,
          format_func: (v: any) =>
            formatBAsset(demicrofy(v.toString() as u<bLuna>)),
        },
        {
          title: 'My Total active Bids (axlUSDC)',
          value: activeBids ?? 0,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
        {
          title: 'LUNA Price',
          value: lunaPrice ?? 0,
          format_func: (v: any) => formatUST(demicrofy(v.toString() as u<UST>)),
        },
      ],
    };
  }, [poolValue, activeBids, lunaPrice, lockedCollateralLUNA]);
};
