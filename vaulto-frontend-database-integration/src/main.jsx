import React from 'react';
import { createRoot } from 'react-dom/client';
import AnimatedBackground from './components/AnimatedBackground.jsx';
import App from './App.jsx';
import './styles.css';
import './theme.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnimatedBackground />
    <App />
  </React.StrictMode>,
);
