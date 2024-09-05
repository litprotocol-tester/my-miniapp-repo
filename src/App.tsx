import { useEffect, useState } from 'react';
import litLogo from './assets/lit.png';
import { getSessionSignatures, connectToLitNodes} from './litConnections';
import * as ethers from 'ethers';
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
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [sessionSignatures, setSessionSignatures] = useState<any | null>(null);
  const { sdk, connected, /*connecting, */ provider, /*chainId*/  } = useSDK();

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

      if (provider && account) {
        const ethersProvider = new ethers.providers.Web3Provider(provider as any);
        const newSigner = ethersProvider.getSigner(account);
        setSigner(newSigner);
      }

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

  const getSS= async () => {
    const litNodeClient = await connectToLitNodes();
    const sessionSignatures = await getSessionSignatures(litNodeClient, signer as ethers.Signer);
    setSessionSignatures(sessionSignatures)
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={litLogo} className="App-logo" alt="logo" />
        <h1>Telegram Mini App</h1>
      </header>
      <button style={{ padding: 10, margin: 10 }} onClick={connect} disabled={!provider}>
        {connected ? 'Connected' : 'Connect'}
      </button>
      {connected && (
        <div>
          {account && `Connected account: ${account}`}
        </div>
      )}
      {connected && (
        <button style={{ padding: 10, margin: 10 }} onClick={getSS}>
          Get Session Signatures
        </button>
      )}
      {sessionSignatures && (
        <div>
          <h2>Session Signatures:</h2>
          <pre>{JSON.stringify(sessionSignatures, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;