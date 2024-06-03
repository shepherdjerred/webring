# webring

[![webring](https://img.shields.io/npm/v/webring.svg)](https://www.npmjs.com/package/webring)

`webring` gathers the latest posts from your favorite RSS feeds so that you can embed them on your site.

Inspired by:

- https://github.com/lukehsiao/openring-rs
- https://git.sr.ht/~sircmpwn/openring

## Installation

```bash
npm i webring
```

## Quick Start

This library is meant to be used with static site generators. It is framework agnostic.

```typescript
import { type Configuration, run } from "webring";

// create a configuration object
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
  ],
  number: 3,
  cache_duration_minutes: 60,
  truncate: 300,
};

// run the application
const result = await run(config);

// do something with the results
result.map((entry) => {
  console.log(entry);
});
```

I use this with Astro on my [personal website](https://github.com/shepherdjerred/sjer.red/blob/main/src/components/BlogWebring.astro#L17-L22).
