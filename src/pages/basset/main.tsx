import { TokenIcon } from '@anchor-protocol/token-icons';
import { CenteredLayout } from 'components/layouts/CenteredLayout';
import { PageTitle, TitleContainer } from 'components/primitives/PageTitle';
import { links } from 'env';
import { fixHMR } from 'fix-hmr';
import React from 'react';
import styled from 'styled-components';
import { AssetCard } from './components/AssetCard';
import { AssetCardContentBluna } from './components/AssetCardContentBluna';
import { Claimable } from './components/Claimable';

export interface BAssetMainProps {
  className?: string;
}

function Component({ className }: BAssetMainProps) {
  return (
    <CenteredLayout className={className} maxWidth={1440}>
      <TitleContainer>
        <PageTitle title="aASSET" docs={links.docs.bond} />
      </TitleContainer>

      <Claimable className="claimable-section" />

      <ul className="asset-list">
        <AssetCard
          to="/aasset/aluna"
          title="LUNA/aLUNA"
          bAssetIcon={<TokenIcon token="bluna" />}
          originAssetIcon={<TokenIcon token="luna" />}
          hoverText="MINT & BURN"
        >
          <AssetCardContentBluna />
        </AssetCard>
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
