import {
  ANCHOR_QUERY_KEY,
  ANCHOR_TX_KEY,
  AnchorConstants,
  AnchorContractAddress,
  LSDContracts,
} from '@anchor-protocol/app-provider';
import { CW20Addr, HumanAddr } from '@anchor-protocol/types';
import { TERRA_QUERY_KEY, TxRefetchMap } from '@libs/app-provider';
import { Gas, NativeDenom, Rate } from '@libs/types';
import { NetworkInfo } from '@terra-money/wallet-provider';

// ---------------------------------------------
// style
// ---------------------------------------------
export const screen = {
  mobile: { max: 530 },
  // mobile : @media (max-width: ${screen.mobile.max}px)
  tablet: { min: 531, max: 830 },
  // tablet : @media (min-width: ${screen.tablet.min}px) and (max-width: ${screen.tablet.max}px)
  pc: { min: 831, max: 1439 },
  // pc : @media (min-width: ${screen.pc.min}px)
  monitor: { min: 1440 },
  // monitor : @media (min-width: ${screen.pc.min}px) and (max-width: ${screen.pc.max}px)
  // huge monitor : @media (min-width: ${screen.monitor.min}px)
} as const;

export const BODY_MARGIN_TOP = {
  pc: 50,
  mobile: 10,
  tablet: 20,
};

export const mobileHeaderHeight = 68;

// ---------------------------------------------
// links
// ---------------------------------------------
export const links = {
  forum: 'https://forum.cavernprotocol.com/',
  docs: {
    earn: 'https://docs.cavernprotocol.com/user-guide/webapp/earn',
    borrow: 'https://docs.cavernprotocol.com/user-guide/webapp/borrow',
    bond: 'https://docs.cavernprotocol.com/user-guide/webapp/bond',
    gov: 'https://docs.cavernprotocol.com/user-guide/webapp/govern',
    liquidate: 'https://docs.cavernprotocol.com/user-guide/webapp/liquidate',
  },
} as const;

// ---------------------------------------------
// chain
// ---------------------------------------------
export function ANCHOR_QUERY_CLIENT(network: NetworkInfo): 'lcd' | 'hive' | 'batch' {
  return 'batch';
}

export function ANCHOR_CONSTANTS(network: NetworkInfo): AnchorConstants {
  return {
    gasWanted: 1_000_000 as Gas,
    fixedGas: 1_671_053 as Gas,
    blocksPerYear: 4_656_810,
    gasAdjustment: 1.6 as Rate<number>,
    airdropGasWanted: 300_000 as Gas,
    airdropGas: 334_211 as Gas,
    bondGasWanted: 1_600_000 as Gas,
    astroportGasWanted: 1_600_000 as Gas,
    depositFeeAmount: 0.005
  };
}

export enum RegisteredLSDs {
  ampLuna = "ampLuna",
}

const PHOENIX_CONTRACT_ADDRESS: Record<string, any> = {

  bLunaHub: "terra1c4x3x5ptxw4yy436rvz5u9cru6868ksxr95gsyya55ycgll0xdas0g7htx",
  bLunaReward: "terra1w7ssgvtetdzczyl98pdxvs79nw9g6rjejt0urxegm30dukddyesqy0g95n",
  bLunaToken: "terra170e8mepwmndwfgs5897almdewrt6phnkksktlf958s90eh055xvsrndvku",
  bLunaValidatorsRegistry: "terra1ftwj8jk5k5hfg0ypaj54k8ha4kzjfnrrlpgd2xsmpsalgsud957qv6q367",
  mmMarket: "terra1zqlcp3aty4p4rjv96h6qdascdn953v6crhwedu5vddxjnp349upscluex6",
  mmOracle: "terra1gp3a4cz9magxuvj6n0x8ra8jqc79zqvquw85xrn0suwvml2cqs4q4l7ss7",
  mmOverseer: "terra1l6rq7905263uqmayurtulzc09sfcgxdedsfen7m0y6wf28s49tvqdkwau9",  

  mmCustody: "terra1ly8gd96kc8rwhjhpvx64jr9qd3nkn8yrm0gflplk5vhyff0fllxqc43w3k",

  mmLiquidationQueue: "terra1vl3dwfdqh9vw9g5ta5290wuzkywvxgn4zn8smq27wny05yzgpt2s8xfn48",
  aUSDC: "terra1gwdxyqtu75es0x5l6cd9flqhh87zjtj7qdankayyr0vtt7s9w4ssm7ds8m",
  mmInterestModel: "terra12m5q4cs22dj9sz5k56cdnwr48mzjqqf7w8sxsg35vxmk2gdtf2fssgduva",
  mmDistributionModel: "terra175xavlptc4fhgtvzmq95z6s7wnt4larh5xp6nufz6xwwec7gygpsjw08v6",

  stableDenom: "ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4",

  bLunaLunaPair: '',
  bLunaLunaLPToken: '',
  ancUstPair: '',
  ancUstLPToken: '',
  gov: '',
  distributor: '',
  collector:'',
  community: '',
  staking: '',
  ANC: '',
  airdrop: '',
  investor_vesting: '',
  team_vesting: '',
  terraswapFactory: '',

  astroportGenerator: '',
  vesting: '',
  astroUstPair: '',
  usd: "ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4",
  documentsMain: 'terra1cx38qvyv4mj9hrn6p6m4fj7vhj726t5dg3ldpeupkkgel495ngnq5rtplq',
  feeAddress: "terra1ytj0hhw39j88qsx4yapsr6ker83jv3aj354gmj",
  tokenId:{
    whitePaper: "whitepaper"
  },
  LSDs: {
    ampLuna: {
      info: {
        tokenAddress: "terra1ecgazyd0waaj3g7l9cmy5gulhxkps2gmxu9ghducvuypjq68mq2s5lvsct",
        hubAddress: "terra10788fkzah89xrdm27zkj5yvhj9x3494lxawzm5qq3vvxcqz2yzaqyd3enk",
        protocol : "Eris Protocol",
        symbol: "ampLuna",
        name: "Eris Amplified Luna",
        icon: 'https://www.erisprotocol.com/assets/ampLuna100.png',
      },
      hub: "terra1neq7ds3cd2rx0ht0fycgqkf26fed2v73g7wrp5xav5dfas0fwcqqy47t5n",
      reward: "terra1zrgzj7luyw9mtqcwqdtn6p8gwy262upx3p7wa3v3cj07us7j9ztsa8r4n5",
      token: "terra173z5ggu6k6slyumrrf59rd3ywmpu6hdfftwpqlkc7fp549yk9fmqzqyepj",
      custody: "terra1tlascrgjzlut6j2g4jlgv54zg3aw3c3whcjusudk24j0d3k5aucswpwzrz",
    },
  },
};

const PISCO_CONTRACT_ADDRESS: Record<string, any> = {
  
  bLunaHub: "terra100d6vr63p9sm8mlzuqzv0ep83hhhkdglkffzwkmv2ed47tv7tkrsxl8mn8",
  bLunaToken: "terra134jnnsem9z4us90lcdm6j6mjf70kdcdzkv9mnz8z5ktl9vt0glksr0uau4",
  mmInterestModel: "terra1k9cn6dqyrdl0tq0rnler0jw8c7dm5gq37xvaksztayez0upkcvdqv7j4at",
  mmOracle: "terra19hxng7vgnqshlxlc5cvmtuhkzfu7rrr4aj6vjxnxcnfausjse4yqlsw0np",
  mmMarket: "terra1mz4pt5u9vs72h9tv3l2nug2kx8kmxufyszsyv0qx7p639nl0zews60360g",
  mmOverseer: "terra1nlj0qj7km9rxh296wns7x2c43dywjfnfccasu35hhp626aw8wccsty4lfn",
  mmLiquidationQueue: "terra14jj0ganc6m5d0vr39ety8p58nkexldydx7rpawkecfzfdx8dtpmszpnj7l",
  aUSDC: 'terra1cfh5sw34je6a8kuwdwefcm3xh8935r0md7eyud4rt2nhnvqgh0jsle7h47',
  mmCustody:
    'terra16ulj2elu40xquhc3s9w50p288t5wz3xfl59x55m8x992dtk8t0ls2sfl75',
  bLunaReward:
    'terra1xzxn94q6nf0y260nz2vwntng76c2jrkrzkj2h9696gd840efxfjshdypph',
  bLunaValidatorsRegistry:
    'terra1mw0x5egps68z9e2zwvuk5pevzm4gthd6d4ndscqxfpl5h8f77clq7m6dsy',
  mmDistributionModel:
    'terra1tkzmmz3x8kuxtcygjvn9tajz7xx4r0n7nw7y3cexgferscuvm6tqul4uuq',

  bLunaLunaPair: '',
  bLunaLunaLPToken: '',
  ancUstPair: '',
  ancUstLPToken: '',
  gov: '',
  distributor: '',
  collector: '',
  community: '',
  staking: '',
  ANC: '',
  airdrop: '',
  investor_vesting: '',
  team_vesting: '',
  terraswapFactory: '',
  astroportGenerator: '',
  vesting: '',
  astroUstPair: '',
  usd: 'ibc/D70F005DE981F6EFFB3AD1DF85601258D1C01B9DEDC1F7C1B95C0993E83CF389',
  documentsMain: 'terra1ye9s4w39aaqd5e948tcvwddl77vr7dv2tyyrd9q7fzm8hnkgcuqqaqzwz4',
  feeAddress: "terra1qyudfva64yk9sye5x7pp654hl0pvk4k0gdzv0k",
  tokenId:{
    whitePaper: "whitepaper"
  },
  LSDs: {
    ampLuna: {
      info: {
        tokenAddress: "terra1xgvp6p0qml53reqdyxgcl8ttl0pkh0n2mtx2n7tzfahn6e0vca7s0g7sg6",
        hubAddress: "terra1kye343r8hl7wm6f3uzynyyzl2zmcm2sqmvvzwzj7et2j5jj7rjkqa2ue88",
        protocol : "Eris Protocol",
        symbol: "ampLuna",
        name: "Eris Amplified Luna",
        icon: 'https://www.erisprotocol.com/assets/ampLuna100.png',
      },
      "hub": "terra1qnvjpw834f8h7wfmqku43nndjnrh6v6hnggmeng0nafzlkqpnzwqt545cd",
      "reward": "terra1pmfgs6jekpcjp3rfg3x2dw2whpex3ygms7d3h46axj6q5xs28n7qvk8375",
      "token": "terra1pw3ta7fzwxzuqut7e4e6uc9824fg8440yczvhvndz99gnfevggeqrqvmxf",
      "custody": "terra1kqggdw6vkfdznss9tuvrqmkp4h2m7k7wut0egpv697efdh2hvj6sfk9qqf"
    },
  },
};

export const ANCHOR_CONTRACT_ADDRESS = (
  network: NetworkInfo,
): AnchorContractAddress => {
  const addressMap = network.chainID.startsWith('pisco')
    ? PISCO_CONTRACT_ADDRESS
    : PHOENIX_CONTRACT_ADDRESS;

  return {
    bluna: {
      reward: addressMap.bLunaReward as HumanAddr,
      hub: addressMap.bLunaHub as HumanAddr,
      airdropRegistry: addressMap.airdrop as HumanAddr,
      validatorsRegistry: addressMap.bLunaValidatorsRegistry as HumanAddr,
      custody: addressMap.mmCustody as HumanAddr,
    },
    moneyMarket: {
      market: addressMap.mmMarket as HumanAddr,
      overseer: addressMap.mmOverseer as HumanAddr,
      oracle: addressMap.mmOracle as HumanAddr,
      interestModel: addressMap.mmInterestModel as HumanAddr,
      distributionModel: addressMap.mmDistributionModel as HumanAddr,
    },
    liquidation: {
      liquidationQueueContract: addressMap.mmLiquidationQueue as HumanAddr,
    },
    anchorToken: {
      gov: addressMap.gov as HumanAddr,
      staking: addressMap.staking as HumanAddr,
      community: addressMap.community as HumanAddr,
      distributor: addressMap.distributor as HumanAddr,
      investorLock: addressMap.investor_vesting as HumanAddr,
      teamLock: addressMap.team_vesting as HumanAddr,
      collector: addressMap.collector as HumanAddr,
      vesting: addressMap.vesting as HumanAddr,
    },
    terraswap: {
      factory: addressMap.terraswapFactory as HumanAddr,
      blunaLunaPair: addressMap.bLunaLunaPair as HumanAddr,
    },
    astroport: {
      generator: addressMap.astroportGenerator as HumanAddr,
      astroUstPair: addressMap.astroUstPair as HumanAddr,
      ancUstPair: addressMap.ancUstPair as HumanAddr,
    },
    cw20: {
      bLuna: addressMap.bLunaToken as CW20Addr,
      //bEth: addressMap.bEthToken as CW20Addr,
      aUST: addressMap.aUSDC as CW20Addr,
      ANC: addressMap.ANC as CW20Addr,
      AncUstLP: addressMap.ancUstLPToken as CW20Addr,
      bLunaLunaLP: addressMap.bLunaLunaLPToken as CW20Addr,
    },
    crossAnchor: {
      core: '' as HumanAddr,
    },
    native: {
      usd: addressMap.usd as NativeDenom,
    },
    documents: {
      mainAddress: addressMap.documentsMain as string,
      tokens:{
        whitepaper: addressMap.tokenId.whitePaper as string,
      }
    },
    admin:{
      feeAddress: addressMap.feeAddress as HumanAddr,
    },
    lsds: Object.assign(
      {},
       ...Object.values(RegisteredLSDs).map((lsd: RegisteredLSDs): ({[lsd] : LSDContracts } | {}) => {
        if(!addressMap.LSDs[lsd as string]){
          return {};
        }
        return ({
      [lsd]: {
        info: addressMap.LSDs[lsd as string].info,
        hub: addressMap.LSDs[lsd as string].hub,
        reward: addressMap.LSDs[lsd as string].reward,
        token: addressMap.LSDs[lsd as string].token,
        custody: addressMap.LSDs[lsd as string].custody
      }
    })
      }))
  };
};

export const ANCHOR_INDEXER_API_ENDPOINTS = (network: NetworkInfo): string => {
  if (network.chainID.startsWith('pisco')) {
    //return 'http://api.cavernprotocol.com/api/testnet';
    return 'http://localhost:3000/api/testnet';
  } else if (network.chainID.startsWith('phoenix')) {
    return 'https://api.cavernprotocol.com/api/mainnet';
  } else {
    return 'https://anchor-services-anchor-protocol.vercel.app/api';
  }
};

// ---------------------------------------------
// query refetch
// ---------------------------------------------
export const ANCHOR_TX_REFETCH_MAP: TxRefetchMap = {
  [ANCHOR_TX_KEY.EARN_DEPOSIT]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.EARN_EPOCH_STATES,
    {
      queryKey: ANCHOR_QUERY_KEY.EARN_TRANSACTION_HISTORY,
      wait: 1000 * 3,
    },
  ],
  [ANCHOR_TX_KEY.EARN_WITHDRAW]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.EARN_EPOCH_STATES,
    {
      queryKey: ANCHOR_QUERY_KEY.EARN_TRANSACTION_HISTORY,
      wait: 1000 * 3,
    },
  ],
  [ANCHOR_TX_KEY.BORROW_BORROW]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.BORROW_MARKET,
    ANCHOR_QUERY_KEY.BORROW_BORROWER,
    ANCHOR_QUERY_KEY.BORROW_APY,
    ANCHOR_QUERY_KEY.BORROW_COLLATERAL_BORROWER,
  ],
  [ANCHOR_TX_KEY.BORROW_REPAY]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.BORROW_MARKET,
    ANCHOR_QUERY_KEY.BORROW_BORROWER,
    ANCHOR_QUERY_KEY.BORROW_APY,
    ANCHOR_QUERY_KEY.BORROW_COLLATERAL_BORROWER,
  ],
  [ANCHOR_TX_KEY.BORROW_PROVIDE_COLLATERAL]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.BORROW_MARKET,
    ANCHOR_QUERY_KEY.BORROW_BORROWER,
    ANCHOR_QUERY_KEY.BORROW_APY,
    ANCHOR_QUERY_KEY.BORROW_COLLATERAL_BORROWER,
  ],
  [ANCHOR_TX_KEY.BORROW_REDEEM_COLLATERAL]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.BORROW_MARKET,
    ANCHOR_QUERY_KEY.BORROW_BORROWER,
    ANCHOR_QUERY_KEY.BORROW_APY,
    ANCHOR_QUERY_KEY.BORROW_COLLATERAL_BORROWER,
  ],
  [ANCHOR_TX_KEY.BASSET_IMPORT]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.BASSET_EXPORT]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.BOND_MINT]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.BOND_BURN]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.BOND_SWAP]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.BOND_CLAIM]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.BOND_CLAIMABLE_REWARDS,
    ANCHOR_QUERY_KEY.BOND_BETH_CLAIMABLE_REWARDS,
  ],
  [ANCHOR_TX_KEY.BOND_WITHDRAW]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.BOND_WITHDRAWABLE_AMOUNT,
  ],
  [ANCHOR_TX_KEY.ANC_ANC_UST_LP_PROVIDE]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
  ],
  [ANCHOR_TX_KEY.ANC_ANC_UST_LP_WITHDRAW]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
  ],
  [ANCHOR_TX_KEY.ANC_ANC_UST_LP_STAKE]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    TERRA_QUERY_KEY.ASTROPORT_DEPOSIT,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_UST_LP_REWARDS,
    ANCHOR_QUERY_KEY.ANC_LP_STAKING_STATE,
  ],
  [ANCHOR_TX_KEY.ANC_ANC_UST_LP_UNSTAKE]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    TERRA_QUERY_KEY.ASTROPORT_DEPOSIT,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_UST_LP_REWARDS,
    ANCHOR_QUERY_KEY.ANC_LP_STAKING_STATE,
  ],
  [ANCHOR_TX_KEY.ANC_BUY]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
  ],
  [ANCHOR_TX_KEY.ANC_SELL]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
  ],
  [ANCHOR_TX_KEY.ANC_GOVERNANCE_STAKE]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_GOVERNANCE_REWARDS,
  ],
  [ANCHOR_TX_KEY.ANC_GOVERNANCE_UNSTAKE]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_GOVERNANCE_REWARDS,
  ],
  [ANCHOR_TX_KEY.GOV_CREATE_POLL]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.GOV_POLLS,
    ANCHOR_QUERY_KEY.GOV_MYPOLLS,
  ],
  [ANCHOR_TX_KEY.GOV_VOTE]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.GOV_POLL,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.GOV_VOTERS,
    ANCHOR_QUERY_KEY.REWARDS_ANC_GOVERNANCE_REWARDS,
  ],
  [ANCHOR_TX_KEY.REWARDS_ALL_CLAIM]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_GOVERNANCE_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_ANCHOR_LP_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_ANC_UST_LP_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_CLAIMABLE_UST_BORROW_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_UST_BORROW_REWARDS,
  ],
  [ANCHOR_TX_KEY.REWARDS_ANC_UST_LP_CLAIM]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_GOVERNANCE_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_ANCHOR_LP_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_ANC_UST_LP_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_CLAIMABLE_UST_BORROW_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_UST_BORROW_REWARDS,
  ],
  [ANCHOR_TX_KEY.REWARDS_UST_BORROW_CLAIM]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.ANC_BALANCE,
    ANCHOR_QUERY_KEY.REWARDS_ANC_GOVERNANCE_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_ANCHOR_LP_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_ANC_UST_LP_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_CLAIMABLE_UST_BORROW_REWARDS,
    ANCHOR_QUERY_KEY.REWARDS_UST_BORROW_REWARDS,
  ],
  [ANCHOR_TX_KEY.AIRDROP_CLAIM]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
    ANCHOR_QUERY_KEY.AIRDROP_CHECK,
  ],
  [ANCHOR_TX_KEY.TERRA_SEND]: [
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],

  [ANCHOR_TX_KEY.LIQUIDATION_WITHDRAW]:[
    ANCHOR_QUERY_KEY.WRAPPED_TOKEN_HUB,
    ANCHOR_QUERY_KEY.BID_POOLS_BY_USER,
    ANCHOR_QUERY_KEY.BID_POOLS_BY_COLLATERAL,
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.LIQUIDATION_WITHDRAW_COLLATERAL]:[
    ANCHOR_QUERY_KEY.WRAPPED_TOKEN_HUB,
    ANCHOR_QUERY_KEY.BID_POOLS_BY_USER,
    ANCHOR_QUERY_KEY.BID_POOLS_BY_COLLATERAL,
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ],
  [ANCHOR_TX_KEY.LIQUIDATION_DEPOSIT]:[
    ANCHOR_QUERY_KEY.WRAPPED_TOKEN_HUB,
    ANCHOR_QUERY_KEY.BID_POOLS_BY_USER,
    ANCHOR_QUERY_KEY.BID_POOLS_BY_COLLATERAL,
    TERRA_QUERY_KEY.TOKEN_BALANCES,
    TERRA_QUERY_KEY.CW20_BALANCE,
    TERRA_QUERY_KEY.TERRA_BALANCES,
    TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES,
  ]


};

// build: force re-build trigger - 22.01.03-1
