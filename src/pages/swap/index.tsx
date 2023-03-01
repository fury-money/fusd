import { CenteredLayout } from "components/layouts/CenteredLayout";
import { FlexTitleContainer, PageTitle } from "components/primitives/PageTitle";
import { PaddingSection } from "pages/liquidation/components/PaddingSection";
import React from "react";
import { SwapCard } from "./swapCard";


export interface SwapProps{
  className: string
}

export function Swap({className}: SwapProps){
  return (
    <CenteredLayout className={className} maxWidth={2000}>
      <FlexTitleContainer>
          <PageTitle title="SWAP" />
        </FlexTitleContainer>
        <section>     
          <PaddingSection className="main-section" padding="20px 20px" style={{maxWidth: "520px", margin: "auto"}} >  
            <SwapCard/>
          </PaddingSection>
        </section>
    </CenteredLayout>
  )
}