import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 告訴 Vue 這是自訂元素，不要解析成 Vue component
          isCustomElement: (tag) => tag === "lottie-player",
        },
      },
    }),
    tailwindcss(),
  ],
});
