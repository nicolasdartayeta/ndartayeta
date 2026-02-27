import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { EMAIL_URL, GITHUB_URL, LINKEDIN_URL, WEBSITE_URL } from './consts';

const CONTACT_TOKENS: Record<string, string> = {
  '${EMAIL_URL}': EMAIL_URL,
  '${WEBSITE_URL}': WEBSITE_URL,
  '${LINKEDIN_URL}': LINKEDIN_URL,
  '${GITHUB_URL}': GITHUB_URL,
};

const resolveToken = (value: unknown) => {
  if (typeof value !== 'string') return value;
  return CONTACT_TOKENS[value] ?? value;
};

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
    tags: z.array(z.string()).default([]).optional(),
    github: z.string().url().optional(),
    demo: z.optional(z.string().url().optional()),
  }),
});

const resume = defineCollection({
  loader: file('./src/content/resume/data.json'),
  schema: z.object({
    summary: z.string(),
    location: z.string(),
    contact: z.object({
      email: z.preprocess(resolveToken, z.string()).optional(),
      website: z.preprocess(resolveToken, z.string()).optional(),
      linkedin: z.preprocess(resolveToken, z.string()).optional(),
      github: z.preprocess(resolveToken, z.string()).optional(),
    }).optional(),
    education: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      location: z.string(),
      dates: z.object({
        start: z.string(),
        end: z.string().optional(),
      }),
      description: z.string().optional(),
    })),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      start: z.string(),
      end: z.string().optional(),
      description: z.string().optional(),
      bullets: z.array(z.string()),
    })),
    courses: z.array(z.object({
      title: z.string(),
      institution: z.string(),
      location: z.string(),
      dates: z.object({
        start: z.string(),
        end: z.string().optional(),
      }),
      description: z.string().optional(),
    })).optional(),
    skills: z.array(z.object({
      category: z.string(),
      skills: z.array(z.string()),
    })).optional(),
  }),
});

export const collections = { blog, projects, resume };
