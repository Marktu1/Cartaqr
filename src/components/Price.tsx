import { formatDate, formatMoney, utcToLuanda } from '@/lib/format';

type P = { price: number; currency: string; promo_active?: boolean; effective_price?: number; promo_ends_at?: string | null };
/** Mostra o preço. Em promoção real (com data de fim) mostra o preço normal riscado, que é o que se cobra depois. */
export function Price({ plan, className = 'text-3xl font-bold text-ink' }: { plan: P; className?: string }) {
  if (!plan.promo_active || plan.effective_price == null) return <span className={className}>{formatMoney(plan.price, plan.currency)}</span>;
  const until = formatDate(utcToLuanda(plan.promo_ends_at).slice(0, 10));
  return (
    <span className="inline-flex flex-col">
      <span className="text-sm text-muted"><s aria-label={`Preço normal ${formatMoney(plan.price, plan.currency)}`}>{formatMoney(plan.price, plan.currency)}</s> <span className="chip !bg-gold-deep !text-white">Promoção</span></span>
      <span className={className.replace('text-ink', 'text-wine')}>{formatMoney(plan.effective_price, plan.currency)}</span>
      <span className="text-xs font-semibold text-gold-deep">Preço promocional até {until}, depois {formatMoney(plan.price, plan.currency)}</span>
    </span>
  );
}
