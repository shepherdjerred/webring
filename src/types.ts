import { z } from "zod";

export type Source = z.infer<typeof SourceSchema>;
const SourceSchema = z.object({
  url: z.string(),
  title: z.string(),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;
const ConfigurationSchema = z.object({
  sources: SourceSchema.array(),
  number: z.number(),
  cache_duration_minutes: z.number(),
  truncate: z.number(),
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
