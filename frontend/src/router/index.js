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

  // console.log(document.cookie);

  // Cookie の値を取得
  const cookies = document.cookie
  .split('; ')
  .reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});

  let session;

  // JSON.parse を使ってオブジェクトに戻す
  if (cookies.session) {
    try {
      session = JSON.parse(cookies.session);
      console.log(session); // { userId: 123, token: "abc123" }
    } catch (e) {
      console.error('Invalid JSON in session cookie');
    }
  }

  // console.log("session:", session);

  // 未認証で管理者ページにアクセスした場合はリダイレクト
  if (to.name === 'admin' && session === undefined) {
    next({ name: 'login' });
  }
  else {
    next();
  }
});

export default router
