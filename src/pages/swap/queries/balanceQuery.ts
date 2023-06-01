import { LSDContracts, useAnchorWebapp } from "@anchor-protocol/app-provider";
import { useCW20Balance, useNativeBalanceQuery } from "@libs/app-provider";
import { CW20Addr } from "@libs/types";
import { useAccount } from "contexts/account";

export function useBalance(contract_addr: string | undefined) {
  const { terraWalletAddress } = useAccount();

  const cw20Balance = useCW20Balance(
    contract_addr?.includes("terra") ? (contract_addr as CW20Addr) : undefined,
    terraWalletAddress
  );

  const nativeBalance = useNativeBalanceQuery(
    !contract_addr?.includes("terra") ? contract_addr : undefined
  );

  if (!cw20Balance || cw20Balance == "0") {
    return nativeBalance.data?.amount ?? "0";
  } else {
    return cw20Balance;
  }
}

export function getUnderlyingToken(collateral: LSDContracts | undefined) {
  let asset_denom;
  if (collateral?.info.cw20) {
    asset_denom = {
      name: collateral?.info.cw20.tokenAddress,
      type: "cw20",
    };
  } else if (collateral?.info.coin) {
    asset_denom = {
      name: collateral?.info.coin?.denom,
      type: "coin",
    };
  } else if (collateral?.info.spectrum_lp) {
    asset_denom = {
      name: collateral?.info.spectrum_lp.token,
      type: "cw20",
    };
  } else if (collateral?.info.amp_lp) {
    asset_denom = {
      name: collateral?.info.amp_lp.token,
      type: "cw20",
    };
  }
  return asset_denom;
}

export function useLSDBalance(collateral: LSDContracts | undefined) {
  let asset_denom = getUnderlyingToken(collateral);
  return useBalance(asset_denom?.name);
}
