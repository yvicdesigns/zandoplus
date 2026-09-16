import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/capacitor';
import * as SentryReact from '@sentry/react';
import App from '@/App';
import '@/index.css';
// Dynamically import react-color-palette CSS only when needed
import('@/styles/react-color-palette.css').catch(e => console.error("Failed to load react-color-palette CSS", e));

// Capture erreurs web (zandopluscg.com) et natives (app iOS/Android). Sans
// DSN configuré (dev local), Sentry.init devient un no-op — pas besoin de
// condition manuelle.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init(
    {
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0, // erreurs uniquement, pas de tracing de performance
    },
    SentryReact.init
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <App />
);