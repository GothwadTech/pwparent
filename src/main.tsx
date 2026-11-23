import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installServiceWorkerUpdates} from './lib/swUpdate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registered by hand (vite.config.ts no longer injects a bare registration), so
// a deploy reaches an already-installed app without waiting for a second launch.
installServiceWorkerUpdates();
