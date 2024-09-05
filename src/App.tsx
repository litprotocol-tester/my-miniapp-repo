import { useEffect, useState } from 'react';
import litLogo from './assets/lit.png';
import { connectToLitContracts } from './litConnections';
//import * as ethers from 'ethers';
//import { LitContracts } from '@lit-protocol/contracts-sdk';
//import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { useSDK } from '@metamask/sdk-react';
import './App.css';

// Define the WebApp interface
interface WebApp {
  ready: () => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons: Array<{text: string; type: string}>;
  }) => void;
}

// Extend the Window interface
declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

function App() {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  //const [litContracts, setLitContracts] = useState<LitContracts | null>(null);
  const [pkp, setPkp] = useState<{
    tokenId: any
    publicKey: string
    ethAddress: string
  } | null>(null);
  const { sdk, connected, /*connecting, provider, chainId */ } = useSDK();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      setWebApp(window.Telegram.WebApp);
      window.Telegram.WebApp.ready();
    }
  }, []);

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);

      if (accounts?.[0] && webApp) {
        webApp.showPopup({
          title: 'Connected',
          message: `Connected to MetaMask with account: ${accounts[0]}`,
          buttons: [
            {text: 'Close', type: 'close'},
          ]
        });

      }
    } catch (err) {
      console.warn("failed to connect..", err);
      
      if (webApp) {
        webApp.showPopup({
          title: 'Error',
          message: 'Failed to connect to MetaMask',
          buttons: [
            {text: 'Close', type: 'close'},
          ]
        });
      }
    }
  };

  const mintPkp = async() => {
    try {
      const litContracts = await connectToLitContracts();
      //setLitContracts(litContracts);
      const pkp = (await litContracts.pkpNftContractUtils.write.mint()).pkp;
      setPkp(pkp);
    }
    catch (err) {
      console.warn("failed to mint PKP..", err);
    }
  }

  return (
    <div className="App">
        <header className="App-header">
        <img src={litLogo} className="App-logo" alt="logo" />
        <h1>Telegram Mini App</h1>
        </header>
      <button style={{ padding: 10, margin: 10 }} onClick={connect}>
        Connect
      </button>
      {connected && (
        <div>
          <>
            {account && `Connected account: ${account}`}
          </>
        </div>
      )}
      {connected && (
        <button style={{ padding: 10, margin: 10 }} onClick={mintPkp}>
          Mint PKP
        </button>
      )}
      {pkp && (
        <div> PKP: {`${pkp}`} </div>
      )}
    </div>
  );
};

export default App;