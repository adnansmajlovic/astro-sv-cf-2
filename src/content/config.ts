import { defineCollection, z } from "astro:content";

const authors = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    title: z.string().optional(),
    avatar: z.string().optional(), // e.g. "/avatars/jane.jpg"
    bio: z.string().optional(),
    links: z
      .object({
        website: z.string().url().optional(),
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
      })
      .partial()
      .optional(),
  }),
});

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    authorId: z.string(), // must match an authors/*.json id (filename)
    coverImage: z.string().optional(),
  }),
});

export const collections = { blog, authors };
