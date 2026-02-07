import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { GlobalStyles, theme } from './styles/GlobalStyles';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Documents from './pages/Documents';
import Shifts from './pages/Shifts';
import Stores from './pages/Stores';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Suppliers from './pages/Suppliers';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <BrowserRouter>
          <Routes>
            {/* Auth routes - redirect to main */}
            <Route path="/pos/login" element={<Navigate to="/pos" replace />} />
            <Route path="/auth/login" element={<Navigate to="/pos" replace />} />
            
            {/* Main app routes */}
            <Route path="/pos" element={<Dashboard />} />
            <Route path="/pos/cashier" element={<POS />} />
            <Route path="/pos/products" element={<Products />} />
            <Route path="/pos/customers" element={<Customers />} />
            <Route path="/pos/documents" element={<Documents />} />
            <Route path="/pos/movements" element={<Documents />} />
            <Route path="/pos/money" element={<Accounts />} />
            <Route path="/pos/shifts" element={<Shifts />} />
            <Route path="/pos/stores" element={<Stores />} />
            <Route path="/pos/accounts" element={<Accounts />} />
            <Route path="/pos/suppliers" element={<Suppliers />} />
            <Route path="/pos/reports" element={<Reports />} />
            <Route path="/pos/settings" element={<Settings />} />
            <Route path="/pos/company" element={<Settings />} />
            <Route path="/pos/employees" element={<Settings />} />
            <Route path="/pos/loyalty" element={<Settings />} />
            <Route path="/pos/print-forms" element={<Settings />} />
            <Route path="/pos/online-store" element={<Settings />} />
            <Route path="/pos/store-online" element={<Settings />} />
            <Route path="/pos/integrations" element={<Settings />} />
            <Route path="/pos/billing" element={<Settings />} />
            <Route path="/pos/cart" element={<Settings />} />
            <Route path="/pos/whats-new" element={<Settings />} />
            <Route path="/pos/knowledge-base" element={<Settings />} />
            <Route path="/pos/registers" element={<Shifts />} />
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#27ae60',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#e74c3c',
                secondary: '#fff',
              },
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
