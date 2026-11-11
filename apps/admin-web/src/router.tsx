import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { AnonymousOnly, RequirePermission, RequireSession } from '@/components/RouteGuards'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { HomePage } from '@/pages/workspace/HomePage'
import { CatalogPage } from '@/pages/workspace/CatalogPage'
import { MembersPage } from '@/pages/workspace/MembersPage'
import { NotFoundPage } from '@/pages/workspace/NotFoundPage'
import { OrderReceiptPage } from '@/pages/workspace/OrderReceiptPage'
import { OrdersPage } from '@/pages/workspace/OrdersPage'
import { OutletsPage } from '@/pages/workspace/OutletsPage'
import { CashPage } from '@/pages/workspace/CashPage'
import { InventoryPage } from '@/pages/workspace/InventoryPage'
import { ProfilePage } from '@/pages/workspace/ProfilePage'
import { PosPage } from '@/pages/workspace/pos/PosPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RequireSession />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
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
            path: 'inventory',
            element: (
              <RequirePermission permission="inventory.read">
                <InventoryPage />
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
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
