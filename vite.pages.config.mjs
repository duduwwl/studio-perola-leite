import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  root:path.resolve("pages-client"),base:"/studio-perola-leite/",publicDir:false,
  plugins:[react()],define:{__GITHUB_PAGES__:"true"},
  resolve:{alias:[{find:"next/image",replacement:path.resolve("pages-client/image.tsx")},{find:"@",replacement:path.resolve(".")}]},
  css:{postcss:path.resolve(".")},
  build:{outDir:path.resolve("docs"),emptyOutDir:false,rollupOptions:{input:{booking:path.resolve("pages-client/agendar/index.html"),admin:path.resolve("pages-client/admin/index.html")}}}
});

