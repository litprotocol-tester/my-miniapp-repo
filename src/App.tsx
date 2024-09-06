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
  initData: string;
  initDataUnsafe: any;
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
  const { sdk, connected, /*connecting, */provider /*chainId*/ } = useSDK();
  const [pkp, setPkp] = useState<{
    tokenId: any
    publicKey: string
    ethAddress: string
  } | null>(null);
  const [sessionSignatures, setSessionSignatures] = useState<any | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const tgApp = window.Telegram?.WebApp;
    if (tgApp) {
      tgApp.ready();
      setWebApp(tgApp);
      setData(tgApp.initData);

      verifyInitData(data, import.meta.env.VITE_TELEGRAM_BOT_TOKEN)
        .then(({ isVerified, urlParams }) => {
          console.log("verified:", isVerified);
          console.log("urlParams:", urlParams);
        })
        .catch(error => {
          console.error("Error verifying init data:", error);
        });
    }
  }, []);

 /* async function isRecent(telegramInitData: string){
    const urlParams: URLSearchParams = new URLSearchParams(telegramInitData);
    const userParams = urlParams.get('user');
    const userData = JSON.parse(decodeURIComponent(userParams!));
    const auth_date  = Number(userData.auth_date);
    const isRecent = Date.now() / 1000 - auth_date < 600;
    return isRecent;
  }*/

  async function verifyInitData(telegramInitData: string, botToken: string): Promise<{ isVerified: boolean, urlParams: URLSearchParams }> {
    const urlParams: URLSearchParams = new URLSearchParams(telegramInitData);
  
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    urlParams.sort();
    console.log("sorted after hash:", urlParams)

    /*
    const userParam = urlParams.get('user');
    const userData = JSON.parse(decodeURIComponent(userParam!));
    const id = userData.id;
    console.log("id:", id);
    */
  
    let dataCheckString = '';
    for (const [key, value] of urlParams.entries()) {
      dataCheckString += `${key}=${value}\n`;
    }
    dataCheckString = dataCheckString.slice(0, -1);
    console.log("dataCheckString:", dataCheckString);
  
    const encoder = new TextEncoder();
    const secretKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    console.log("secretKey:", secretKey);
  
    const botTokenKey = await window.crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(botToken)
    );
    console.log("botTokenKey:", botTokenKey);
  
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
    console.log("calculatedHash:", calculatedHash);
  
    const calculatedHashHex = Array.from(new Uint8Array(calculatedHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isVerified = hash === calculatedHashHex;
    return { isVerified, urlParams };
  }

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
        webApp!.showPopup({
          title: "Connected",
          message: `Connected to MetaMask with account: ${accounts[0]}`,
          buttons: [{ text: "Close", type: "close" }],
        });
      
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  const getSS = async () => {
    const litNodeClient = await connectToLitNodes();
    const sessionSignatures = await getSessionSignatures(
      litNodeClient,
      pkp,
      data,
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
