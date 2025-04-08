import { createRouter, createWebHistory } from "vue-router";
import Hmac from "./pages/hmac.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/hmac", component: Hmac }],
});

export default router;
