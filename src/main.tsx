import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { MotionProvider } from './lib/motion';
import { AuthProvider } from './lib/auth';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import { initNative } from './lib/native';
import './index.css';
import './styles/ui.css';

initNative();

// Web, Android and the Electron desktop app are all served over http(s) and use
// clean BrowserRouter URLs (Electron now runs a loopback http server so Firebase
// auth works). A raw file:// load — e.g. opening dist/index.html directly —
// can't resolve History-API routes, so fall back to HashRouter there.
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <MotionProvider>
        <ThemeProvider>
          <Router>
            <App />
          </Router>
        </ThemeProvider>
      </MotionProvider>
    </AuthProvider>
  </ErrorBoundary>,
);
