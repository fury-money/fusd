import { Luna, NativeDenom, Rate, Token, u } from "@libs/types";
import { useTerraTreasuryTaxCapQuery } from "./treasuryTaxCap";
import { useTerraTreasuryTaxRateQuery } from "./treasuryTaxRate";

export function useTax<T extends Token>(
  denom: NativeDenom
): { taxRate: Rate; maxTax: u<T> } {
  return {
    maxTax: "0" as u<T>,
    taxRate: "0" as Rate,
  };
}

export function useUstTax(): { taxRate: Rate; maxTax: u<Luna> } {
  return useTax<Luna>("uluna");
}
