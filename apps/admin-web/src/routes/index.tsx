import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { OrdersPage } from '@/features/orders/pages/OrdersPage'
import { CashPage } from '@/features/cash/pages/CashPage'
import { MorePage } from '@/features/more/pages/MorePage'
import { RootLayout } from '@/components/layout/RootLayout'
import { NotFoundPage } from '@/features/system/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pos', element: <App /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'cash', element: <CashPage /> },
      { path: 'more', element: <MorePage /> },
    ],
  },
])
