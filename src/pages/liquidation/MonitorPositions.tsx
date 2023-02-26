import { useAllPositionsQuery } from "@anchor-protocol/app-provider/queries/liquidate/monitorPositions";
import { useFormatters } from "@anchor-protocol/formatter";
import { HorizontalScrollTable } from "@libs/neumorphism-ui/components/HorizontalScrollTable";
import { IconSpan } from "@libs/neumorphism-ui/components/IconSpan";
import { InfoTooltip } from "@libs/neumorphism-ui/components/InfoTooltip";
import { u, UST } from "@libs/types";
import { CenteredLayout } from "components/layouts/CenteredLayout";
import { FlexTitleContainer, PageTitle } from "components/primitives/PageTitle";
import React, { useMemo } from "react";
import { PaddingSection } from "./components/PaddingSection";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import big from "big.js";

export interface MonitorPositionsProps {
  className?: string;
}

export function MonitorPositions({className}: MonitorPositionsProps){


	const {data: positionData} = useAllPositionsQuery();

	const displayData = useMemo(()=>{
		return positionData
			?.sort((a, b) => b.borrow - a.borrow)
			?.sort((a, b)=> +(a.over_limit == "true") - +(b.over_limit == "true"))
	},[positionData])

	const totalBorrowed = useMemo(()=> {
		return positionData
		?.reduce((acc, v)=> acc.add(v.borrow), big(0))
	}, [positionData])


  const {
    ust: { formatOutput: formatUSTOutput, demicrofy: demicrofyUST },
  } = useFormatters();

	return (
	<CenteredLayout className={className} maxWidth={2000}>
      <>
        <FlexTitleContainer>
          <PageTitle title="MONITOR POSITIONS"/>
        </FlexTitleContainer>
        <section className="grid">
          <PaddingSection className="main-section" padding="20px 20px" style={{margin: "auto 50px"}}>
            <HorizontalScrollTable minWidth={850}>
              <thead>
                <tr>
                  <th style={{display: "flex", alignItems: "center", gap: "5px"}}>Borrower
                  </th>
                  <th>
                    <IconSpan>
                      Current borrowed amount{' '}
                      <InfoTooltip>
                        Current amount that this address is borrowing
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                  <th>
                    <IconSpan>
                      Borrowing limit{' '}
                      <InfoTooltip>
                        Maximum amount this address is able to borrow
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                  <th>
                    <IconSpan>
                      Pending liquidation{' '}
                      <InfoTooltip>
                        States whether this address will be liquidated shortly
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                </tr>
              </thead>
              <tbody>
                {positionData?.map(
                  ({
                  	borrower,
					over_limit,
					borrow,
					limit,
                  }) => (
                    <tr key={borrower}>
                      <td>
                        <div className="value">{borrower}</div>
                      </td>
                      <td>
                        <div className="value">
                          {formatUSTOutput(demicrofyUST((borrow ?? 0).toString() as u<UST>))} axlUSDC
                        </div>
                      </td>
                      <td>
                        <div className="value">
                           {formatUSTOutput(demicrofyUST((limit ?? 0).toString() as u<UST>))} axlUSDC
                        </div>
                      </td>
                      <td>
                      	{over_limit == "true" && <CheckIcon style={{backgroundColor: "green"}}/>}
                      	{over_limit == "false" && <CloseIcon style={{backgroundColor: "red"}}/>}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </HorizontalScrollTable>
        </PaddingSection>
      </section>
      </>
    </CenteredLayout>)
}