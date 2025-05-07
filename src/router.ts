import { createRouter, createWebHistory } from "vue-router";
import Index from "./pages/index.vue";
import Decrypt from "./pages/decrypt.vue";

import { tools } from "./tools";

const toolPages = tools.map((tool) => ({
  path: `/${tool.slug}`,
  component: tool.component,
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Index },
    {
      path: "/decrypt/:payload?",
      component: Decrypt,
      meta: { standalone: true },
    },
    ...toolPages,
  ],
});

export default router;
