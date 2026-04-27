import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // BASE_URL is '/' in dev and on most hosts, '/<repo-name>/' on GitHub Pages.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/calendar-view',
    },
    {
      path: '/calendar-view',
      name: 'calendar-view',
      component: () => import('./pages/CalendarViewPage.vue'),
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('./pages/SetupPage.vue'),
    },
    {
      path: '/setup/meetings/new',
      name: 'calendar-new',
      component: () => import('./pages/CalendarWizardPage.vue'),
      props: { mode: 'create' },
    },
    {
      path: '/setup/meetings/:id',
      name: 'calendar-edit',
      component: () => import('./pages/CalendarWizardPage.vue'),
      props: (route) => ({ mode: 'edit', calendarId: route.params.id }),
    },
    {
      path: '/ai-setup',
      name: 'ai-setup',
      component: () => import('./pages/AISetupAssistant.vue'),
    },
    {
      path: '/booker-preview',
      name: 'booker-preview',
      component: () => import('./pages/BookerPreviewPage.vue'),
    },
  ],
})

export default router
