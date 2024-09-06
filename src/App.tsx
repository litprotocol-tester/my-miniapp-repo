import { useEffect, useState, useCallback } from "react";
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
  initDataUnsafe: {
    user?: any;
    query_id?: string;
    auth_date?: number;
  };
}

interface FullTelegramUser {
  query_id: string;
  auth_date: number;
  user: any;
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
  const [telegramAppData, setTelegramAppData] = useState<FullTelegramUser | null>(null);
  const [pkp, setPkp] = useState<{
    tokenId: any
    publicKey: string
    ethAddress: string
  } | null>(null);
  const [sessionSignatures, setSessionSignatures] = useState<any | null>(null);
  const [isUserVerified, setIsUserVerified] = useState<boolean | null>(null);
  const { sdk, connected, provider } = useSDK();

  const verifyTelegramUser = useCallback(
    async (initDataUnsafe: any): Promise<boolean> => {
      const verifyDataIntegrity = async (initDataUnsafe: any, hash: string): Promise<boolean> => {
        const dataCheckString = Object.entries(initDataUnsafe)
          .filter(([key]) => key !== 'hash') // Exclude the hash from the check
          .sort()
          .map(([k, v]) => {
            if (typeof v === "object" && v !== null) {
              v = JSON.stringify(v);
            }
            return `${k}=${v}`;
          })
          .join("\n");
  
        const encoder = new TextEncoder();
        const apiToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  
        const secretKeyHash = await crypto.subtle.digest(
          "SHA-256",
          encoder.encode("WebAppData" + apiToken)
        );
  
        const key = await crypto.subtle.importKey(
          "raw",
          secretKeyHash,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
  
        const signature = await crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(dataCheckString)
        );
  
        const calculatedHash = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
  
        return calculatedHash === hash;
      };
  
      const hash = initDataUnsafe.hash;
      delete initDataUnsafe.hash;
  
      return await verifyDataIntegrity(initDataUnsafe, hash);
    },
    [import.meta.env.VITE_TELEGRAM_BOT_TOKEN]
  );

  useEffect(() => {
    if ((window as any).Telegram) {
      const telegramApp = (window as any).Telegram?.WebApp;
      const telegramAppData = telegramApp.initDataUnsafe;
      console.log("telegramAppData: ", telegramAppData);
      setTelegramAppData(telegramAppData);
      setWebApp(telegramApp);
      telegramApp.expand();
  
      // Verify the user
      (async () => {
        try {
          const isVerified = await verifyTelegramUser(telegramAppData);
          setIsUserVerified(isVerified);
          console.log("User verification result:", isVerified);
        } catch (error) {
          console.error("Error verifying Telegram user:", error);
          setIsUserVerified(false);
        }
      })();
    }
  }, [verifyTelegramUser]);

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
      telegramAppData!.user
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
      {telegramAppData && (
        <div>
          <h2>Telegram User Data:</h2>
          <pre>{JSON.stringify(telegramAppData!.user, null, 2)}</pre>
          <p>User verification status: {isUserVerified === null ? "Pending" : isUserVerified ? "Verified" : "Not Verified"}</p>
        </div>
      )}
      <button
        style={{ padding: 10, margin: 10 }}
        onClick={connect}
      >
        {connected ? "Connected" : "Connect to MetaMask"}
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