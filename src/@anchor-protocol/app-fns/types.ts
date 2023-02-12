import {
  ANC,
  AncUstLP,
  aUST,
  aLuna,
  aLunaLunaLP,
  Luna,
  Eth,
  bEth,
  Native,
  Rate,
  u,
  CollateralAmount,
  UST,
  LSD,
} from '@anchor-protocol/types';
import Big from 'big.js';
import { RegisteredLSDs } from 'env';
import { WhitelistCollateral } from 'queries';

/**
 * You can cast the token values as nominal types
 *
 * @example
 * ```
 * // const { tokenBalances: { uUST } } = useBank() // Record<string, string>
 * const { tokenBalances: { uUST } } = useBank<AnchorTokens>() // { uUST: uUST }
 * ```
 */
export interface AnchorTokenBalances {
  uUST: u<UST>;
  uaUST: u<aUST>;
  uLuna: u<Luna>;
  uaLuna: u<aLuna>;
  uEth: u<Eth>;
  ubEth: u<bEth>;
  uANC: u<ANC>;
  uAncUstLP: u<AncUstLP>;
  uaLunaLunaLP: u<aLunaLunaLP>;
  uLSDs: {
    [key in RegisteredLSDs]: string
  }
}

export const DefaultAnchorTokenBalances = {
  uUST: '0' as u<UST>,
  uaUST: '0' as u<aUST>,
  uLuna: '0' as u<Luna>,
  uaLuna: '0' as u<aLuna>,
  uEth: '0' as u<Eth>,
  ubEth: '0' as u<bEth>,
  uANC: '0' as u<ANC>,
  uAncUstLP: '0' as u<AncUstLP>,
  uaLunaLunaLP: '0' as u<aLunaLunaLP>,
};

export interface AnchorBalances {
  uNative: u<Native>; // the native token for the chain, ie, LUNA, ETH, AVAX
  uaUST: u<aUST>;
  uUST: u<UST>;

  fetchWalletBalance: (
    collateral?: WhitelistCollateral,
  ) => Promise<u<CollateralAmount<Big>>>;
}

export const DefaultAnchorBalances: Partial<AnchorBalances> = {
  uNative: '0' as u<Native>,
  uaUST: '0' as u<aUST>,
};

/**
 * You can cast the tax values as nominal types
 *
 * @example
 * ```
 * // const { tax: { taxRate, maxTaxUUSD } } = useBank() // { taxRate: string, maxTaxUUSD: string }
 * const { tax: { taxRate, maxTaxUUSD } } = useBank<any, AnchorTax>() // { taxRate: Rate, maxTaxUUSD: uUST }
 * ```
 */
export interface AnchorTax {
  taxRate: Rate;
  maxTaxUUSD: u<Luna>;
}
