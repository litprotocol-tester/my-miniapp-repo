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
    async (telegramAppData: FullTelegramUser | null): Promise<{ isValid: boolean; isRecent: boolean }> => {
      console.log("🔄 Validating user Telegram info client side...");
      console.log("telegramAppData within verifyTelegramUser:", telegramAppData);
      
      if (!telegramAppData) {
        console.error("No Telegram app data available");
        return { isValid: false, isRecent: false };
      }

      const { user, auth_date, query_id } = telegramAppData;
      
      const encoder = new TextEncoder();

      const secretKeyHash = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(import.meta.env.VITE_TELEGRAM_BOT_TOKEN)
      );

      const dataCheckString = `auth_date=${auth_date}\nquery_id=${query_id}\n${JSON.stringify(user)}`;

      // Construct the dataCheckString using the sorted user entries

      
      async function sha256(message: any) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const attempt1 = `auth_date=${auth_date}\nquery_id=${query_id}\n${JSON.stringify(user)}`;
      console.log("Attempt 1:", attempt1);
      sha256(attempt1).then(hash => console.log("Hash 1:", hash));
      
      // Attempt 2: Sorted user object
      const sortedUser = Object.fromEntries(
        Object.entries(user).sort(([a], [b]) => a.localeCompare(b))
      );
      const attempt2 = `auth_date=${auth_date}\nquery_id=${query_id}\n${JSON.stringify(sortedUser)}`;
      console.log("Attempt 2:", attempt2);
      sha256(attempt2).then(hash => console.log("Hash 2:", hash));
      
      // Attempt 3: All fields sorted
      const allFields = { auth_date, query_id, ...user };
      const sortedFields = Object.fromEntries(
        Object.entries(allFields).sort(([a], [b]) => a.localeCompare(b))
      );
      const attempt3 = Object.entries(sortedFields).map(([k, v]) => `${k}=${v}`).join('\n');
      console.log("Attempt 3:", attempt3);
      sha256(attempt3).then(hash => console.log("Hash 3:", hash));
      
      // Attempt 4: URL-encoded parameters
      const urlEncodedParams = new URLSearchParams({ auth_date, query_id, ...user }).toString();
      const attempt4 = urlEncodedParams;
      console.log("Attempt 4:", attempt4);
      sha256(attempt4).then(hash => console.log("Hash 4:", hash));
      
      // Attempt 5: JSON stringified entire object
      const attempt5 = JSON.stringify({ auth_date, query_id, user });
      console.log("Attempt 5:", attempt5);
      sha256(attempt5).then(hash => console.log("Hash 5:", hash));
      
      // Attempt 6: Concatenated string without newlines
      const attempt6 = `auth_date=${auth_date}query_id=${query_id}${JSON.stringify(user)}`;
      console.log("Attempt 6:", attempt6);
      sha256(attempt6).then(hash => console.log("Hash 6:", hash));
      
      // Attempt 7: Only user object
      const attempt7 = JSON.stringify(user);
      console.log("Attempt 7:", attempt7);
      sha256(attempt7).then(hash => console.log("Hash 7:", hash));
      
      // Attempt 8: Concatenated key-value pairs
      const attempt8 = Object.entries({ auth_date, query_id, ...user })
        .map(([k, v]) => `${k}=${v}`).join('');
      console.log("Attempt 8:", attempt8);
      sha256(attempt8).then(hash => console.log("Hash 8:", hash));
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

      console.log("calculatedHash: ", calculatedHash);

      const isValid = calculatedHash === user.hash;
 
      const isRecent = Date.now() / 1000 - auth_date < 600;
      console.log("isRecent: ", Date.now() / 1000 - auth_date);

      console.log(
        `ℹ️ User Telegram data is valid: ${isValid}. User data is recent: ${isRecent}`
      );

      return { isValid, isRecent };
    },
    [import.meta.env.VITE_TELEGRAM_BOT_TOKEN]
  );

  useEffect(() => {
    if ((window as any).Telegram) {
      const telegramApp = (window as any).Telegram?.WebApp;
      const telegramAppData = telegramApp.initDataUnsafe;
      console.log("telegramAppData: ", telegramAppData)
      setTelegramAppData(telegramAppData);
      setWebApp(telegramApp);
      telegramApp.expand();

      // Verify the user
      verifyTelegramUser(telegramAppData).then(({ isValid, isRecent }) => {
        setIsUserVerified(isValid && isRecent);
      });
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