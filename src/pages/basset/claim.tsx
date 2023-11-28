import { validateTxFee } from '@anchor-protocol/app-fns';
import { useAnchorBank, useBAssetClaimTx } from '@anchor-protocol/app-provider';
import { formatLuna, formatUST } from '@anchor-protocol/notation';
import { useFeeEstimationFor, useFixedFee } from '@libs/app-provider';
import { demicrofy } from '@libs/formatter';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { Section } from '@libs/neumorphism-ui/components/Section';
import { StreamStatus } from '@rx-stream/react';
import { MsgExecuteContract } from '@terra-money/feather.js';
import { useConnectedWallet } from '@terra-money/wallet-kit';
import big from 'big.js';
import { CenteredLayout } from 'components/layouts/CenteredLayout';
import { MessageBox } from 'components/MessageBox';
import { Sub } from 'components/Sub';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { useAccount } from 'contexts/account';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useClaimableRewardsBreakdown } from './hooks/useRewardsBreakdown';
import { CircleSpinner } from 'utils/consts';

export interface BAssetClaimProps {
  className?: string;
}

function Component({ className }: BAssetClaimProps) {
  // ---------------------------------------------
  // dependencies
  // ---------------------------------------------
  const connectedWallet = useAccount();
  const navigate = useNavigate();

  const { connected, terraWalletAddress } = useAccount();

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);
  const [noRewards, setNoRewards] = useState(false);


  const [claim, claimResult] = useBAssetClaimTx();

  // ---------------------------------------------
  // queries
  // ---------------------------------------------
  const { tokenBalances } = useAnchorBank();

  const { totalRewardsUST, rewardBreakdowns } = useClaimableRewardsBreakdown();

  //const {} = useAnchorWebapp()

  // ---------------------------------------------
  // logics
  // ---------------------------------------------

  useEffect(() => {
    setNoRewards(() => false);
    if (!connected || !rewardBreakdowns) {
      return;
    }

    if (rewardBreakdowns.length === 0) {
      setNoRewards(() => true);
    }

    estimateFee(rewardBreakdowns.map((rewardBreakdown) => {
      return new MsgExecuteContract(
        terraWalletAddress as string,
        rewardBreakdown.rewardAddr,
        {
          claim_rewards: {
            recipient: undefined,
          },
        },
      );
    }),);
  }, [
    terraWalletAddress,
    rewardBreakdowns,
    estimateFee,
    connected,
    setNoRewards
  ]);

  const invalidTxFee = useMemo(
    () => !!connectedWallet && !!estimatedFee && validateTxFee(tokenBalances.uLuna, estimatedFee.txFee),
    [connectedWallet, tokenBalances.uUST, estimatedFee?.txFee],
  );

  // ---------------------------------------------
  // callbacks
  // ---------------------------------------------
  const proceed = useCallback(() => {
    if (!connectedWallet || !claim || !totalRewardsUST || !estimatedFee) {
      return;
    }

    if (rewardBreakdowns.length === 0) {
      throw new Error('There is no rewards');
    }

    claim({
      rewardBreakdowns,
      estimatedFee
    });
  }, [claim, totalRewardsUST, connectedWallet, rewardBreakdowns, estimatedFee]);

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------

  const theme = useTheme();

  if (
    claimResult?.status === StreamStatus.IN_PROGRESS ||
    claimResult?.status === StreamStatus.DONE
  ) {
    return (
      <CenteredLayout className={className} maxWidth={720}>
        <Section>
          <TxResultRenderer
            resultRendering={claimResult.value}
            onExit={() => {
              switch (claimResult.status) {
                case StreamStatus.IN_PROGRESS:
                  claimResult.abort();
                  break;
                case StreamStatus.DONE:
                  claimResult.clear();
                  navigate('/aasset');
                  break;
              }
            }}
          />
        </Section>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout className={className} maxWidth={720}>
      <Section>
        <h1>Claim Rewards</h1>

        {!!invalidTxFee && totalRewardsUST.gt(0) && (
          <MessageBox>{invalidTxFee}</MessageBox>
        )}

        <div className="amount">
          {formatUST(demicrofy(totalRewardsUST))} <Sub> axlUSDC</Sub>
        </div>

        <TxFeeList className="receipt">
          {totalRewardsUST && (
            <TxFeeListItem label="Estimated Amount">
              {formatUST(demicrofy(totalRewardsUST))} axlUSDC
            </TxFeeListItem>
          )}
          <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
            {estimatedFee && !noRewards &&
              big(estimatedFee.txFee).gt(0) &&
              `${formatLuna(demicrofy(estimatedFee.txFee))} Luna`}
            {!estimatedFeeError && !estimatedFee && (
              <span className="spinner">
                <CircleSpinner size={18} color={theme.colors.positive} />
              </span>
            )}
            {estimatedFeeError}
            {noRewards && !!estimatedFeeError && " : there is no rewards available"}
          </TxFeeListItem>
        </TxFeeList>

        <ViewAddressWarning>
          <ActionButton
            className="proceed"
            disabled={
              !connectedWallet ||
              !connectedWallet.availablePost ||
              !claim ||
              !totalRewardsUST ||
              !!invalidTxFee
            }
            onClick={proceed}
          >
            Claim
          </ActionButton>
        </ViewAddressWarning>
      </Section>
    </CenteredLayout>
  );
}

export const Amount = styled.div`
  display: flex;
  justify-content: space-between;

  font-size: 18px;
  font-weight: 500;
`;

const StyledComponent = styled(Component)`
  h1 {
    font-size: 27px;
    text-align: center;
    font-weight: 300;

    margin-bottom: 50px;
  }

  .amount {
    font-size: 32px;
    font-weight: normal;
    text-align: center;

    sub {
      font-size: 18px;
      font-weight: 500;
    }
  }

  .receipt {
    margin-top: 60px;
  }

  .proceed {
    margin-top: 40px;

    width: 100%;
    height: 60px;
  }
`;

export const BAssetClaim = StyledComponent;
