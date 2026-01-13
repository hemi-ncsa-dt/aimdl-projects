import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/proposals',
    },
    {
      path: '/proposals',
      name: 'proposals',
      component: () => import('../views/ProposalsView.vue'),
    },
    {
      path: '/proposal/new',
      name: 'create-proposal',
      component: () => import('../views/CreateProposalView.vue'),
    },
    {
      path: '/proposal/:id',
      name: 'proposal-detail',
      component: () => import('../views/ProposalDetailView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
  ],
});

export default router;
