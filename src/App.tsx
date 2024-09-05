import { useEffect, useState } from 'react';
import litLogo from './assets/lit.png';
//import { connectToLitNodes, connectToLitContracts } from './litConnections';
//import * as ethers from 'ethers';
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
  const { sdk, connected, /*connecting, provider,*/ chainId } = useSDK();

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

        // Your Lit protocol connections can go here
        // const litNodeClient = connectToLitNodes();
        // const litContracts = connectToLitContracts();
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
            {chainId && `Connected chain: ${chainId}`}
            <p></p>
            {account && `Connected account: ${account}`}
          </>
        </div>
      )}
    </div>
  );
};

export default App;