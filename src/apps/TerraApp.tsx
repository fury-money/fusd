import { WalletControllerChainOptions } from '@terra-money/wallet-provider';
import { GlobalStyle } from 'components/GlobalStyle';
import { Header } from 'components/Header';
import { Claim as AncVestingClaim } from 'pages/anc/vesting';
import { BlunaConvert, BLunaMint, BLunaBurn } from 'pages/basset/bluna.convert';
import { BlunaWithdraw } from 'pages/basset/bluna.withdraw';
import { BAssetClaim } from 'pages/basset/claim';
import { BAssetMain } from 'pages/basset/main';
import { Earn as Liquidate } from 'pages/liquidation';
import { WormholeConvert } from 'pages/basset/wh.convert';
import { WormholeConvertToBAsset } from 'pages/basset/wh.convert.to-basset';
import { WormholeConvertToWBAsset } from 'pages/basset/wh.convert.to-wbasset';
import { Borrow } from 'pages/borrow';
import { Dashboard } from 'pages/dashboard';
import { Earn } from 'pages/earn';

import { Mypage } from 'pages/mypage';
import { TermsOfService } from 'pages/terms';

import { TerraAppProviders } from 'providers/terra/TerraAppProviders';
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import '../configurations/chartjs';

type TerraAppProps = {
  chainOptions: WalletControllerChainOptions | null;
};

export function TerraApp({ chainOptions }: TerraAppProps) {
  return (
    chainOptions && (
      <TerraAppProviders {...chainOptions}>
        <div>
          <GlobalStyle />
          <Header />
          <Routes>
            <Route index={true} element={<Dashboard />} />

            <Route path="/earn" element={<Earn />} />

            <Route path="/borrow" element={<Borrow />} />

            <Route path="/aasset" element={<BAssetMain />} />

            <Route path="/aasset/aluna" element={<BlunaConvert />}>
              <Route path="" element={<Navigate to="mint" />} />
              <Route path="mint" element={<BLunaMint />} />
              <Route path="burn" element={<BLunaBurn />} />
              <Route path="*" element={<Navigate to="mint" />} />
            </Route>

            <Route path="/aasset/withdraw" element={<BlunaWithdraw />} />

            <Route path="/aasset/claim" element={<BAssetClaim />} />

            <Route path="/aasset/wh/:tokenSymbol" element={<WormholeConvert />}>
              <Route path="" element={<Navigate to="to-aasset" />} />
              <Route path="to-aasset" element={<WormholeConvertToBAsset />} />
              <Route path="to-waasset" element={<WormholeConvertToWBAsset />} />
              <Route path="*" element={<Navigate to="to-aasset" />} />
            </Route>

            <Route path={`/anc/vesting/claim`} element={<AncVestingClaim />} />

            <Route path="/liquidation" element={<Liquidate />} />

            <Route path="/mypage" element={<Mypage />} />
            <Route path="/terms" element={<TermsOfService />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </TerraAppProviders>
    )
  );
}
