'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { login, logout, requireAdmin, logAdmin } from '@/lib/auth';
import * as O from '@/lib/orders';
import { run } from '@/lib/db';
import { setSetting } from '@/lib/settings';
import { cleanText } from '@/lib/security';
import { luandaToUtc } from '@/lib/format';
import { AppError, normalizeCode, createDiscountCode, toggleDiscountCode, deleteDiscountCode } from '@/lib/orders';

export async function loginAction(_prev: { error?: string; email?: string } | undefined, form: FormData): Promise<{ error?: string; email?: string }> {
  const ip = ((await headers()).get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const r = await login(String(form.get('email') || ''), String(form.get('password') || ''), ip);
  if (!r.ok) return { error: r.error, email: String(form.get('email') || '') };
  redirect('/admin');
}
export async function logoutAction() { await logout(); redirect('/admin/login'); }

async function ctx(form: FormData) {
  const adminId = await requireAdmin();
  const id = Number(form.get('id'));
  const order = O.getOrderById(id);
  if (!order) throw new Error('Encomenda não encontrada');
  return { adminId, order, id };
}
function done(id: number, msg: string): never {
  revalidatePath('/admin'); revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?msg=${encodeURIComponent(msg)}`);
}
function guard(id: number, fn: () => void, okMsg: string): never {
  try { fn(); } catch (e) { if (e instanceof O.AppError) done(id, `Erro: ${e.message}`); throw e; }
  done(id, okMsg);
}

export async function confirmPaymentAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminConfirmPayment(order); logAdmin(adminId, 'confirm_payment', order.public_reference); }, 'Pagamento confirmado.'); }
export async function rejectPaymentAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminRejectPayment(order, String(form.get('reason') || '')); logAdmin(adminId, 'reject_payment', order.public_reference, String(form.get('reason') || '')); }, 'Pagamento rejeitado. O cliente pode enviar novo comprovativo.'); }
export async function productionAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminMarkInProduction(order); logAdmin(adminId, 'in_production', order.public_reference); }, 'Marcada como em produção.'); }
export async function publishAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminPublish(order); logAdmin(adminId, 'publish', order.public_reference); }, 'Carta publicada.'); }
export async function blockAction(form: FormData) { const { adminId, order, id } = await ctx(form); const b = form.get('block') === '1'; guard(id, () => { O.adminBlock(order, b); logAdmin(adminId, b ? 'block' : 'unblock', order.public_reference); }, b ? 'Carta bloqueada.' : 'Carta desbloqueada.'); }
export async function completeAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminComplete(order); logAdmin(adminId, 'complete', order.public_reference); }, 'Encomenda marcada como concluída.'); }
export async function cancelAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminCancel(order); logAdmin(adminId, 'cancel', order.public_reference); }, 'Encomenda cancelada.'); }
export async function expiryAction(form: FormData) { const { adminId, order, id } = await ctx(form); const v = String(form.get('expires') || ''); guard(id, () => { O.adminSetExpiry(order, v ? `${v}T23:59:59` : null); logAdmin(adminId, 'set_expiry', order.public_reference, v); }, 'Data de expiração atualizada.'); }
export async function pinAction(form: FormData) { const { adminId, order, id } = await ctx(form); const pin = String(form.get('pin') || ''); guard(id, () => { O.adminSetPin(order, pin || null); logAdmin(adminId, pin ? 'set_pin' : 'clear_pin', order.public_reference); }, pin ? 'PIN ativado.' : 'PIN desativado.'); }
export async function notesAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.adminSetNotes(order, String(form.get('notes') || '')); logAdmin(adminId, 'notes', order.public_reference); }, 'Notas guardadas.'); }
export async function editLetterAction(form: FormData) {
  const { adminId, order, id } = await ctx(form);
  guard(id, () => {
    O.updateLetter(order, { title: String(form.get('title') || '').slice(0, 120) || undefined, intro: String(form.get('intro') || ''), mainMessage: String(form.get('mainMessage') || ''), closingMessage: String(form.get('closingMessage') || '') }, 'admin');
    logAdmin(adminId, 'edit_letter', order.public_reference);
  }, 'Carta atualizada.');
}
export async function deleteContentsAction(form: FormData) { const { adminId, order, id } = await ctx(form); guard(id, () => { O.deleteLetterContents(order.id); logAdmin(adminId, 'delete_contents', order.public_reference); }, 'Conteúdos eliminados (ficheiros e texto).'); }
export async function deleteOrderAction(form: FormData) {
  const { adminId, order } = await ctx(form);
  O.deleteOrderCompletely(order.id); logAdmin(adminId, 'delete_order', order.public_reference);
  revalidatePath('/admin'); redirect('/admin?msg=' + encodeURIComponent(`Encomenda ${order.public_reference} eliminada.`));
}

export async function saveSettingsAction(form: FormData) {
  const adminId = await requireAdmin();
  if (form.get('_group') === 'discount') {
    setSetting('discount_stack_with_promo', form.get('discount_stack_with_promo') ? '1' : '0');
    setSetting('newsletter_code', normalizeCode(String(form.get('newsletter_code') || '')));
    logAdmin(adminId, 'save_discount_settings'); revalidatePath('/', 'layout'); redirect('/admin/settings?msg=' + encodeURIComponent('Opções de desconto guardadas.') + '#descontos');
  }
  const keys = ['whatsapp_number', 'payment_instructions', 'payment_account', 'currency', 'max_image_mb', 'max_video_mb', 'max_audio_mb', 'max_proof_mb', 'default_expiry_days'];
  for (const k of keys) {
    let v = cleanText(String(form.get(k) ?? ''), 1500);
    if (k === 'whatsapp_number') v = v.replace(/\D/g, '');
    if (k.startsWith('max_') || k === 'default_expiry_days') { const n = Number(v); if (!Number.isFinite(n) || n <= 0 || n > 2000) continue; v = String(Math.round(n)); }
    if (v !== '' || k === 'payment_account') setSetting(k, v);
  }
  setSetting('newsletter_popup', form.get('newsletter_popup') ? '1' : '0');
  logAdmin(adminId, 'save_settings');
  revalidatePath('/', 'layout'); redirect('/admin/settings?msg=' + encodeURIComponent('Configurações guardadas.'));
}
export async function savePlanAction(form: FormData) {
  const adminId = await requireAdmin(); const id = Number(form.get('id')); const n = (k: string) => Math.max(0, Math.round(Number(form.get(k)) || 0));
  const features = String(form.get('features') || '').split('\n').map(s => cleanText(s, 120)).filter(Boolean);
  const price = n('price'); const promoRaw = String(form.get('promo_price') ?? '').trim(); const promoEnds = luandaToUtc(String(form.get('promo_ends_at') || ''));
  let promoPrice: number | null = null; let promoEndsAt: string | null = null;
  if (promoRaw !== '') {
    const pp = Math.round(Number(promoRaw)); const t = promoEnds ? new Date(promoEnds.replace(' ', 'T') + 'Z').getTime() : 0;
    if (!Number.isFinite(pp) || pp < 500 || pp >= price) redirect('/admin/settings?msg=' + encodeURIComponent('Erro: o preço promocional tem de ser inferior ao preço normal (mínimo 500).'));
    if (!promoEnds || t < Date.now() + 60_000) redirect('/admin/settings?msg=' + encodeURIComponent('Erro: define uma data de fim da promoção no futuro.'));
    if (t > Date.now() + 90 * 86400_000) redirect('/admin/settings?msg=' + encodeURIComponent('Erro: a promoção pode durar no máximo 90 dias.'));
    promoPrice = pp; promoEndsAt = promoEnds;
  }
  run(`UPDATE plans SET name = ?, description = ?, price = ?, currency = ?, max_photos = ?, max_videos = ?, max_audio_files = ?, max_guests = ?, duration_days = ?, features = ?, is_active = ?, promo_price = ?, promo_ends_at = ? WHERE id = ?`,
    cleanText(String(form.get('name')), 60), cleanText(String(form.get('description')), 200), price, cleanText(String(form.get('currency') || 'Kz'), 8) || 'Kz', n('max_photos'), n('max_videos'), n('max_audio_files'), n('max_guests'), Math.max(1, n('duration_days')), JSON.stringify(features), form.get('is_active') ? 1 : 0, promoPrice, promoEndsAt, id);
  logAdmin(adminId, 'save_plan', String(id)); revalidatePath('/', 'layout'); redirect('/admin/settings?msg=' + encodeURIComponent('Plano guardado.'));
}
export async function saveOccasionAction(form: FormData) {
  const adminId = await requireAdmin(); const id = Number(form.get('id'));
  run('UPDATE occasions SET name = ?, description = ?, default_theme = ?, is_active = ? WHERE id = ?', cleanText(String(form.get('name')), 60), cleanText(String(form.get('description')), 120), cleanText(String(form.get('default_theme')), 20) || 'romantico', form.get('is_active') ? 1 : 0, id);
  logAdmin(adminId, 'save_occasion', String(id)); revalidatePath('/', 'layout'); redirect('/admin/settings?msg=' + encodeURIComponent('Ocasião guardada.'));
}

export async function deleteSubscriberAction(form: FormData) {
  const adminId = await requireAdmin(); const id = Number(form.get('id'));
  if (Number.isInteger(id) && id > 0) { const { deleteSubscriber } = await import('@/lib/newsletter'); deleteSubscriber(id); logAdmin(adminId, 'delete_subscriber', String(id)); }
  revalidatePath('/admin/newsletter'); redirect('/admin/newsletter');
}

export async function createDiscountAction(form: FormData) {
  const adminId = await requireAdmin();
  try {
    createDiscountCode({ code: String(form.get('code') || ''), kind: String(form.get('kind') || 'percent'), value: Number(form.get('value')), appliesTo: String(form.get('applies_to') || 'all'), validUntil: String(form.get('valid_until') || '') || null, maxUses: Number(form.get('max_uses') || 0) });
    logAdmin(adminId, 'create_discount', normalizeCode(String(form.get('code') || '')));
  } catch (e) { redirect('/admin/settings?msg=' + encodeURIComponent('Erro: ' + (e instanceof AppError ? e.message : 'não foi possível criar o código.')) + '#descontos'); }
  revalidatePath('/', 'layout'); redirect('/admin/settings?msg=' + encodeURIComponent('Código criado.') + '#descontos');
}
export async function toggleDiscountAction(form: FormData) {
  const adminId = await requireAdmin(); const id = Number(form.get('id')); if (Number.isInteger(id)) { toggleDiscountCode(id); logAdmin(adminId, 'toggle_discount', String(id)); }
  revalidatePath('/', 'layout'); redirect('/admin/settings#descontos');
}
export async function deleteDiscountAction(form: FormData) {
  const adminId = await requireAdmin(); const id = Number(form.get('id')); if (Number.isInteger(id)) { deleteDiscountCode(id); logAdmin(adminId, 'delete_discount', String(id)); }
  revalidatePath('/', 'layout'); redirect('/admin/settings#descontos');
}
