import React, { useEffect, useState } from 'react';
import litLogo from './assets/lit.png';
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

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      setWebApp(window.Telegram.WebApp);
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleClick = () => {
    webApp?.showPopup({
      title: 'Hello',
      message: 'This is a Telegram Mini App Popup!',
      buttons: [
        {text: 'Close', type: 'close'},
      ]
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={litLogo} className="App-logo" alt="logo" />
        <h1>Telegram Mini App</h1>
        <button onClick={handleClick} className="popup-button">
          Show Popup
        </button>
      </header>
    </div>
  );
}

export default App;