// Nomes e opções dos cookies, num só sítio.
// Em produção usa o prefixo "__Host-": o browser só aceita o cookie se for Secure, sem Domain e com Path=/,
// o que impede que um subdomínio ou uma ligação HTTP o substitua.
const prod = () => process.env.NODE_ENV === 'production';

export const adminCookieName = () => (prod() ? '__Host-cq_admin' : 'cq_admin');
export const adminCookieOptions = (maxAge: number) => ({ httpOnly: true, secure: prod(), sameSite: 'strict' as const, path: '/', maxAge, priority: 'high' as const });

export const pinCookieName = (letterId: number) => (prod() ? `__Host-cq_pin_${letterId}` : `cq_pin_${letterId}`);
// "lax" para continuar a funcionar quando a carta é aberta a partir de um link do WhatsApp.
export const pinCookieOptions = () => ({ httpOnly: true, secure: prod(), sameSite: 'lax' as const, path: '/', maxAge: 6 * 3600 });
