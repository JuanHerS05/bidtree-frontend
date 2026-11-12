import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Spinner } from '@/components/ui';
import { ToastHost } from '@/components/ToastHost';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

const Auctions = lazy(() => import('@/pages/Auctions'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const LiveRoom = lazy(() => import('@/pages/LiveRoom'));
const Rewards = lazy(() => import('@/pages/Rewards'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner /></div>}>
      <Routes>
        <Route path="/login" element={<><Login /><ToastHost /></>} />
        <Route path="/register" element={<><Register /><ToastHost /></>} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auctions/:id/live" element={<LiveRoom />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/checkout/:orderId" element={<Checkout />} />
            <Route element={<RequireAuth role="SELLER" />}>
              <Route path="/dashboard/seller" element={<SellerDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/auctions" replace />} />
      </Routes>
    </Suspense>
  );
}
