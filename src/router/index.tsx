import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { EmailLoginPage } from '@/pages/auth/EmailLoginPage'
import { HomePage } from '@/pages/home/HomePage'
import { CompletedBooksPage } from '@/pages/mypage/CompletedBooksPage'
import { DeleteAccountPage } from '@/pages/mypage/DeleteAccountPage'
import { LegalPage } from '@/pages/mypage/LegalPage'
import { MyPage } from '@/pages/mypage/MyPage'
import { SettingsPage } from '@/pages/mypage/SettingsPage'
import { SubscriptionPage } from '@/pages/mypage/SubscriptionPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { NicknamePage } from '@/pages/onboarding/NicknamePage'
import { NotificationPage } from '@/pages/onboarding/NotificationPage'
import { ProjectCompletePage } from '@/pages/project/ProjectCompletePage'
import { ProjectModePage } from '@/pages/project/ProjectModePage'
import { ProjectSetupPage } from '@/pages/project/ProjectSetupPage'
import { ProjectTypePage } from '@/pages/project/ProjectTypePage'
import { RecordCompletePage } from '@/pages/record/RecordCompletePage'
import { RecordDetailPage } from '@/pages/record/RecordDetailPage'
import { RecordEditPage } from '@/pages/record/RecordEditPage'
import { RecordFreePage } from '@/pages/record/RecordFreePage'
import { RecordModePage } from '@/pages/record/RecordModePage'
import { RecordPhotoPage } from '@/pages/record/RecordPhotoPage'
import { RecordQuestionPage } from '@/pages/record/RecordQuestionPage'
import { RecordsListPage } from '@/pages/record/RecordsListPage'
import {
  BookCoverPage,
  BookPage,
  ChapterEditPage,
  ChapterPreviewPage,
  PublishCompletePage,
} from '@/pages/book'
import { ProjectsListPage } from '@/pages/placeholders'
import { SplashPage } from '@/pages/splash/SplashPage'
import { AuthGuard, GuestGuard, OnboardingGuard } from './guards'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/splash" replace /> },
      { path: '/splash', element: <SplashPage /> },

      {
        element: <GuestGuard />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/login/email', element: <EmailLoginPage /> },
        ],
      },

      {
        element: <AuthGuard />,
        children: [
          { path: '/onboarding/nickname', element: <NicknamePage /> },
          { path: '/onboarding/notification', element: <NotificationPage /> },

          { path: '/project/new', element: <ProjectTypePage /> },
          { path: '/project/new/setup', element: <ProjectSetupPage /> },
          { path: '/project/new/mode', element: <ProjectModePage /> },
          { path: '/project/new/complete', element: <ProjectCompletePage /> },

          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/projects', element: <ProjectsListPage /> },

          { path: '/record/mode', element: <RecordModePage /> },
          { path: '/record/write/question', element: <RecordQuestionPage /> },
          { path: '/record/write/photo', element: <RecordPhotoPage /> },
          { path: '/record/write/free', element: <RecordFreePage /> },
          { path: '/record/complete', element: <RecordCompletePage /> },

          { path: '/records/:id', element: <RecordDetailPage /> },
          { path: '/records/:id/edit', element: <RecordEditPage /> },

          { path: '/book/chapter/:id', element: <ChapterPreviewPage /> },
          { path: '/book/chapter/:id/edit', element: <ChapterEditPage /> },
          { path: '/book/cover', element: <BookCoverPage /> },
          { path: '/book/publish/complete', element: <PublishCompletePage /> },

          { path: '/mypage/settings', element: <SettingsPage /> },
          { path: '/mypage/subscription', element: <SubscriptionPage /> },
          { path: '/mypage/completed-books', element: <CompletedBooksPage /> },
          { path: '/mypage/delete-account', element: <DeleteAccountPage /> },
          {
            path: '/mypage/privacy-policy',
            element: (
              <LegalPage
                title="개인정보처리방침"
                url={import.meta.env.VITE_PRIVACY_POLICY_URL || '/legal/privacy.html'}
              />
            ),
          },
          {
            path: '/mypage/terms-of-service',
            element: (
              <LegalPage
                title="이용약관"
                url={import.meta.env.VITE_TERMS_URL || '/legal/terms.html'}
              />
            ),
          },

          {
            element: <OnboardingGuard />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { path: '/home', element: <HomePage /> },
                  { path: '/records', element: <RecordsListPage /> },
                  { path: '/book', element: <BookPage /> },
                  { path: '/mypage', element: <MyPage /> },
                ],
              },
            ],
          },
        ],
      },

      { path: '*', element: <Navigate to="/splash" replace /> },
    ],
  },
])
