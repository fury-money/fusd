import { NetworkInfo } from "@terra-money/wallet-provider";

export function chains(): Promise<Record<string, NetworkInfo>> {
  return fetch("https://assets.terra.dev/chains.json").then((res) =>
    res.json()
  );
}
