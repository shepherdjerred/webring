import * as R from "remeda";
import { fetchAllCached as fetchAllCached } from "./cache.js";
import { fetchAll as fetchAllUncached } from "./fetch.js";
import { type Configuration, type Result, CachedConfigurationSchema } from "./types.js";

export async function run(config: Configuration): Promise<Result> {
  const { success, data } = CachedConfigurationSchema.safeParse(config);

  let result: Result;
  if (success) {
    result = await fetchAllCached(data);
  } else {
    result = await fetchAllUncached(config);
  }

  const topResults = R.pipe(
    result,
    R.sortBy((result) => result.date.getTime()),
    R.reverse(),
    R.take(config.number),
  );

  return topResults;
}

export * from "./types.js";
