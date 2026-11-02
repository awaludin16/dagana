import { createBrowserRouter, type RouteObject } from 'react-router'

import { AnonymousOnly, RequireSession } from '@/components/route-guards'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { OnboardingPage } from '@/pages/onboarding/onboarding-page'
import { BusinessPage } from '@/pages/workspace/business-page'
import { HomePage } from '@/pages/workspace/home-page'
import { MembersPage } from '@/pages/workspace/members-page'
import { NotFoundPage } from '@/pages/workspace/not-found-page'
import { ProfilePage } from '@/pages/workspace/profile-page'

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
          { path: 'members', element: <MembersPage /> },
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
