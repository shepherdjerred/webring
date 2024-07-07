import { expect, test } from "vitest";
import type { Configuration } from "./types.js";
import { run } from "./index.js";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";
import { join } from "path";

// TODO: intercept network requests
test("it should fetch an RSS feed without caching", { timeout: 30000 }, async () => {
  const config: Configuration = {
    sources: [
      {
        title: "Jerred Shepherd",
        url: "https://sjer.red/rss.xml",
      },
    ],
    number: 1,
    truncate: 300,
  };

  const result = await run(config);
  expect(result).toMatchSnapshot();
});

test("it should fetch several RSS feeds", { timeout: 30000 }, async () => {
  const config: Configuration = {
    sources: [
      {
        url: "https://drewdevault.com/blog/index.xml",
        title: "Drew DeVault",
      },
      {
        url: "https://danluu.com/atom.xml",
        title: "Dan Luu",
      },
    ],
    number: 3,
    truncate: 300,
  };

  const result = await run(config);
  expect(result).toMatchSnapshot();
});

test("it should fetch an RSS feed with caching", { timeout: 30000 }, async () => {
  const config: Configuration = {
    sources: [
      {
        title: "Jerred Shepherd",
        url: "https://sjer.red/rss.xml",
      },
    ],
    number: 1,
    truncate: 300,
    cache: {
      cache_file: `${await createTempDir()}/cache.json`,
      cache_duration_minutes: 1,
    },
  };

  const result = await run(config);
  expect(result).toMatchSnapshot();
});

// https://sdorra.dev/posts/2024-02-12-vitest-tmpdir
async function createTempDir() {
  const ostmpdir = tmpdir();
  const dir = join(ostmpdir, "unit-test-");
  return await mkdtemp(dir);
}
