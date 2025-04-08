import { createRouter, createWebHistory } from "vue-router";
import Hmac from "./pages/hmac.vue";
import Secrets from "./pages/secrets.vue";
import Color from "./pages/color.vue";
import Index from "./pages/index.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Index },
    { path: "/hmac", component: Hmac },
    { path: "/Color", component: Color },
    { path: "/secrets", component: Secrets },
  ],
});

export default router;
