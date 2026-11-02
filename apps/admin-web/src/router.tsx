import { createBrowserRouter, type RouteObject } from 'react-router'

import { AppLayout } from '@/layouts/app-layout'
import { AnonymousOnly, RequireSession } from '@/components/route-guards'
import { AuthLayout } from '@/layouts/auth-layout'
import { BusinessPage } from '@/pages/business-page'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OnboardingPage } from '@/pages/onboarding-page'
import { ProfilePage } from '@/pages/profile-page'
import { RegisterPage } from '@/pages/register-page'

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
          { path: 'business', element: <BusinessPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
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
