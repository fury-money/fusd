import { TokenIcon } from '@anchor-protocol/token-icons';
import { CenteredLayout } from 'components/layouts/CenteredLayout';
import { PageTitle, TitleContainer } from 'components/primitives/PageTitle';
import { links } from 'env';
import { fixHMR } from 'fix-hmr';
import React from 'react';
import styled from 'styled-components';
import { AssetCard } from './components/AssetCard';
import { AssetCardContentBluna } from './components/AssetCardContentBluna';
import { AssetCardContentLSD } from './components/AssetCardContentLSD';
import { Claimable } from './components/Claimable';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box } from '@mui/material';
import { useLSDCollateralQuery } from '@anchor-protocol/app-provider/queries/borrow/useLSDCollateralQuery';

export interface BAssetMainProps {
  className?: string;
}

function Component({ className }: BAssetMainProps) {

  // Getting LSD information

  const lsdCollaterals = useLSDCollateralQuery();

  return (
    <CenteredLayout className={className} maxWidth={1440}>
      <TitleContainer>
        <PageTitle title="MINT & BURN" docs={links.docs.bond} />
      </TitleContainer>

      <Claimable className="claimable-section" />

      <ul className="asset-list">
        <AssetCard
          to="/aasset/aluna"
          title={<p>LUNA/aLUNA<span style={{fontSize: "0.7em"}}> (mint here)</span></p>}
          bAssetIcon={<TokenIcon token="aluna" />}
          originAssetIcon={<TokenIcon token="luna" />}
          hoverText={<Box>MINT & BURN</Box>}
        >
          <AssetCardContentBluna />
        </AssetCard>

        {lsdCollaterals.map((collateral) => 
          <AssetCard
            key={collateral.name}
            to={collateral.info.info.link}
            title={<p>{collateral.info.info.symbol} ({collateral.info.info.protocol})</p>}
            bAssetIcon={<TokenIcon token={collateral.info.info.symbol} variant="@4x" />}
            originAssetIcon={<TokenIcon token={collateral.info.info.underlyingName} />}
            hoverText={<Box sx={{gap: "5px",display: "flex", alignItems: "center", fontSize: "1em !important"}}>MINT & BURN <OpenInNewIcon/> </Box>}
          >
            <AssetCardContentLSD 
              asset={collateral.info.info.symbol} 
              underlyingName={collateral.info.info.underlyingName} 
              underlyingToken={collateral.info.info.underlyingToken} 
            />
          </AssetCard>
        ) 

        }        
      </ul>
    </CenteredLayout>
  );
}

const StyledComponent = styled(Component)`
  .claimable-section {
    margin-bottom: 40px;
  }

  .message-box {
    font-size: 13px;
    margin: 20px 0 20px 0;
  }

  .asset-list {
    list-style: none;
    padding: 0;

    display: flex;
    gap: 40px;

    > li {
      width: 330px;
      height: 436px;
    }
  }

  @media (max-width: 800px) {
    .asset-list {
      flex-direction: column;
      gap: 20px;

      > li {
        width: 100%;
        height: 380px;
      }
    }
  }
`;

export const BAssetMain = fixHMR(StyledComponent);
