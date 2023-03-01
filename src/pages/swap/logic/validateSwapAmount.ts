import type { aLuna } from "@anchor-protocol/types";
import { AnchorBank } from "@anchor-protocol/app-provider/hooks/useAnchorBank";
import { microfy } from "@libs/formatter";
import { ReactNode } from "react";

export function validateSwapAmount(
  burnAmount: aLuna,
  bank: AnchorBank
): ReactNode {
  if (burnAmount.length === 0) {
    return undefined;
  } else if (microfy(burnAmount).gt(bank.tokenBalances.uaLuna ?? 0)) {
    return `Not enough aAssets`;
  }
  return undefined;
}
