import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
  }),
});

const cv = defineCollection({
  loader: file('./src/content/cv/data.json'),
  schema: z.object({
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      start: z.string(),
      end: z.string().nullable(),
      bullets: z.array(z.string()),
    })),
    education: z.array(z.object({
      degree: z.string(),
      school: z.string(),
      location: z.string(),
      year: z.string(),
    })),
    skills: z.record(z.array(z.string())),
  }),
});

export const collections = { blog, projects, cv };
