import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
// Dynamically import react-color-palette CSS only when needed
import('@/styles/react-color-palette.css').catch(e => console.error("Failed to load react-color-palette CSS", e));


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <App />
);