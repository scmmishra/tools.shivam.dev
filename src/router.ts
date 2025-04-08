import { createRouter, createWebHistory } from "vue-router";
import Hmac from "./pages/hmac.vue";
import Secrets from "./pages/secrets.vue";
import Index from "./pages/index.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Index },
    { path: "/hmac", component: Hmac },
    { path: "/secrets", component: Secrets },
  ],
});

export default router;
