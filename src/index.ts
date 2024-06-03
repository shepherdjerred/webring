import { runWithCache } from "./cache.js";
import { type Configuration, type Result, type Cache, CacheSchema } from "./types.js";
import fs from "fs/promises";

export async function run(config: Configuration): Promise<Result> {
  const cacheFilename = config.cache_file;

  let cacheObject: Cache = {};

  try {
    const cacheFile = await fs.readFile(cacheFilename);
    cacheObject = CacheSchema.parse(JSON.parse(cacheFile.toString()));
  } catch (e) {
    console.error("Error reading cache file:", e);
    throw e;
  }

  const [result, updatedCache] = await runWithCache(config, cacheObject);

  // write the updated cache to cache.json
  await fs.writeFile(cacheFilename, JSON.stringify(updatedCache));

  return result;
}

export * from "./types.js";
export * from "./cache.js";
export * from "./fetch.js";
