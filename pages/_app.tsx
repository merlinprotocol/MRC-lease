import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { DAppProvider, Config, useLogs, useNotifications } from '@usedapp/core';
import { getDefaultProvider } from 'ethers';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '../styles/globals.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#635ee7',
    },
    secondary: {
      main: '#fff',
    },
  },
});

const network = process.env.NEXT_PUBLIC_NETWORK;
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const multicallAddresses = process.env.NEXT_PUBLIC_MULTICALL_ADDRESSES as string;

const config: Config = {
  readOnlyChainId: chainId,
  readOnlyUrls: {
    [chainId]: getDefaultProvider(network),
  },
  multicallAddresses: multicallAddresses
    ? {
        [chainId]: multicallAddresses,
      }
    : {},
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider theme={theme}>
        <DAppProvider config={config}>
          <Component {...pageProps} />
        </DAppProvider>
      </ThemeProvider>

      <div id="background-radial-gradient"></div>
    </>
  );
}
