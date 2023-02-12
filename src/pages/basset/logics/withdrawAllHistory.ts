import type { aLuna, Luna, u } from "@anchor-protocol/types";
import { aluna } from "@anchor-protocol/types";
import big, { Big } from "big.js";

export interface WithdrawHistory {
  alunaAmount: u<aLuna<Big>>;
  lunaAmount?: u<Luna<Big>>;
  requestTime?: Date;
  claimableTime?: Date;
}

export function withdrawAllHistory(
  unbondRequests: aluna.hub.UnbondRequestsResponse | undefined,
  unbondedRequestsStartFrom: number,
  allHistory: aluna.hub.AllHistoryResponse | undefined,
  parameters: aluna.hub.ParametersResponse | undefined
): WithdrawHistory[] | undefined {
  if (
    !unbondRequests ||
    unbondedRequestsStartFrom < 0 ||
    !allHistory ||
    !parameters
  ) {
    return undefined;
  }

  return unbondRequests.requests.map<WithdrawHistory>(([index, amount]) => {
    const historyIndex: number = index - unbondedRequestsStartFrom;
    const matchingHistory = allHistory.history[historyIndex - 1];

    const alunaAmount = big(amount) as u<aLuna<Big>>;

    if (!matchingHistory) {
      return {
        alunaAmount,
      };
    }

    const { time, withdraw_rate } = matchingHistory;
    const { unbonding_period } = parameters;

    const lunaAmount = alunaAmount.mul(withdraw_rate) as u<Luna<Big>>;
    const requestTime = new Date(time * 1000);
    const claimableTime = new Date((time + unbonding_period) * 1000);

    return {
      alunaAmount,
      lunaAmount,
      requestTime,
      claimableTime,
    };
  });
}
