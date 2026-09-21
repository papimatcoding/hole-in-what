import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);

export default defineConfig({
  // Local feature testing cannot submit runs/surveys to the public beta backend.
  // Production builds served by Pages are unaffected.
  server:{headers:{"Content-Security-Policy":"connect-src 'self' ws:;"}},
  base: repositoryName ? `/${repositoryName}/` : "/"
});
