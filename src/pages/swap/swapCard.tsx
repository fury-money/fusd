import { validateTxFee } from '@anchor-protocol/app-fns';
import {
  useAnchorBank,
  useAnchorWebapp,
} from '@anchor-protocol/app-provider';
import {
  formatLuna,
  formatLunaInput,
  LUNA_INPUT_MAXIMUM_DECIMAL_POINTS,
  LUNA_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { TokenIcon, Tokens } from '@anchor-protocol/token-icons';
import { aLuna, u } from '@anchor-protocol/types';
import {
  demicrofy,
  formatFluidDecimalPoints,
  microfy,
  MICRO,
} from '@libs/formatter';
import { isZero } from '@libs/is-zero';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { HorizontalHeavyRuler } from '@libs/neumorphism-ui/components/HorizontalHeavyRuler';
import { NumberMuiInput } from '@libs/neumorphism-ui/components/NumberMuiInput';
import {
  SelectAndTextInputContainer,
  SelectAndTextInputContainerLabel,
} from '@libs/neumorphism-ui/components/SelectAndTextInputContainer';
import { Luna, Token } from '@libs/types';
import { useResolveLast } from '@libs/use-resolve-last';
import { ArrowDropDown } from '@mui/icons-material';
import { StreamStatus } from '@rx-stream/react';
import big, { Big, BigSource } from 'big.js';
import { DiscloseSlippageSelector } from 'components/DiscloseSlippageSelector';
import { MessageBox } from 'components/MessageBox';
import { IconLineSeparator } from 'components/primitives/IconLineSeparator';
import { SlippageSelectorNegativeHelpText } from 'components/SlippageSelector';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { SwapListItem, TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { useAccount } from 'contexts/account';
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { validateSwapAmount } from './logic/validateSwapAmount';
import { ConvertSymbols, ConvertSymbolsContainer } from './components/ConvertSymbols';
import styled, { useTheme } from 'styled-components';
import { fixHMR } from 'fix-hmr';
import { useFeeEstimationFor } from '@libs/app-provider';
import { useAlert } from '@libs/neumorphism-ui/components/useAlert';
import { floor } from '@libs/big-math';
import { CircleSpinner } from 'react-spinners-kit';
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { SwapResponse, SwapSimulationAndSwapResponse, tfmEstimation, TFMToken, useTFMTokensQuery } from './queries/tfmQueries';
import { useBalance } from './queries/balanceQuery';
import { getTFMSwapMsg } from '@anchor-protocol/app-fns/tx/swap/tfm';
import { useTFMSwapTx } from '@anchor-protocol/app-provider/tx/swap/tfm';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';


const swapAssetsWhitelist = [
  "uusdc",
  "LUNA",
  "boneLuna",
  "Eris Amplified LUNA",
  "Cavern Bonded Luna",
]

const swapAssetsIcons: Tokens[]  = [
  "ust",
  "luna",
  "bLuna",
  "ampLuna",
  "aluna"  
];


function nameToIcon(name: string){
  return swapAssetsIcons[swapAssetsWhitelist.indexOf(name)]
}


export interface SwapProps {
  className?: string;
}

const SLIPPAGE_VALUES = [0.01, 0.03, 0.05];
const LOW_SLIPPAGE = 0.03;
const FRONTRUN_SLIPPAGE = 0.15;

export function Component({
  className,
}: SwapProps) {
  // ---------------------------------------------
  // dependencies
  // ---------------------------------------------
  const { availablePost, connected, terraWalletAddress } = useAccount();

  const {
    queryClient,
    contractAddress,
  } = useAnchorWebapp();

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

  const [swap, swapResult] = useTFMSwapTx();

  const [openAlert, alertElement] = useAlert();

  const {data: allAvailableTokens} = useTFMTokensQuery();

  const availableTokens = useMemo(()=> (allAvailableTokens ?? []).filter(({name}) => {
    return swapAssetsWhitelist.includes(name)
  }), [allAvailableTokens])


  // ---------------------------------------------
  // states
  // ---------------------------------------------
  const [swapAmount, setSwapAmount] = useState<aLuna>('' as aLuna);
  const [getAmount, setGetAmount] = useState<number>(0);
  const [slippage, setSlippage] = useState<number>(0.05);

  const [swapTokens, setSwapTokens] = useState({out: {
      contract_addr: contractAddress.native.usd as string,
      name: "uusdc",
      symbol:"axlUSDC"
    }, in: {
      contract_addr: "uluna",
      name: "LUNA",
      symbol: "LUNA"
    }
  });

  const swapTokenBalances = {
    in: useBalance(swapTokens.in.contract_addr),
    out: useBalance(swapTokens.out.contract_addr)
  };

  const [resolving, setResolving] = useState(false);
  const [resolveSimulation, simulation] = useResolveLast<
    SwapSimulationAndSwapResponse | undefined | null
  >(() => null, () => setResolving(false));

  // ---------------------------------------------
  // queries
  // ---------------------------------------------
  const bank = useAnchorBank();

  // ---------------------------------------------
  // logics
  // ---------------------------------------------
  const invalidTxFee = useMemo(
    () =>
      connected && validateTxFee(bank.tokenBalances.uUST, estimatedFee?.txFee),
    [bank, estimatedFee?.txFee, connected],
  );

  const invalidSwapAmount = useMemo(
    () => connected && validateSwapAmount(swapAmount, swapTokenBalances.in as Token<string>),
    [bank, swapAmount, connected],
  );

  // ---------------------------------------------
  // effects
  // ---------------------------------------------
  useEffect(() => {
    if (simulation?.quote?.return_amount) {
      setGetAmount(simulation?.quote?.return_amount ?? 0);
    }
  }, [setGetAmount, simulation?.quote?.return_amount]);

  // ---------------------------------------------
  // callbacks
  // ---------------------------------------------


  
  const runtfmEstimation = useCallback(
    async (nextSwapAmount: string, slippage: number) => {
      if (nextSwapAmount.trim().length === 0 || isZero(nextSwapAmount)) {
        resolveSimulation(null);
      } else {
        const swapAmount: aLuna = nextSwapAmount as aLuna;
        const amount = microfy(swapAmount).toString() as u<aLuna>;

        resolveSimulation(
          tfmEstimation({tokenIn: swapTokens.in.contract_addr, tokenOut: swapTokens.out.contract_addr, amount, slippage})
        );
        setResolving(true);
      }
    },
    [
      resolveSimulation,
      swapTokens.in.contract_addr,
      swapTokens.out.contract_addr,
    ],
  );


  const updateSwapAmount = useCallback(
    async (nextSwapAmount: string, slippage: number) => {
      if (nextSwapAmount.trim().length === 0 || !queryClient) {
        setGetAmount(0);
        setSwapAmount('' as aLuna);

      } else if (isZero(nextSwapAmount)) {
        setGetAmount(0);
        setSwapAmount(nextSwapAmount as aLuna);

      } else {
        const swapAmount: aLuna = nextSwapAmount as aLuna;
        setSwapAmount(swapAmount);
        const amount = microfy(swapAmount).toString() as u<aLuna>;
      }
      runtfmEstimation(nextSwapAmount, slippage);
    },
    [
      queryClient,
      resolveSimulation,
      setSwapAmount,
      setGetAmount,
      swapTokens.in.contract_addr,
      swapTokens.out.contract_addr,
    ],
  );

  const updateSlippage = useCallback(
    (nextSlippage: number) => {
      setSlippage(nextSlippage);
      updateSwapAmount(swapAmount, nextSlippage);
    },
    [swapAmount, updateSwapAmount],
  );
  
  useEffect(
    () => {
      runtfmEstimation(swapAmount, slippage);
    }, [swapAmount, updateSwapAmount, slippage, swapTokens])
    
  const init = useCallback(() => {
    setGetAmount(0);
    setSwapAmount('' as aLuna);
  }, [setGetAmount, setSwapAmount]);

  const proceed = useCallback(
    async (simulation: SwapResponse | undefined) => {
      if (!connected || !swap || !terraWalletAddress || !simulation) {
        return;
      }
      if (estimatedFee) {
        swap({
          simulation,
          gasWanted: estimatedFee.gasWanted,
          txFee: estimatedFee.txFee,
          onTxSucceed: () => {
            init();
          },
        });
      } else {
        await openAlert({
          description: (
            <>
              Broadcasting failed,
              <br />
              please retry after some time.
            </>
          ),
          agree: 'OK',
        });
      }
    },
    [connected, swap, init, estimatedFee, openAlert, terraWalletAddress],
  );

  // ---------------------------------------------
  // effects
  // ---------------------------------------------

  useEffect(() => {
    if (!connected || swapAmount.length === 0 || !simulation?.swap.value.execute_msg || !terraWalletAddress) {
      estimateFee(null);
      return;
    }

    const amount = floor(big(swapAmount).mul(MICRO));

    if (amount.lt(0) || amount.gt(swapTokenBalances.in)) {
      estimateFee(null);
      return;
    }

    let msg = getTFMSwapMsg(simulation?.swap, terraWalletAddress);
    estimateFee([msg]);

  }, [
    terraWalletAddress,
    bank.tokenBalances.uaLuna,
    swapAmount,
    connected,
    simulation?.swap?.value?.execute_msg,
    contractAddress.aluna.hub,
    contractAddress.cw20.aLuna,
    contractAddress.terraswap.alunaLunaPair,
    estimateFee,
    slippage,
  ]);

  useEffect(() => {
    if (swapAmount.length > 0) {
      updateSwapAmount(swapAmount, slippage);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------
  const theme = useTheme();

  // Token selector
  const [anchorEl, setAnchorEl] = React.useState<{in: null | HTMLElement, out:null | HTMLElement}>({
    in: null,
    out: null
  });
  const open = {
    in: Boolean(anchorEl.in),
    out: Boolean(anchorEl.out)
  }
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, type: "in" | "out") => {
    setAnchorEl((el)=> ({
      ...el,
      [type]: event.currentTarget
    }));
  };

  const handleClose = (type: "in" | "out", token?: TFMToken) => {
    if(token && type){  
      if((type == "in" && swapTokens.out.name != token.name) || (type == "out" && swapTokens.in.name != token.name) ){
        setSwapTokens((swapToken) => ({
          ...swapToken,
          [type]: {
            name: token.name,
            symbol: token.symbol,
            contract_addr: token.contract_addr
          }
        }))
      }
    }

    setAnchorEl((el) => ({
      ...el,
      [type]: null,
    }));
  };

  const switchAssets = () => {
    setSwapTokens((swapToken) => ({
      in: swapTokens.out,
      out: swapTokens.in,
    }))
  }

  if (
    swapResult?.status === StreamStatus.IN_PROGRESS ||
    swapResult?.status === StreamStatus.DONE
  ) {
    return (
      <TxResultRenderer
        resultRendering={swapResult.value}
        onExit={() => {
          init();
          switch (swapResult.status) {
            case StreamStatus.IN_PROGRESS:
              swapResult.abort();
              break;
            case StreamStatus.DONE:
              swapResult.clear();
              break;
          }
        }}
      />
    );
  }

  return (
    <>
      <Box sx={{textAlign: "right", display: "flex", alignItems: "center", justifyContent: "end", color: theme.dimTextColor}}>
        Powered by TFM <img style={{marginLeft: "8px"}} src="/tfm-logo.png" />
      </Box>
    <div className={className} style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>


      <ConvertSymbolsContainer>
        <ConvertSymbols
          className="symbols"
          view="swap"
          fromIcon={<TokenIcon token={nameToIcon(swapTokens.in.name)} />}
          toIcon={<TokenIcon token={nameToIcon(swapTokens.out.name)} />}
        />
      </ConvertSymbolsContainer>

      {/* Swap any asset (related to Cavern) */}
      <div className="swap-description">
        <p>I want to swap</p>
        <p />
      </div>

      <SelectAndTextInputContainer
        className="swap"
        gridColumns={[140, '1fr']}
        error={!!invalidSwapAmount}
        leftHelperText={invalidSwapAmount}
        rightHelperText={
          connected && (
            <span>
              Balance:{' '}
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() =>
                  updateSwapAmount(
                    formatLunaInput(demicrofy(swapTokenBalances.in as u<Luna>) as Luna<Big>),
                    slippage,
                  )
                }
              >
                {formatLuna(demicrofy(swapTokenBalances.in as u<Luna>) as Luna<Big>)} {swapTokens.in.symbol}
              </span>
            </span>
          )
        }
      >
        <SelectAndTextInputContainerLabel>
          <Button
            id="basic-button"
            aria-controls={open.in ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open.in ? 'true' : undefined}
            onClick={(event) => handleClick(event, "in")}
            sx={{color: theme.textColor, textTransform: "unset"}}
          >
            <TokenIcon token={nameToIcon(swapTokens.in.name)} /> {swapTokens.in.symbol} <ArrowDropDown/>
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl.in}
            open={open.in}
            onClose={() => handleClose("in")}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            {availableTokens.map(token => {
              return (
                <MenuItem key={`${token.name}-${token.id}-in`} onClick={() => handleClose("in",token)}>
                  <ListItemIcon>
                    <TokenIcon token={nameToIcon(token.name)} />
                  </ListItemIcon>
                  <ListItemText>{token.symbol}</ListItemText>
                </MenuItem>
               )
            })}
          </Menu>
        </SelectAndTextInputContainerLabel>
        <NumberMuiInput
          placeholder="0.00"
          error={!!invalidSwapAmount}
          value={swapAmount}
          maxIntegerPoinsts={LUNA_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={LUNA_INPUT_MAXIMUM_DECIMAL_POINTS}
          onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
            updateSwapAmount(target.value, slippage)
          }
        />
      </SelectAndTextInputContainer>

      <Button role="button" onClick={switchAssets} sx={{maxWidth: "100px", margin: "auto"}}>
        <CompareArrowsIcon style={{transform:"rotate(90deg)"}}/>
      </Button>

      {/* Get (Asset) */}
      <div className="gett-description">
        <p>and get</p>
        <p />
      </div>

      <SelectAndTextInputContainer
        className="gett"
        gridColumns={[140, '1fr']}
        error={!!invalidSwapAmount}
        rightHelperText={resolving && <CircleSpinner size={14} color={theme.colors.positive} />}
      >
        <SelectAndTextInputContainerLabel>
          <Button
            id="basic-button"
            aria-controls={open.out ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open.out ? 'true' : undefined}
            onClick={(event) => handleClick(event, "out")}
            sx={{color: theme.textColor, textTransform: "unset"}}
          >
            <TokenIcon token={nameToIcon(swapTokens.out.name)} /> {swapTokens.out.symbol} <ArrowDropDown/>
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl.out}
            open={open.out}
            onClose={() => handleClose("out")}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            {availableTokens.map(token => {
              return (
                <MenuItem key={`${token.name}-${token.id}-out`} onClick={() => handleClose("out", token)}>
                  <ListItemIcon>
                    <TokenIcon token={nameToIcon(token.name)} />
                  </ListItemIcon>
                  <ListItemText>{token.symbol}</ListItemText>
                </MenuItem>
               )
            })}
          </Menu>
        </SelectAndTextInputContainerLabel>
        <NumberMuiInput
          placeholder="0.00"
          error={!!invalidSwapAmount}
          value={getAmount}
          maxIntegerPoinsts={LUNA_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={LUNA_INPUT_MAXIMUM_DECIMAL_POINTS}
        />
      </SelectAndTextInputContainer>

      {!!invalidTxFee && <MessageBox>{invalidTxFee}</MessageBox>}


      <DiscloseSlippageSelector
        className="slippage"
        items={SLIPPAGE_VALUES}
        value={slippage}
        onChange={updateSlippage}
        helpText={
          slippage < LOW_SLIPPAGE ? (
            <SlippageSelectorNegativeHelpText>
              The transaction may fail
            </SlippageSelectorNegativeHelpText>
          ) : slippage > FRONTRUN_SLIPPAGE ? (
            <SlippageSelectorNegativeHelpText>
              The transaction may be frontrun
            </SlippageSelectorNegativeHelpText>
          ) : undefined
        }
      />

      {swapAmount.length > 0 && simulation && (
        <TxFeeList className="receipt">
          <SwapListItem
            label="Price"
            currencyA={swapTokens.out.symbol}
            currencyB={swapTokens.in.symbol}
            exchangeRateAB={big(simulation.quote.return_amount ?? "0").div(simulation.quote.input_amount ?? "1")}
            initialDirection="a/b"
            formatExchangeRate={(price) =>
              formatFluidDecimalPoints(
                price,
                LUNA_INPUT_MAXIMUM_DECIMAL_POINTS,
                { delimiter: true },
              )
            }
          />
          <TxFeeListItem label="Minimum Received">
            {formatLuna(simulation.quote.return_amount * (1 - slippage) as Luna<BigSource>)} {swapTokens.out.symbol}
          </TxFeeListItem>
          {!invalidTxFee && !invalidSwapAmount &&
            <TxFeeListItem label="Tx Fee">
              {!estimatedFeeError && !estimatedFee && (
                <span className="spinner">
                  <CircleSpinner size={14} color={theme.colors.positive} />
                </span>
              )}
              {estimatedFee &&
                `≈ ${formatLuna(demicrofy(estimatedFee.txFee))} Luna`}{' '}
              {estimatedFeeError}
            </TxFeeListItem>
          }
        </TxFeeList>
      )}

      {/* Submit */}
      <Box sx={{
        textAlign: "center",
        marginTop: "30px",
      }}>
      <ViewAddressWarning >
        <ActionButton
          className="submit"
          sx={{
            padding: "20px 50px"
          }}
          disabled={
            !availablePost ||
            !connected ||
            !swap ||
            !simulation ||
            swapAmount.length === 0 ||
            big(swapAmount).lte(0) ||
            !!invalidTxFee ||
            !!invalidSwapAmount
          }
          onClick={() =>
            simulation && proceed(simulation?.swap)
          }
        >
          Swap
        </ActionButton>
      </ViewAddressWarning>
      </Box>
      {alertElement}
    </div>
    </>
  );
}

const StyledComponent = styled(Component)`
  .swap,
  .gett {
    img {
      font-size: 12px;
    }
  }
  padding: 20px;
`;

export const SwapCard = fixHMR(StyledComponent);
