# webring

[![webring](https://img.shields.io/npm/v/webring.svg)](https://www.npmjs.com/package/webring)

`webring` fetches the latest updates from your favorite RSS feeds. For example, you might use this on your blog to show posts from the blogs that you read.

Inspired by:

- https://github.com/lukehsiao/openring-rs
- https://git.sr.ht/~sircmpwn/openring

## Installation

```bash
npm i webring
```

## Quick Start

This library is intended to be used with a static site generator. I use this with [Astro](https://astro.build/) on my [personal website](https://github.com/shepherdjerred/sjer.red/blob/1220ebef2e43956ba385402ed8529870e9084de8/src/components/BlogWebring.astro#L17-L22).

```typescript
import { run } from "webring";
import { type Configuration, type Result } from "webring";

export const config: Configuration = {
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
  ],
  // the output will return the three most recent posts from the above sources
  number: 3,
  // the output will return santized HTML truncated to 300 characters
  truncate: 300,
  // if this is defined, we'll cache the results
  cache: {
    // the file to use as a cache
    cache_file: "webring.json",
    // how long the cache should remain valid for
    cache_duration_minutes: 60,
  },
};

// type Result = {
//   title: string,
//   url: string,
//   date: Date,
//   source: {
//     url: string,
//     title: string,
//   },
//   // this will be undefined if the RSS feed is empty
//   preview?: string
// }[]
export const result: Result = await run(config);

result.map((entry) => {
  // do something with the results
  // for example, you might render each item as an HTML block
});
```

Here's what I do for my blog:

1. Run `map` against the resulting array ([code](https://github.com/shepherdjerred/sjer.red/blob/f72b2b75bf0722ba8ff0fdd45f31c02c2ee5089d/src/components/BlogWebring.astro#L17-L22)).
1. Render a component for each entry ([code](https://github.com/shepherdjerred/sjer.red/blob/f72b2b75bf0722ba8ff0fdd45f31c02c2ee5089d/src/components/WebringEntry.astro)).
