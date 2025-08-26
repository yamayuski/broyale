import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";

export default defineConfig({
  plugins: [
    deno(),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    headers: {
      "referrer-policy": "no-referrer",
      "cross-origin-embedder-policy": "require-corp",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-resource-policy": "same-origin",
      "origin-agent-cluster": "?1",
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "x-content-type-options": "nosniff",
      "x-dns-prefetch-control": "off",
      "x-download-options": "noopen",
      "x-frame-options": "DENY",
      "x-permitted-cross-domain-policies": "none",
      "x-xss-protection": "0",
    },
  },
});
