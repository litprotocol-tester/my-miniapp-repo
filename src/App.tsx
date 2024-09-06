import { useEffect, useState } from "react";
import litLogo from "./assets/lit.png";
import { getSessionSignatures, connectToLitNodes, connectToLitContracts } from "./litConnections";
import { useSDK } from "@metamask/sdk-react";
import "./App.css";

interface TelegramWebApp {
  ready: () => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons: Array<{ text: string; type: string }>;
  }) => void;
  initData: {
    auth_date?: number;
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      auth_date: number;
      hash: string;
    };
  };
}


declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

function App() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [pkp, setPkp] = useState<{
    tokenId: any
    publicKey: string
    ethAddress: string
  } | null>(null);
  const [sessionSignatures, setSessionSignatures] = useState<any | null>(null);
  const [data, setData] = useState<any | null>(null);
  const { sdk, connected, /*connecting, */ provider /*chainId*/ } = useSDK();

  useEffect(() => {
    const tgApp = window.Telegram?.WebApp;
    if (tgApp) {
      tgApp.ready();
      setWebApp(tgApp);
      setData(tgApp.initData);
      console.log("initData:", tgApp.initData);
      verifyInitData(data, import.meta.env.VITE_TELEGRAM_BOT_TOKEN);
    }
  }, []);

  async function verifyInitData(telegramInitData: string, botToken: string): Promise<{ isVerified: boolean, urlParams: URLSearchParams }> {
    const urlParams: URLSearchParams = new URLSearchParams(telegramInitData);
  
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    urlParams.sort();
  
    let dataCheckString = '';
    for (const [key, value] of urlParams.entries()) {
      dataCheckString += `${key}=${value}\n`;
    }
    dataCheckString = dataCheckString.slice(0, -1);
  
    const encoder = new TextEncoder();
    const secretKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  
    const botTokenKey = await window.crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(botToken)
    );
  
    const calculatedHash = await window.crypto.subtle.sign(
      "HMAC",
      await window.crypto.subtle.importKey(
        "raw",
        botTokenKey,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      encoder.encode(dataCheckString)
    );
  
    const isVerified = hash === Array.from(new Uint8Array(calculatedHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  
    return { isVerified, urlParams };
  }
  const signInTelegram = () => {
    if (webApp && webApp.initData.user) {
      webApp.showPopup({
        title: "Signed In",
        message: `Welcome, ${webApp.initData.user.first_name}!`,
        buttons: [{ text: "Close", type: "close" }],
      });
    } else {
      console.error("WebApp or user data not available");
    }
  };

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
      if (account && webApp) {
        webApp.showPopup({
          title: "Connected",
          message: `Connected to MetaMask with account: ${accounts[0]}`,
          buttons: [{ text: "Close", type: "close" }],
        });
      }
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  const getSS = async () => {
    const litNodeClient = await connectToLitNodes();
    const sessionSignatures = await getSessionSignatures(
      litNodeClient,
      pkp,
      data.user,
    );
    setSessionSignatures(sessionSignatures);
  };

  const mintPkp = async () => {
    const pkp = await connectToLitContracts(provider);
    setPkp(pkp);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={litLogo} className="App-logo" alt="logo" />
        <h1>Telegram Mini App</h1>
      </header>
      <button
        style={{ padding: 10, margin: 10 }}
        onClick={signInTelegram}
      >
        Sign In with Telegram
      </button>
      {(
        <div>
          <h2>Telegram User Data:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      <button
        style={{ padding: 10, margin: 10 }}
        onClick={connect}
      >
        {connected ? "Connect to MetaMask" : "Connected"}
      </button>
      {connected && <div>{account && `Connected account: ${account}`}</div>}
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
      {connected && (
        <button style={{ padding: 10, margin: 10 }} onClick={mintPkp}>
          Mint PKP
        </button>
      )}
      {pkp && (
        <div>
          <h2>PKP:</h2>
          <pre>{JSON.stringify(pkp, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
export default App;
