import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';
import { CATEGORIES } from '@/lib/categories';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.appUrl.replace(/\/$/, '');
  return [{ url: base }, { url: `${base}/precos` }, { url: `${base}/contacto` }, ...CATEGORIES.map(c => ({ url: `${base}/ocasioes/${c.slug}` }))];
}
