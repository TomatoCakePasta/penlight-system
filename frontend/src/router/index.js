import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AudienceView from '@/views/AudienceView.vue'
import AdminView from '@/views/AdminView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // component: HomeView
      component: AudienceView
    },
    {
      path: "/live",
      name: "audience",
      component: AudienceView
    },
    {
      path: "/login",
      name: "login",
      component: LoginView
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  console.log(from, to);

  // 未認証で管理者ページにアクセスした場合はリダイレクト
  // TODO: ログイン管理用の変数で判定する,そうすればリロードも通せる
  if (from.name !== 'login' && to.name === 'admin') {
    next({ name: 'login' });
  }
  else {
    next();
  }
});

export default router
