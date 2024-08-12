import { expect, test } from "vitest";
import type { Configuration } from "./types.js";
import { run } from "./index.js";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";
import { join } from "path";
import express from "express";

const app = express();
app.use(express.static("src/testdata"));

const port = Math.floor(Math.random() * 10000) + 3000;
app.listen(port, () => {
  console.log(`Test server listening at http://localhost:${port.toString()}`);
});

await new Promise((resolve) => setTimeout(resolve, 500));

function createUrl(path: string): string {
  return `http://localhost:${port.toString()}/${path}`;
}

function createSources(count: number): Configuration["sources"] {
  return Array.from({ length: count }, (_, i) => ({
    title: `rss ${i.toString()}`,
    url: createUrl(`rss-${i.toString()}.xml`),
  }));
}

test("it should fetch an RSS feed without caching", { timeout: 30000 }, async () => {
  const config: Configuration = {
    sources: createSources(19),
    number: 1,
    truncate: 300,
  };

  const result = await run(config);
  let string = JSON.stringify(result);
  // replace the port number with a fixed value
  string = string.replaceAll(port.toString(), "PORT");
  expect(string).toMatchSnapshot();
});

test("it should fetch several RSS feeds", { timeout: 30000 }, async () => {
  const config: Configuration = {
    sources: createSources(19),
    number: 3,
    truncate: 300,
  };

  const result = await run(config);
  let string = JSON.stringify(result);
  // replace the port number with a fixed value
  string = string.replaceAll(port.toString(), "PORT");
  expect(string).toMatchSnapshot();
});

test("it should fetch an RSS feed with caching", { timeout: 30000 }, async () => {
  const config: Configuration = {
    sources: createSources(19),
    number: 1,
    truncate: 300,
    cache: {
      cache_file: `${await createTempDir()}/cache.json`,
      cache_duration_minutes: 1,
    },
  };

  const result = await run(config);
  let string = JSON.stringify(result);
  // replace the port number with a fixed value
  string = string.replaceAll(port.toString(), "PORT");
  expect(string).toMatchSnapshot();
});

// https://sdorra.dev/posts/2024-02-12-vitest-tmpdir
async function createTempDir() {
  const ostmpdir = tmpdir();
  const dir = join(ostmpdir, "unit-test-");
  return await mkdtemp(dir);
}
