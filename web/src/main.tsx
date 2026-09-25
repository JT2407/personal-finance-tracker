import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useThemeStore, applyInitialTheme } from '@/store/themeStore';
import { App } from './App';
import './index.css';

// Apply the persisted theme BEFORE first paint to avoid a flash of the wrong
// theme (per the skills: prevent color flash on boot).
applyInitialTheme(useThemeStore.getState().theme);

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
