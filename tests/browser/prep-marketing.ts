// Prepara duas encomendas publicadas (uma com entrega agendada) e imprime os tokens em JSON. Usa o mesmo DATA_DIR do servidor.
import { PDF } from '../helpers';
(async () => {
  const O = await import('../../src/lib/orders'); const plans = O.listPlans();
  const mk = (over: Record<string, unknown>) => {
    const { order } = O.createOrder({ occasion: 'aniversario', planId: plans.find(p => p.slug === 'romantico')!.id, recipientName: 'Ana Exemplo', senderName: 'Bruno Exemplo', title: 'Parabéns, Ana! O dia é teu', specialDate: '2026-11-14', contact: '923456789', language: 'pt', theme: 'celebracao', ...over } as any);
    O.updateLetter(order, { mainMessage: 'Ana, hoje o dia é teu. Obrigado por tudo.', closingMessage: 'Parabéns!', ...(over.unlock ? { unlockAt: String(over.unlock) } : {}) });
    let o = O.getOrderById(order.id)!; O.submitOrder(o); o = O.getOrderById(o.id)!; O.submitProof(o, PDF, 'r'); o = O.getOrderById(o.id)!; O.adminConfirmPayment(o); O.adminPublish(O.getOrderById(o.id)!);
    o = O.getOrderById(o.id)!; return { manage: o.manage_token, letter: O.getLetterByOrder(o.id)!.secure_token };
  };
  const at = new Date(Date.now() + 26 * 3600_000 + 3600_000).toISOString().slice(0, 16); // daqui a ~26 h (hora de Luanda)
  console.log('PREP=' + JSON.stringify({ locked: mk({ unlock: at }), normal: mk({}) }));
})();
