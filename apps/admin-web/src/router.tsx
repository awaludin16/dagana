import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { AnonymousOnly, RequirePermission, RequireSession } from '@/components/RouteGuards'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { DashboardPage } from '@/pages/workspace/DashboardPage'
import { CatalogPage } from '@/pages/workspace/CatalogPage'
import { MembersPage } from '@/pages/workspace/MembersPage'
import { NotFoundPage } from '@/pages/workspace/NotFoundPage'
import { OrderReceiptPage } from '@/pages/workspace/OrderReceiptPage'
import { OrdersPage } from '@/pages/workspace/OrdersPage'
import { OutletsPage } from '@/pages/workspace/OutletsPage'
import { CashPage } from '@/pages/workspace/CashPage'
import { ProfilePage } from '@/pages/workspace/ProfilePage'
import { ReportsPage } from '@/pages/workspace/ReportsPage'
import { PosPage } from '@/pages/workspace/pos/PosPage'

export const routes: RouteObject[] = [
  // Landing page publik; pengguna terautentikasi tetap bisa melihatnya dan
  // lanjut lewat tombol "Buka aplikasi".
  { path: '/', element: <LandingPage /> },
  {
    path: '/',
    element: <RequireSession />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'onboarding', element: <OnboardingPage /> },
          { path: 'catalog', element: <CatalogPage /> },
          {
            path: 'orders',
            element: (
              <RequirePermission permission="orders.read">
                <OrdersPage />
              </RequirePermission>
            ),
          },
          {
            path: 'orders/:orderId',
            element: (
              <RequirePermission permission="orders.read">
                <OrderReceiptPage />
              </RequirePermission>
            ),
          },
          {
            path: 'cash',
            element: (
              <RequirePermission permission="cash.read">
                <CashPage />
              </RequirePermission>
            ),
          },
          {
            path: 'reports',
            element: (
              <RequirePermission permission="reports.read">
                <ReportsPage />
              </RequirePermission>
            ),
          },
          {
            path: 'outlets',
            element: (
              <RequirePermission permission="outlets.read">
                <OutletsPage />
              </RequirePermission>
            ),
          },
          { path: 'business', element: <Navigate to="/outlets" replace /> },
          {
            path: 'members',
            element: (
              <RequirePermission permission="members.read">
                <MembersPage />
              </RequirePermission>
            ),
          },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      {
        path: 'pos',
        element: (
          <RequirePermission permission="orders.create">
            <PosPage />
          </RequirePermission>
        ),
      },
    ],
  },
  {
    element: <AnonymousOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  // Halaman tujuan tautan verifikasi email; diakses dengan atau tanpa sesi.
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
