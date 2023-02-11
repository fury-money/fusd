import { Tokens } from '@anchor-protocol/token-icons';
import { Gas } from '@anchor-protocol/types';
import { AppConstants, AppContractAddress } from '@libs/app-provider';
import { CW20Addr, HumanAddr, NativeDenom } from '@libs/types';
import { RegisteredLSDs } from 'env';

export interface AnchorContractAddress extends AppContractAddress {
  bluna: {
    reward: HumanAddr;
    hub: HumanAddr;
    airdropRegistry: HumanAddr;
    validatorsRegistry: HumanAddr;
    custody: HumanAddr;
  };
  crossAnchor: {
    core: HumanAddr;
  };
  moneyMarket: {
    market: HumanAddr;
    overseer: HumanAddr;
    oracle: HumanAddr;
    interestModel: HumanAddr;
    distributionModel: HumanAddr;
  };
  liquidation: {
    liquidationQueueContract: HumanAddr;
  };
  anchorToken: {
    gov: HumanAddr;
    staking: HumanAddr;
    community: HumanAddr;
    distributor: HumanAddr;
    investorLock: HumanAddr;
    teamLock: HumanAddr;
    collector: HumanAddr;
    vesting: HumanAddr;
  };
  terraswap: {
    factory: HumanAddr;
    blunaLunaPair: HumanAddr;
  };
  astroport: {
    generator: HumanAddr;
    astroUstPair: HumanAddr;
    ancUstPair: HumanAddr;
  };
  cw20: {
    bLuna: CW20Addr;
    aUST: CW20Addr;
    ANC: CW20Addr;
    AncUstLP: CW20Addr;
    bLunaLunaLP: CW20Addr;
  };
  native: {
    usd: NativeDenom
  };
  documents:{
    mainAddress: string;
    tokens: {
      whitepaper: string;
    }
  };
  admin: {
    feeAddress: HumanAddr;
  },
  lsds:{
    [key in RegisteredLSDs]: LSDContracts;
  }
}

export interface AnchorConstants extends AppConstants {
  airdropGasWanted: Gas;
  airdropGas: Gas;
  bondGasWanted: Gas;
  astroportGasWanted: Gas;
  depositFeeAmount: number;
}


export interface LSDContracts {
  info: {
    tokenAddress: string;
    hubAddress: string;
    protocol: string;
    icon: string;
    symbol: Tokens,
    name: string,
    link: string,
    underlyingToken: Tokens,
  };
  hub: string;
  reward: string;
  token: string;
  custody: string;
}
