import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Icons({
      compiler: "vue3",
      autoInstall: true,
      scale: 1.2,
      defaultStyle: "", // Style applied to icons
      defaultClass: "", // Class names applied to icons
    }),
  ],
});
