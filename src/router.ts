import { createRouter, createWebHistory } from "vue-router";
import Hmac from "./pages/hmac.vue";
import Secrets from "./pages/secrets.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/hmac", component: Hmac },
    { path: "/secrets", component: Secrets },
  ],
});

export default router;
