import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { OrdersPage } from '@/features/orders/pages/OrdersPage'
import { CashPage } from '@/features/cash/pages/CashPage'
import { PosPage } from '@/features/pos/pages/PosPage'
import { OutletsPage } from '@/features/outlets/pages/OutletsPage'
import { RootLayout } from '@/components/layout/RootLayout'
import { NotFoundPage } from '@/features/system/pages/NotFoundPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { OnboardingPage } from '@/features/business/pages/OnboardingPage'
import { MembersPage } from '@/features/members/pages/MembersPage'
import { AcceptInvitationPage } from '@/features/members/pages/AcceptInvitationPage'
import { RequirePermission } from '@/components/layout/RequirePermission'
import { ProtectedRoute } from './protected-route'
import { BusinessRequiredRoute } from './business-required-route'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/accept-invitation', element: <AcceptInvitationPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'onboarding',
        element: <OnboardingPage />,
      },
      {
        element: <BusinessRequiredRoute />,
        children: [
          {
            element: <RootLayout />,
            errorElement: <NotFoundPage />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'pos', element: <PosPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'products', element: <ProductsPage /> },
              { path: 'cash', element: <CashPage /> },
              {
                path: 'outlets',
                element: (
                  <RequirePermission permission="outlets.read">
                    <OutletsPage />
                  </RequirePermission>
                ),
              },
              {
                path: 'members',
                element: (
                  <RequirePermission permission="members.read">
                    <MembersPage />
                  </RequirePermission>
                ),
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])
