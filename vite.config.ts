import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);

export default defineConfig({
  base: repositoryName ? `/${repositoryName}/` : "/"
});
