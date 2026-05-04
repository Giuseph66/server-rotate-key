import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Keys from './pages/Keys';
import Playground from './pages/Playground';
import Docs from './pages/Docs';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Tenants from './pages/Tenants';
import Register from './pages/Register';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/keys" element={<Keys />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
