import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth pages
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// App pages
import Dashboard     from './pages/Dashboard';
import Products      from './pages/Products';
import Receipts      from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Deliveries    from './pages/Deliveries';
import DeliveryDetail from './pages/DeliveryDetail';
import Transfers     from './pages/Transfers';
import TransferDetail from './pages/TransferDetail';
import Adjustments   from './pages/Adjustments';
import Warehouses     from './pages/Warehouses';
import Ledger        from './pages/Ledger';

// Guard
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected */}
        <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products"       element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/receipts"       element={<PrivateRoute><Receipts /></PrivateRoute>} />
        <Route path="/receipts/:id"   element={<PrivateRoute><ReceiptDetail /></PrivateRoute>} />
        <Route path="/deliveries"     element={<PrivateRoute><Deliveries /></PrivateRoute>} />
        <Route path="/deliveries/:id" element={<PrivateRoute><DeliveryDetail /></PrivateRoute>} />
        <Route path="/transfers"      element={<PrivateRoute><Transfers /></PrivateRoute>} />
        <Route path="/transfers/:id"  element={<PrivateRoute><TransferDetail /></PrivateRoute>} />
        <Route path="/adjustments"   element={<PrivateRoute><Adjustments /></PrivateRoute>} />
        <Route path="/warehouses"     element={<PrivateRoute><Warehouses /></PrivateRoute>} />
        <Route path="/ledger"         element={<PrivateRoute><Ledger /></PrivateRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
