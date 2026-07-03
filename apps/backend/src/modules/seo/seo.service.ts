import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  private siteUrl(): string {
    return (process.env.STOREFRONT_URL || 'https://mart.dosutech.site').replace(/\/$/, '');
  }

  async buildSitemapXml(): Promise<string> {
    const base = this.siteUrl();
    const now = toIsoDate(new Date());

    const [products, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.category.findMany({
        where: { deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const urls: Array<{ loc: string; lastmod?: string; changefreq: string; priority: string }> = [
      { loc: `${base}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
      { loc: `${base}/san-pham`, lastmod: now, changefreq: 'daily', priority: '0.9' },
    ];

    for (const c of categories) {
      urls.push({
        loc: `${base}/san-pham?category=${encodeURIComponent(c.slug)}`,
        lastmod: toIsoDate(c.updatedAt),
        changefreq: 'weekly',
        priority: '0.7',
      });
    }

    for (const p of products) {
      urls.push({
        loc: `${base}/san-pham/${encodeURIComponent(p.slug)}`,
        lastmod: toIsoDate(p.updatedAt),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    const body = urls
      .map(
        (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod ?? now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
  }
}
