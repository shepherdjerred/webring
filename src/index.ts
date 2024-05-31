import { runWithCache } from "./cache.js";
import { type Configuration, type Result, type Cache, CacheSchema } from "./types.js";
import fs from "fs/promises";

export async function run(config: Configuration): Promise<Result> {
  const cacheFilename = "cache.json";
  const currentDir = process.cwd();
  const fullFilename = `${currentDir}/${cacheFilename}`;

  let cacheObject: Cache = {};

  try {
    const cacheFile = await fs.readFile(fullFilename);
    cacheObject = CacheSchema.parse(JSON.parse(cacheFile.toString()));
  } catch (e) {
    console.error("Error reading cache file:", e);
    throw e;
  }

  const [result, updatedCache] = await runWithCache(config, cacheObject);

  // write the updated cache to cache.json
  await fs.writeFile(fullFilename, JSON.stringify(updatedCache));

  return result;
}
