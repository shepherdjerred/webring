import Parser from "rss-parser";
import sanitizeHtml from "sanitize-html";
import truncate from "truncate-html";
import { type Source, type ResultEntry, FeedEntrySchema, type Configuration } from "./types.js";
import * as R from "remeda";
import { asyncMapFilterUndefined } from "./util.js";

// for some reason, TypeScript does not infer the type of the default export correctly
const truncateFn: typeof truncate.default = truncate as unknown as typeof truncate.default;

export async function fetchAll(config: Configuration) {
  return await asyncMapFilterUndefined(config.sources, (source) => fetch(source, config.truncate));
}

export async function fetch(source: Source, length: number): Promise<ResultEntry | undefined> {
  const parser = new Parser();

  try {
    const feed = await parser.parseURL(source.url);

    const firstItem = R.pipe(
      feed.items,
      R.map((item) => FeedEntrySchema.parse(item)),
      R.sortBy((item) => new Date(item.date).getTime()),
      R.reverse(),
      R.first(),
    );

    if (!firstItem) {
      throw new Error("no items found in feed");
    }

    const preview =
      firstItem.contentSnippet ?? firstItem.content ?? firstItem.description ?? firstItem["content:encoded"];

    return {
      title: firstItem.title,
      url: firstItem.link,
      date: new Date(firstItem.date),
      source,
      preview: preview
        ? truncateFn(
            sanitizeHtml(preview, {
              parseStyleAttributes: false,
            }),
            length,
          )
        : undefined,
    };
  } catch (e) {
    console.error(`Error fetching ${source.url}: ${e as string}`);
    return undefined;
  }
}
