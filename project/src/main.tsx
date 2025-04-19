import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize default font settings if none exist
const initializeDefaultFontSettings = () => {
  if (!localStorage.getItem('fontSettings')) {
    localStorage.setItem('fontSettings', JSON.stringify({
      fontSize: 16,
      fontFamily: 'Arial'
    }));
    // Apply default font to document
    document.documentElement.style.fontSize = '16px';
    document.body.style.fontFamily = 'Arial';
  } else {
    // Apply saved font settings
    try {
      const savedSettings = JSON.parse(localStorage.getItem('fontSettings') || '{}');
      if (savedSettings.fontSize) {
        document.documentElement.style.fontSize = `${savedSettings.fontSize}px`;
      }
      if (savedSettings.fontFamily) {
        document.body.style.fontFamily = savedSettings.fontFamily;
      }
    } catch (e) {
      console.error('Error parsing font settings:', e);
    }
  }
};

// Initialize settings
initializeDefaultFontSettings();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);