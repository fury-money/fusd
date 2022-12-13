import { useDeploymentTarget } from '@anchor-protocol/app-provider';
import { Tab } from '@libs/neumorphism-ui/components/Tab';
import { PaddedLayout } from 'components/layouts/PaddedLayout';
import { PageTitle, TitleContainer } from 'components/primitives/PageTitle';
import { Borrow } from 'pages/mypage/components/Borrow';
import React, { useMemo, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';
import { Earn } from './components/Earn';
import { TotalValue } from './components/TotalValue';
// import { TransactionHistory } from './components/TransactionHistory';

export interface MypageProps {
  className?: string;
}

interface Item {
  label: string;
  value: string;
}

const TAB_ITEMS: Item[] = [
  { label: 'All', value: 'all' },
  { label: 'Earn', value: 'earn' },
  { label: 'Borrow', value: 'borrow' },
  { label: 'History', value: 'history' },
];

function MypageBase({ className }: MypageProps) {
  const isSmallLayout = useMediaQuery({ query: '(max-width: 1000px)' });

  const {
    target: { isNative },
  } = useDeploymentTarget();

  const tabItems = useMemo(() => {
    if (isNative === false) {
      return TAB_ITEMS.filter((item) => item.value !== 'rewards');
    }
    return TAB_ITEMS;
  }, [isNative]);

  const [tab, setTab] = useState<Item>(() => tabItems[0]);

  return (
    <PaddedLayout className={className}>
      <TitleContainer>
        <PageTitle title="MY PAGE" />
      </TitleContainer>

      <OverviewRow>
        <TotalValue />
      </OverviewRow>

      {!isSmallLayout && (
        <Tab
          className="tab"
          items={tabItems}
          selectedItem={tab ?? tabItems[0]}
          onChange={setTab}
          labelFunction={({ label }) => label}
          keyFunction={({ value }) => value}
        />
      )}

      {(isSmallLayout || tab.value === 'all' || tab.value === 'earn') && (
        <>
          <h2>EARN</h2>
          <Earn />
        </>
      )}

      {(isSmallLayout || tab.value === 'all' || tab.value === 'borrow') && (
        <>
          <h2>BORROW</h2>
          <Borrow />
        </>
      )}

      {/* {(isSmallLayout || tab.value === 'all' || tab.value === 'history') && (
        <>
          <h2>TRANSACTION HISTORY</h2>
          <TransactionHistory />
        </>
      )} */}
    </PaddedLayout>
  );
}

const OverviewRow = styled.div`
  display: flex;
  gap: 40px;

  .NeuSection-root {
    margin-bottom: 0;
  }

  > :nth-child(1) {
    flex: 1;
  }

  > :nth-child(2) {
    width: 532px;
  }

  @media (max-width: 1200px) {
    flex-direction: column;

    > :nth-child(2) {
      width: 100%;
    }
  }
`;

export const StyledMypage = styled(MypageBase)`
  h2 {
    font-size: 18px;
    font-weight: 700;
    margin-top: 60px;
    margin-bottom: 20px;
  }

  .tab {
    margin-top: 60px;
  }
`;

export const Mypage =
  process.env.NODE_ENV === 'production'
    ? StyledMypage
    : (props: MypageProps) => <StyledMypage {...props} />;
