import type { UST, u } from '@anchor-protocol/types';
import { min } from '@libs/big-math';
import { microfy } from '@libs/formatter';
import big, { Big } from 'big.js';
import { AnchorTax } from '../../types';

// Tx_fee = MIN(User_Input/(1+tax_rate) * tax_rate , Max_tax) + Fixed_Gas

export function computeBorrowTxFee(borrowAmount: UST, tax: AnchorTax) {
  if (borrowAmount.length === 0) {
    return undefined;
  }

  const amount = microfy(borrowAmount);

  const userAmountTxFee = big(amount.div(big(1).plus(tax.taxRate))).mul(
    tax.taxRate,
  );

  return min(userAmountTxFee, tax.maxTaxUUSD) as u<UST<Big>>;
}
