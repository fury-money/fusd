import type { Rate } from '@anchor-protocol/types';
import big, { Big } from 'big.js';
import { computeApr } from './computeApr';

export function computeApy(
  depositRate: Rate | undefined,
  blocksPerYear: number,
  epochPeriod: number,
): Rate<Big> {
  console.log("start compute apy", depositRate, blocksPerYear, epochPeriod)
  const compoundTimes = blocksPerYear / epochPeriod;
  console.log("start", compoundTimes)
  const perCompound = big(depositRate ?? '0').mul(epochPeriod);

  console.log("start", compoundTimes)

  const apy = big(
    Math.pow(perCompound.add(1).toNumber(), compoundTimes) - 1,
  ) as Rate<Big>;
  console.log("start", apy)

  if (apy.toNumber() >= 0.2) {
    return computeApr(depositRate, blocksPerYear);
  }
  return apy;
}
