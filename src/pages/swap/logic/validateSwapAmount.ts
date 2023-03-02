import type { Token } from "@anchor-protocol/types";
import { microfy } from "@libs/formatter";
import { ReactNode } from "react";

export function validateSwapAmount(
  swapAmount: Token,
  balance: Token,
): ReactNode {
  if (swapAmount.length === 0) {
    return undefined;
  } else if (microfy(swapAmount).gt(balance ?? "0")) {
    return `Not enough assets`;
  }
  return undefined;
}
