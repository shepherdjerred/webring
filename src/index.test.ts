import { expect, test } from "vitest";
import type { Configuration } from "./types.js";
import { run } from "./index.js";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";
import { join } from "path";

// TODO: intercept network requests
test("it should fetch an RSS feed without caching", async () => {
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

test("it should fetch several RSS feeds", async () => {
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
      {
        url: "https://jakelazaroff.com/rss.xml",
        title: "Jake Lazaroff",
      },
      {
        url: "https://awesomekling.github.io/feed.xml",
        title: "Andreas Kling",
      },
      {
        url: "https://xeiaso.net/blog.rss",
        title: "Xe Iaso",
      },
      {
        url: "https://ciechanow.ski/atom.xml",
        title: "Bartosz Ciechanowski",
      },
      {
        url: "https://explained-from-first-principles.com/feed.xml",
        title: "Explained From First Principles",
      },
      {
        url: "http://www.aaronsw.com/2002/feeds/pgessays.rss",
        title: "Paul Graham",
      },
      {
        url: "https://samwho.dev/rss.xml",
        title: "Sam Rose",
      },
      {
        url: "https://rachelbythebay.com/w/atom.xml",
        title: "Rachel Kroll",
      },
      {
        url: "https://brr.fyi/feed.xml",
        title: "brr.fyi",
      },
      {
        url: "https://devblogs.microsoft.com/oldnewthing/feed",
        title: "The Old New Thing",
      },
      {
        url: "https://ludic.mataroa.blog/rss/",
        title: "Ludicity",
      },
    ],
    number: 20,
    truncate: 300,
  };

  const result = await run(config);
  expect(result).toMatchSnapshot();
});

test("it should fetch an RSS feed with caching", async () => {
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
