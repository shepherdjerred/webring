// sum.test.js
import { expect, test } from "vitest";
import type { Configuration } from "./types.js";
import { run } from "./index.js";

test("it should work", async () => {
  const config: Configuration = {
    sources: [
      {
        title: "Jerred Shepherd",
        url: "https://sjer.red/rss.xml",
      },
    ],
    number: 1,
    cache_duration_minutes: 0,
    truncate: 300,
    cache_file: "cache.json",
  };

  const result = await run(config);
  expect(result).toMatchSnapshot();
});
