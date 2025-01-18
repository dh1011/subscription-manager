// src/components/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    margin: 0;
    font-family: 'Poppins', sans-serif;
  }

  h1, h2, h3 {
    color: ${({ theme }) => theme.text};
  }

  /* Adjust font sizes */
  h1 {
    font-size: 2.5em;
    text-align: center;
  }

  h2 {
    font-size: 2em;
  }

  h3 {
    font-size: 1.5em;
  }
`;
