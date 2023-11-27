import React from 'react';
import { App } from './App';
import reportWebVitals from './reportWebVitals';
import TerraStationMobileWallet from '@terra-money/terra-station-mobile';
import { getInitialConfig, WalletProvider } from '@terra-money/wallet-kit';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);
getInitialConfig().then((defaultNetworks) => {
    root.render(
        <WalletProvider
            extraWallets={[new TerraStationMobileWallet()]}
            defaultNetworks={defaultNetworks}
        >
            <App />
        </WalletProvider>
    );
});
reportWebVitals();





