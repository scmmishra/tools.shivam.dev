import { createApp } from "vue";
import "@fontsource-variable/geist-mono";
import "./style.css";
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");
