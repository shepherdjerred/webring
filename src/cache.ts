import * as R from "remeda";
import type { Configuration, Cache, Result, ResultEntry, CacheEntry, Source } from "./types.js";

export async function runWithCache(config: Configuration, cache: Cache): Promise<[Result, Cache]> {
  const promises = R.pipe(
    config.sources,
    R.map((source) => fetchWithCache(source, cache, config)),
    R.filter((result) => result !== undefined),
  );
  const results = await Promise.all(promises);

  const definedResults = results.filter((result) => result !== undefined) as ResultEntry[];

  const updatedCache: Cache = R.pipe(
    definedResults,
    R.map((result): [string, CacheEntry] => [result.source.url, { timestamp: new Date(), data: result }]),
    R.fromEntries(),
  );

  const topResults = R.pipe(
    definedResults,
    R.sortBy((result) => result.date.getTime()),
    R.reverse(),
    R.take(config.number),
  );

  return [topResults, updatedCache];
}

export async function fetchWithCache(
  source: Source,
  cache: Cache,
  config: Configuration,
): Promise<ResultEntry | undefined> {
  const cacheEntry = cache[source.url];
  if (cacheEntry) {
    const now = new Date();
    if (now.getTime() - cacheEntry.timestamp.getTime() < config.cache_duration_minutes * 60 * 1000) {
      console.log(`Cache entry found for ${source.url}`);
      return Promise.resolve(cacheEntry.data);
    } else {
      console.log(`Cache entry for ${source.url} is too old`);
    }
  }

  console.log(`No cache entry for ${source.url}`);
  return fetch(source, config.truncate);
}
