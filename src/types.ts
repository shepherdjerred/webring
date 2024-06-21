import { z } from "zod";

export type Source = z.infer<typeof SourceSchema>;
const SourceSchema = z.object({
  // the url of the feed
  url: z.string(),
  // a title for the feed
  title: z.string(),
});

export type CacheConfiguration = z.infer<typeof CacheConfigurationSchema>;
const CacheConfigurationSchema = z.object({
  // how long to cache a results for
  cache_duration_minutes: z.number().default(60),
  cache_file: z.string().default("cache.json"),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;
const ConfigurationSchema = z.object({
  // list of sources to fetch
  sources: SourceSchema.array(),
  // how many entries to return
  number: z.number().default(3),
  // how many words to truncate the preview to
  truncate: z.number().default(300),
  cache: CacheConfigurationSchema.optional(),
});

// CachedConfiguration is the same as Configuration but cache is not optional
export type CachedConfiguration = z.infer<typeof CachedConfigurationSchema>;
export const CachedConfigurationSchema = ConfigurationSchema.extend({
  cache: CacheConfigurationSchema,
});

export type ResultEntry = z.infer<typeof ResultEntrySchema>;
const ResultEntrySchema = z.object({
  title: z.string(),
  url: z.string(),
  date: z.coerce.date(),
  source: SourceSchema,
  preview: z.string().optional(),
});

export type Result = z.infer<typeof ResultSchema>;
const ResultSchema = z.array(ResultEntrySchema);

export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export const CacheEntrySchema = z.object({
  timestamp: z.coerce.date(),
  data: ResultEntrySchema,
});

export type Cache = z.infer<typeof CacheSchema>;
export const CacheSchema = z.record(CacheEntrySchema);

export const FeedEntrySchema = z
  .object({
    title: z.string(),
    link: z.string(),
    isoDate: z.coerce.date().optional(),
    pubDate: z.coerce.date().optional(),
    content: z.string().optional(),
    contentSnippet: z.string().optional(),
    "content:encoded": z.string().optional(),
    description: z.string().optional(),
  })
  .transform((entry) => {
    const date = entry.isoDate ?? entry.pubDate;
    if (!date) {
      throw new Error("no date found in feed entry");
    }
    return {
      title: entry.title,
      link: entry.link,
      date,
      content: entry.content,
      contentSnippet: entry.contentSnippet,
      description: entry.description,
      "content:encoded": entry["content:encoded"],
    };
  });
