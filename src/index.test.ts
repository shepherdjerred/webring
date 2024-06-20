import { expect, test } from "vitest";
import type { Configuration } from "./types.js";
import { fetchAll } from "./fetch.js";

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

  const result = await fetchAll(config);
  expect(result).toMatchSnapshot();
});
