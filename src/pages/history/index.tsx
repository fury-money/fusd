
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown'
import { CenteredLayout } from 'components/layouts/CenteredLayout';

import { FlexTitleContainer, PageTitle } from 'components/primitives/PageTitle';
import { screen } from 'env';
import { fixHMR } from 'fix-hmr';
import styled from 'styled-components';
import { PaddingSection } from 'pages/liquidation/components/PaddingSection';


import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from "remark-gfm";
import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you
import rehypeRaw from 'rehype-raw'
import remarkEmoji from "remark-emoji";
import { useWhitePaperQuery } from './queries/useWhitePaperQuery';
const { decompressFromUTF16 } = require('lz-string');
import {markdownString} from "./markdown"

export interface HistoryProps {
  className?: string;
}

let hashFragment = '';
let observer: MutationObserver | null = null;
let asyncTimerId: number | null = null;
let scrollFunction: Function | null = null;


function Component({ className }: HistoryProps) {

  const scrollReset = () =>{
    hashFragment = '';
    if (observer !== null) observer.disconnect();
    if (asyncTimerId !== null) {
      window.clearTimeout(asyncTimerId);
      asyncTimerId = null;
    }
  }

  function getElAndScroll() {
    let element = null;
    console.log(hashFragment)
    if (hashFragment === '#') {
      // use document.body instead of document.documentElement because of a bug in smoothscroll-polyfill in safari
      // see https://github.com/iamdustan/smoothscroll/issues/138
      // while smoothscroll-polyfill is not included, it is the recommended way to implement smoothscroll
      // in browsers that don't natively support el.scrollIntoView({ behavior: 'smooth' })
      element = document.body;
    } else {
      // check for element with matching id before assume '#top' is the top of the document
      // see https://html.spec.whatwg.org/multipage/browsing-the-web.html#target-element
      const id = hashFragment.replace('#', '');
      element = document.getElementById(id);
      if (element === null && hashFragment === '#top') {
        // see above comment for why document.body instead of document.documentElement
        element = document.body;
      }
    }

    if (element !== null && scrollFunction != null) {
      scrollFunction(element);
      scrollReset();
      return true;
    }
    return false;
  }

  const hashLinkScroll = (timeout: number) => {
    // Push onto callback queue so it runs after the DOM is updated
    window.setTimeout(() => {
      if (getElAndScroll() === false) {
        if (observer === null) {
          observer = new MutationObserver(getElAndScroll);
        }
        observer.observe(document, {
          attributes: true,
          childList: true,
          subtree: true,
        });
        // if the element doesn't show up in specified timeout or 10 seconds, stop checking
        asyncTimerId = window.setTimeout(() => {
          scrollReset();
        }, timeout || 10000);
      }
    }, 0);
  }

  useEffect(() =>{
    const els = document.querySelectorAll("#whitepaper-document a");
    els.forEach((el: any)=>{


      const footnoteRegex = /(#(fn|fnref)[0-9]+)/
      if(el.href.match(footnoteRegex)){
        // We remove the existing listener
        const elClone = el.cloneNode(true);
        el.parentNode.replaceChild(elClone, el);
       // We add a click event listener for going to the # ref
        elClone.addEventListener("click", function handleClick(e: any) {
          e.preventDefault();
          hashFragment = elClone.href.match(footnoteRegex)[1];
          console.log(hashFragment)
          if (
            hashFragment !== '' &&
            // ignore non-vanilla click events, same as react-router
            // below logic adapted from react-router: https://github.com/ReactTraining/react-router/blob/fc91700e08df8147bd2bb1be19a299cbb14dbcaa/packages/react-router-dom/modules/Link.js#L43-L48
            e.button === 0 && // ignore everything but left clicks
            !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) // ignore clicks with modifier keys
          ) {

            scrollFunction = 
              (el: any) => el.scrollIntoView({ behavior: 'smooth' });
            hashLinkScroll(10000);
          }
        })
      }
    })
  })


  const {data: whitePaper} = useWhitePaperQuery();
  const [whitePaperMarkdownText, setWhitePaperMarkdownText] = useState<string | null>(null);

  useEffect(() => {
    if(!whitePaper?.nftInfo?.extension?.image_data){
      return;
    }
    const decompressData = async () => {

      if(!whitePaper?.nftInfo?.extension?.image_data){
        return;
      }
      const text = await decompressFromUTF16(whitePaper.nftInfo.extension.image_data);
      setWhitePaperMarkdownText(text)
    }
    decompressData();


  }, [whitePaper, setWhitePaperMarkdownText]);


  return (
    <CenteredLayout className={className} maxWidth={2000}>
      <FlexTitleContainer>
        <PageTitle className="historyTitle" title="HISTORY"/>
      </FlexTitleContainer>
      <PaddingSection className="introductory-text" padding="20px 30px" style={{margin: "10px 30px 50px 30px"}}>
        You will find in this section a little history avout Cavern Protocol as well as the future orientations the protocol will take. 
        <br/>
        All this content will be solely stored on-chain in the form of NFTs.
        <br/>
        This will be published in order for everyone to be able to access them as long as the Terra blockchain exists (it will surely outlive this protocol).
        <br/>
        <br/>
        This is what you could call our <strong>Whitepaper</strong>. 
      </PaddingSection>
      <PaddingSection id="whitepaper-document" className="latex-reader" padding="20px 50px" style={{margin: "50px 30px"}}>
        <ReactMarkdown 
          remarkPlugins={[remarkMath,remarkGfm, remarkEmoji as any]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
        >
          {/*markdownString ||*/ whitePaperMarkdownText || ""}
        </ReactMarkdown>
        {/*<TeX math={tex} block />*/}

      </PaddingSection>
    </CenteredLayout>
  );
}

const StyledComponent = styled(Component)`
  // ---------------------------------------------
  // markdown style
  // ---------------------------------------------
  .latex-reader{
    color: ${({ theme }) => theme.textColor};
    h1{
      margin: 30px 0px 50px 0px;
      font-size: 3em;
    }

    h2 {
      margin: 30px 0px 20px 0px;
      font-size: 2em;
      font-weight: 500;
      letter-spacing: -0.3px;
    }

    h3 {
      margin: 15px 0px 5px 0px;
      font-size: 1.5em;
    }

    a{
      color: ${({ theme }) => theme.textColor};
    }

    .block-math .math.math-inline{
      display:block;
      margin: 10px 0px;
      padding-left: 10px;
    }

    li{
      margin-top: 4px;
      margin-bottom:4px;
    }

    code{
      background-color: ${({ theme }) => theme.textColor};
      color: ${({ theme }) => theme.backgroundColor};
      border-radius: 3px;
      padding: 0px 3px;
    }

  }



  // ---------------------------------------------
  // page style
  // ---------------------------------------------


  hr {
    margin: 30px 0;
  }

  .decimal-point {
    color: ${({ theme }) => theme.dimTextColor};
  }

  .liquidation-stats {
    .amount {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.3px;
      color: ${({ theme }) => theme.textColor};

      .denom {
        font-size: 18px;
      }
    }

    .liquidation-stats-numbers {
      margin-top: 64px;
    }
  }

  .place-bid {
    .apy {
      text-align: center;

      .name {
        margin-bottom: 5px;
      }

      .value {
        font-size: 50px;
        font-weight: 500;
        color: ${({ theme }) => theme.colors.primary};
      }

      .projectedValue {
        font-size: 12px;
        color: ${({ theme }) => theme.textColor};
        margin-bottom: 50px;

        b {
          font-weight: 500;
        }
      }

      figure {
        width: 100%;
        height: 300px;
      }
    }
  }

  .liquidation-graph {
    .amount {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.3px;
      color: ${({ theme }) => theme.textColor};

      .denom {
        font-size: 18px;
      }
    }

    .tab {
      margin-top: 64px;
    }
  }

  // ---------------------------------------------
  // layout
  // ---------------------------------------------
  .liquidation-stats,
  .my-bids {
    h2 {
      margin-bottom: 15px;
    }
  }

  .place-bid {
    h2 {
      margin-bottom: 10px;
    }
  }

  .liquidation-graph {
    h2 {
      margin-bottom: 15px;
    }
  }

  // pc
  @media (min-width: ${screen.monitor.min}px) {
    .grid {
      display: grid;

      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: auto auto auto;
      grid-gap: 20px;

      .NeuSection-root {
        margin: 0;
      }

      .liquidation-graph {
        grid-column: 1/10;
        grid-row: 1 / 3;
      }

      .place-bid {
        grid-column: 10/13;
        grid-row: 1/3;
      }

      .liquidation-stats {
        grid-column: 1/6;
        grid-row: 3/4;
      }
      .my-bids {
        grid-column: 6/13;
        grid-row: 3/4;
      }
    }

    .place-bid {
      .NeuSection-content {
        padding: 60px 40px;
      }
    }
  }

  // under pc
  @media (max-width: ${screen.pc.max}px) {
    .grid > * {
      margin: 20px 0px;
    }
    .place-bid {
      .apy {
        figure {
          height: 180px;
        }
      }
    }

    .liquidation-graph {
      height: unset;
    }
  }

  // mobile
  @media (max-width: ${screen.mobile.max}px) {
    .decimal-point {
      display: none;
    }

    .liquidation-stats,
    .my-bids {
      h2 {
        margin-bottom: 10px;
      }

      .amount {
        font-size: 40px;
      }
    }

    .place-bid {
      .apy {
        figure {
          height: 150px;
        }
      }
    }

    .liquidation-graph {
      h2 {
        margin-bottom: 10px;
      }

      .amount {
        font-size: 40px;
      }

      .tab {
        margin-top: 30px;
      }
    }
  }
`;

export const History = fixHMR(StyledComponent);
