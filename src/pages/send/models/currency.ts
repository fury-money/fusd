import { CW20Addr, Luna, Token, u } from '@anchor-protocol/types';
import { AnchorBank } from '@anchor-protocol/app-provider/hooks/useAnchorBank';
import { BigSource } from 'big.js';

export interface CurrencyInfo {
  label: string;
  value: string;
  name?: string;
  integerPoints: number;
  decimalPoints: number;
  getWithdrawable: (bank: AnchorBank, fixedGas: u<Luna<BigSource>>) => u<Token>;
  getFormatWithdrawable: (
    bank: AnchorBank,
    fixedGas: u<Luna<BigSource>>,
  ) => Token;
  cw20Address?: CW20Addr;
}
