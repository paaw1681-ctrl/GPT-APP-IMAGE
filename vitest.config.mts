import { defineConfig } from "vitest/config";
import path from "node:path";

const dirname = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(dirname, "src/types/server-only-stub.ts"),
      "@": path.resolve(dirname, "src"),
    },
  },
});
