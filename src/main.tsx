import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/auth.store';
import { db } from '@/api/mock/db';
import { startMockEngine } from '@/api/mock/engine';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5000, retry: 1, refetchOnWindowFocus: false } },
});

if (env.USE_MOCKS) {
  // Restaura la sesión simulada tras recargar y arranca el "servidor" en memoria.
  db.me = useAuthStore.getState().user;
  startMockEngine();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
