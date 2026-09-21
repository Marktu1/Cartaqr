import type { Metadata } from 'next';
import { listPlans, listOccasions, hasActiveDiscountCodes } from '@/lib/orders';
import { getSettings } from '@/lib/settings';
import { aiStatus } from '@/lib/ai';
import { Track } from '@/components/Track';
import { Wizard } from '@/components/wizard/Wizard';

export const metadata: Metadata = { title: 'Criar a minha Carta QR', robots: { index: false } };

export default async function Criar(props: { searchParams: Promise<{ plano?: string; ocasiao?: string }> }) {
  const searchParams = await props.searchParams;
  const s = getSettings();
  const plans = listPlans().map(p => ({ id: p.id, slug: p.slug, kind: p.kind, max_guests: p.max_guests, name: p.name, description: p.description, price: p.price, effective_price: p.effective_price, promo_active: p.promo_active, promo_ends_at: p.promo_ends_at, currency: p.currency, features: p.features, max_photos: p.max_photos, max_videos: p.max_videos, max_audio_files: p.max_audio_files, duration_days: p.duration_days }));
  const occasions = listOccasions().map(o => ({ slug: o.slug, kind: o.kind, name: o.name, description: o.description, default_theme: o.default_theme }));
  return <><Track name="wizard_start" /><Wizard discountsAvailable={hasActiveDiscountCodes()} plans={plans} occasions={occasions} whatsapp={s.whatsapp_number} payment={{ instructions: s.payment_instructions, account: s.payment_account }} aiAvailable={aiStatus().available} initialPlan={searchParams.plano} initialOccasion={searchParams.ocasiao} /></>;
}
