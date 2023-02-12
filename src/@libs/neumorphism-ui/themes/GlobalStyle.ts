import { NeumorphismTheme } from "./Theme";
import { createGlobalStyle, css } from "styled-components";

function bodyStyleIfThemeExists(theme?: NeumorphismTheme): string {
  if (!theme) return "";

  const styles = [];

  if (theme?.backgroundColor) {
    styles.push(`background-color: ${theme.backgroundColor};`);
  }

  if (theme?.textColor) {
    styles.push(`color: ${theme.textColor};`);
  }

  return `body { ${styles.join("")} }`;
}

export const globalStyle = css`
  html,
  body {
    margin: 0;
  }

  ${({ theme }) => bodyStyleIfThemeExists(theme)};

  html {
    font-family: "Gotham", BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
      "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
      sans-serif;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 16px;
    word-spacing: 1px;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    box-sizing: border-box;
  }

  html,
  body,
  #root,
  .App {
    background-color: ${({ theme }) => theme.backgroundColor} !important;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    font-family: "Gotham", BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
      "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
      sans-serif;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
  }

  *::-webkit-scrollbar {
    width: 0.4em;
    height: 0.3em;
    background-color: ${({ theme }) => theme.backgroundColor};
  }

  *::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0);
    border-radius: 10px;
    background-color: ${({ theme }) => theme.backgroundColor};
  }

  *::-webkit-scrollbar-track:hover {
    background-color: ${({ theme }) => theme.skeleton.backgroundColor};
  }

  *::-webkit-scrollbar-thumb {
    transition: background-color 0.5s ease;
    background-color: ${({ theme }) => theme.skeleton.backgroundColor};
    border-radius: 10px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.label.borderColor};
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

export const GlobalStyle = createGlobalStyle`
  ${globalStyle}
`;
