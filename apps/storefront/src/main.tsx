import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { setAuthClient } from '@dosumart/api';
import { ROLES_BY_AUTH_CLIENT } from '@dosumart/constants';
import { AuthProvider } from '@dosumart/ui';
import type { Role } from '@dosumart/types';
import App from './App';
import './index.css';

setAuthClient('store');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider allowedRoles={ROLES_BY_AUTH_CLIENT.store as Role[]}>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
