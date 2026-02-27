import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { PDFDocument, StandardFonts, rgb, PDFArray, PDFName, PDFString, type PDFFont, type PDFPage } from 'pdf-lib';

export const prerender = true;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.05, 0.05, 0.05);
const SUBTLE = rgb(0.38, 0.38, 0.38);
const RULE = rgb(0.55, 0.55, 0.55);

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const GET: APIRoute = async () => {
  const entry = await getEntry('resume', 'main');
  if (!entry) return new Response('Resume not found', { status: 404 });

  const { summary, location, contact, education, experience, courses, skills } = entry.data;

  const pdf = await PDFDocument.create();
  const R = await pdf.embedFont(StandardFonts.TimesRoman);
  const B = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const I = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (h: number) => {
    if (y - h < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const addLink = (url: string, x: number, rectY: number, w: number, h: number) => {
    const annot = pdf.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [x, rectY, x + w, rectY + h],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    });
    const ref = pdf.context.register(annot);
    const existing = page.node.get(PDFName.of('Annots'));
    if (existing instanceof PDFArray) {
      existing.push(ref);
    } else {
      page.node.set(PDFName.of('Annots'), pdf.context.obj([ref]));
    }
  };

  // ── Primitives ────────────────────────────────────────────────────────

  const line = (text: string, font: PDFFont, size: number, x: number, color = INK, gap = 0) => {
    const lh = size * 1.3;
    ensureSpace(lh);
    page.drawText(text, { x, y, size, font, color });
    y -= lh + gap;
  };

  const centered = (text: string, font: PDFFont, size: number, gap = 2) => {
    const w = font.widthOfTextAtSize(text, size);
    line(text, font, size, (PAGE_WIDTH - w) / 2, INK, gap);
  };

  const wrapped = (text: string, font: PDFFont, size: number, indent = 0, gap = 4) => {
    const lh = size * 1.35;
    const lines = wrapText(text, font, size, CONTENT_WIDTH - indent);
    for (const l of lines) {
      ensureSpace(lh);
      page.drawText(l, { x: MARGIN + indent, y, size, font, color: INK });
      y -= lh;
    }
    y -= gap;
  };

  // Left text + right text on same baseline
  const twoCol = (
    left: string, lFont: PDFFont,
    right: string, rFont: PDFFont,
    size: number, gap = 2,
  ) => {
    const lh = size * 1.3;
    ensureSpace(lh);
    const rw = rFont.widthOfTextAtSize(right, size);
    page.drawText(left, { x: MARGIN, y, size, font: lFont, color: INK });
    page.drawText(right, { x: PAGE_WIDTH - MARGIN - rw, y, size, font: rFont, color: SUBTLE });
    y -= lh + gap;
  };

  const section = (title: string) => {
    y -= 8;
    ensureSpace(18);
    page.drawText(title.toUpperCase(), { x: MARGIN, y, size: 10.5, font: B, color: INK });
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.6,
      color: RULE,
    });
    y -= 15;
  };

  // ── Header ────────────────────────────────────────────────────────────

  centered('Nicolas Dartayeta', B, 24, 0);
  centered('Software Engineer', I, 12, 2);
  centered(location, R, 10, 4);

  const contactItems: Array<{ label: string; url: string; link?: boolean }> = [
    contact?.email    && { label: contact.email,   url: `mailto:${contact.email}` },
    contact?.website  && { label: 'Personal site', url: contact.website,  link: true },
    contact?.linkedin && { label: 'LinkedIn',       url: contact.linkedin, link: true },
    contact?.github   && { label: 'GitHub',         url: contact.github,   link: true },
  ].filter(Boolean) as Array<{ label: string; url: string; link?: boolean }>;

  if (contactItems.length) {
    const fs = 9;
    const sep = '   |   ';
    const sepW = R.widthOfTextAtSize(sep, fs);
    const itemWidths = contactItems.map(c => R.widthOfTextAtSize(c.label, fs));
    const totalW = itemWidths.reduce((a, b) => a + b, 0) + sepW * (contactItems.length - 1);
    const lh = fs * 1.3;
    const LINK_COLOR = rgb(0.15, 0.15, 0.55);

    ensureSpace(lh);
    let cx = (PAGE_WIDTH - totalW) / 2;

    for (let i = 0; i < contactItems.length; i++) {
      const item = contactItems[i];
      const iw = itemWidths[i];
      const color = item.link ? LINK_COLOR : INK;

      page.drawText(item.label, { x: cx, y, size: fs, font: R, color });

      if (item.link) {
        page.drawLine({
          start: { x: cx, y: y - 1 },
          end: { x: cx + iw, y: y - 1 },
          thickness: 0.4,
          color: LINK_COLOR,
        });
        addLink(item.url, cx, y - 2, iw, fs + 4);
      }

      cx += iw;
      if (i < contactItems.length - 1) {
        page.drawText(sep, { x: cx, y, size: fs, font: R, color: INK });
        cx += sepW;
      }
    }

    y -= lh + 12;
  }

  // ── Summary ───────────────────────────────────────────────────────────

  section('Summary');
  wrapped(summary, R, 11, 0, 0);

  // ── Experience ────────────────────────────────────────────────────────

  section('Experience');
  for (const job of experience) {
    const dateStr = job.end ? `${job.start} – ${job.end}` : `${job.start} – Present`;
    twoCol(`${job.title}, ${job.company}`, B, dateStr, R, 11.5, 1);
    line(job.location, I, 10, MARGIN, SUBTLE, 4);
    if (job.description) wrapped(job.description, R, 10.5, 0, 3);
    for (const bullet of job.bullets) {
      const bLines = wrapText(bullet, R, 10.5, CONTENT_WIDTH - 14);
      const lh = 10.5 * 1.35;
      for (let i = 0; i < bLines.length; i++) {
        ensureSpace(lh);
        if (i === 0) page.drawText('•', { x: MARGIN + 2, y, size: 10.5, font: R, color: INK });
        page.drawText(bLines[i], { x: MARGIN + 14, y, size: 10.5, font: R, color: INK });
        y -= lh;
      }
    }
    y -= 6;
  }

  // ── Education ─────────────────────────────────────────────────────────

  section('Education');
  for (const item of education) {
    const dateStr = item.dates.end ? `${item.dates.start} – ${item.dates.end}` : item.dates.start;
    twoCol(item.degree, B, dateStr, R, 11.5, 1);
    line(`${item.institution}, ${item.location}`, I, 10, MARGIN, SUBTLE, 3);
    if (item.description) wrapped(item.description, R, 10, 0, 3);
    y -= 3;
  }

  // ── Courses ───────────────────────────────────────────────────────────

  if (courses?.length) {
    section('Courses');
    for (const course of courses) {
      const dateStr = course.dates.end
        ? `${course.dates.start} – ${course.dates.end}`
        : course.dates.start;
      twoCol(course.title, B, dateStr, R, 11, 1);
      line(`${course.institution}, ${course.location}`, I, 10, MARGIN, SUBTLE, 3);
      if (course.description) wrapped(course.description, R, 10, 0, 3);
      y -= 3;
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────

  if (skills?.length) {
    section('Skills');
    for (const group of skills) {
      const label = `${group.category}: `;
      const labelW = B.widthOfTextAtSize(label, 10.5);
      const skillsStr = group.skills.join(', ');
      const lh = 10.5 * 1.35;
      const skillLines = wrapText(skillsStr, R, 10.5, CONTENT_WIDTH - labelW);

      ensureSpace(lh);
      page.drawText(label, { x: MARGIN, y, size: 10.5, font: B, color: INK });
      if (skillLines[0]) {
        page.drawText(skillLines[0], { x: MARGIN + labelW, y, size: 10.5, font: R, color: INK });
      }
      y -= lh;

      for (let i = 1; i < skillLines.length; i++) {
        ensureSpace(lh);
        page.drawText(skillLines[i], { x: MARGIN + labelW, y, size: 10.5, font: R, color: INK });
        y -= lh;
      }

      y -= 3;
    }
  }

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
