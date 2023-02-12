import { aLuna, aluna, Luna, u } from "@anchor-protocol/types";
import { microfy } from "@libs/formatter";
import big, { Big } from "big.js";

export function pegRecovery(
  exchangeRate: aluna.hub.StateResponse | undefined,
  parameters: aluna.hub.ParametersResponse | undefined
): ((amount: aLuna | Luna) => u<aLuna<Big>>) | undefined {
  if (!exchangeRate || !parameters) {
    return undefined;
  }

  return big(exchangeRate.exchange_rate).lt(parameters.er_threshold)
    ? (amount: aLuna | Luna) =>
        big(parameters.peg_recovery_fee).mul(microfy(amount)) as u<aLuna<Big>>
    : undefined;
}
